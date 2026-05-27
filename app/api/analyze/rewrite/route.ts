import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { extractText } from '@/lib/extractText'
import { generateResumeDocx, RewriteResult } from '@/lib/generateDocx'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    const { data: userData } = await supabase.from('users').select('plan').eq('email', email).single()
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')
    if (plan !== 'EXPERT') {
      return NextResponse.json({ error: 'EXPERT 플랜에서만 사용 가능합니다.' }, { status: 403 })
    }

    const { analysisId } = await req.json()
    if (!analysisId) return NextResponse.json({ error: '분석 ID가 없습니다.' }, { status: 400 })

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return NextResponse.json({ error: '분석을 찾을 수 없습니다.' }, { status: 404 })

    const filePath: string | undefined = row.result?._file_path
    if (!filePath) {
      return NextResponse.json(
        { error: '원본 파일이 저장되어 있지 않습니다. 이 기능은 이후 업로드된 이력서부터 사용 가능합니다.' },
        { status: 404 }
      )
    }

    // Storage에서 원본 파일 다운로드
    const { data: fileData, error: fileErr } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (fileErr || !fileData) {
      return NextResponse.json({ error: '원본 파일을 불러올 수 없습니다.' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const originalFilename = filePath.split('/').pop() ?? 'resume.pdf'
    const resumeText = await extractText(buffer, originalFilename)

    const prompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.
아래 이력서를 다음 원칙에 따라 re-writing 하십시오.

[작업 원칙]
- 기존 이력서의 항목 구성과 양식은 그대로 유지합니다
- 내용은 원본 이력서 기반으로만 작성합니다 — 과장하거나 없는 경험을 추가하지 않습니다
- 해당 경력 연차에 맞는 어감과 한국 채용 시장 정서에 맞게 표현을 다듬습니다
- 채용사 담당자가 긍정적으로 읽히도록 포지셔닝과 문장을 조율합니다
- 이직이 여러 번인 경우, 최근 경력에 가중치를 두어 서술합니다
- 구분자는 "/" 를 사용합니다 — "·" (가운데점) 는 절대 사용하지 않습니다

[작업 항목]
1. 경력 연차: 총 경력 연수와 직무별 경력을 "/" 로 구분하여 한 줄로 요약
2. 핵심 역량 / 업무상 강점: 핵심 역량 3~5개 (구체적 수치/기술 포함)
3. 세부 경력 사항: 각 회사별 업무 내용과 성과를 재작성 (최근 경력에 가중치)
4. 자기소개: 3~5문장, 지원자의 포지셔닝이 명확하게
5. 이직 사유: 각 이직마다 채용사가 납득할 수 있는 긍정적 서술

[원본 이력서]
${resumeText}
[/원본 이력서]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tool_choice: { type: 'tool', name: 'rewrite_resume' },
      tools: [
        {
          name: 'rewrite_resume',
          description: '이력서 Re-Writing 결과',
          input_schema: {
            type: 'object' as const,
            properties: {
              candidate_name: { type: 'string', description: '후보자 이름 (원본에서 추출, 없으면 빈 문자열)' },
              job_title: { type: 'string', description: '직무명 (예: 백엔드 개발자 / 5년)' },
              career_years: { type: 'string', description: '경력 연차 요약 (예: 총 8년 / 백엔드 개발 6년 / 팀 리드 2년)' },
              core_competencies: {
                type: 'array',
                items: { type: 'string' },
                description: '핵심 역량 3~5개',
              },
              careers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    company: { type: 'string' },
                    period: { type: 'string', description: '예: 2020.03 ~ 현재' },
                    role: { type: 'string', description: '직책 / 직급' },
                    tasks: { type: 'array', items: { type: 'string' }, description: '주요 업무 3~5개' },
                    achievements: { type: 'array', items: { type: 'string' }, description: '주요 성과 (있을 경우)' },
                  },
                  required: ['company', 'period', 'role', 'tasks'],
                },
              },
              self_introduction: { type: 'string', description: '자기소개 (3~5문장)' },
              job_change_reasons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: '예: A사 → B사 (2022.03)' },
                    reason: { type: 'string', description: '이직 사유 (긍정적 서술)' },
                  },
                  required: ['label', 'reason'],
                },
              },
            },
            required: ['career_years', 'core_competencies', 'careers', 'self_introduction', 'job_change_reasons'],
          },
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Re-Writing 결과를 받지 못했습니다.' }, { status: 500 })
    }

    const rewriteData = toolUse.input as RewriteResult
    const docxBuffer = await generateResumeDocx(rewriteData)

    const candidateName = rewriteData.candidate_name ?? '이력서'
    const dateStr = new Date().toISOString().slice(0, 10)
    const downloadName = `jobizic_rewrite_${candidateName}_${dateStr}.docx`

    return new NextResponse(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      },
    })
  } catch (e) {
    console.error('[analyze/rewrite]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
