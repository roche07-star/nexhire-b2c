import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { extractText } from '@/lib/extractText'
import { generateResumeDocx, RewriteResult } from '@/lib/generateDocx'
import { extractDocxParagraphs, applyDocxRewrites } from '@/lib/rewriteDocxInPlace'

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
    if (!analysisId) return NextResponse.json({ error: '분析 ID가 없습니다.' }, { status: 400 })

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return NextResponse.json({ error: '분析을 찾을 수 없습니다.' }, { status: 404 })

    const filePath: string | undefined = row.result?._file_path
    if (!filePath) {
      return NextResponse.json(
        { error: '원본 파일이 저장되어 있지 않습니다. 이 기능은 이후 업로드된 이력서부터 사용 가능합니다.' },
        { status: 404 }
      )
    }

    const { data: fileData, error: fileErr } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (fileErr || !fileData) {
      return NextResponse.json({ error: '원본 파일을 불러올 수 없습니다.' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const originalFilename = filePath.split('/').pop() ?? 'resume'
    const ext = originalFilename.split('.').pop()?.toLowerCase() ?? ''

    const candidateName = (row.result?.candidate_name as string | undefined) ?? '이력서'
    const dateStr = new Date().toISOString().slice(0, 10)

    // ── DOCX: 서식 완전 보존 (XML 직접 수정)
    if (ext === 'docx') {
      const paras = await extractDocxParagraphs(buffer)
      const nonEmpty = paras.filter(p => p.text.trim())

      const paraList = nonEmpty
        .map((p, i) => `[${i + 1}] ${p.text}`)
        .join('\n')

      const prompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.
아래 이력서 단락들을 채용 담당자가 긍정적으로 읽히도록 재작성하십시오.

[작업 원칙]
- 단락 순서와 개수를 절대 바꾸지 않습니다 (입력과 동일한 수의 rewrites 반환)
- 내용은 원본 기반으로만 작성합니다 — 없는 경험을 추가하거나 과장하지 않습니다
- 해당 경력 연차와 한국 채용 시장 정서에 맞게 표현을 다듬습니다
- 구분자는 "/" 를 사용합니다 — "·" (가운데점) 는 절대 사용하지 않습니다
- 이름·날짜·회사명·숫자 등 사실 정보는 원본 그대로 유지합니다
- 단락이 단순 구분선이거나 변경이 불필요한 경우 원본 텍스트를 그대로 반환합니다

[이력서 단락 목록] (총 ${nonEmpty.length}개)
${paraList}`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        tool_choice: { type: 'tool', name: 'rewrite_paragraphs' },
        tools: [
          {
            name: 'rewrite_paragraphs',
            description: '각 단락을 재작성한 결과',
            input_schema: {
              type: 'object' as const,
              properties: {
                rewrites: {
                  type: 'array',
                  description: `입력된 ${nonEmpty.length}개 단락 순서 그대로, 각각 재작성된 텍스트 (반드시 ${nonEmpty.length}개)`,
                  items: { type: 'string' },
                },
              },
              required: ['rewrites'],
            },
          },
        ],
        messages: [{ role: 'user', content: prompt }],
      })

      const toolUse = message.content.find(c => c.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        return NextResponse.json({ error: 'Re-Writing 결과를 받지 못했습니다.' }, { status: 500 })
      }

      const { rewrites } = toolUse.input as { rewrites: string[] }

      // nonEmpty 인덱스 → 전체 paras 배열에 매핑
      const allRewrites = paras.map(p => {
        const nonEmptyIdx = nonEmpty.findIndex(ne => ne.index === p.index)
        return nonEmptyIdx !== -1 ? (rewrites[nonEmptyIdx] ?? p.text) : p.text
      })

      const docxBuffer = await applyDocxRewrites(buffer, allRewrites)
      const downloadName = `jobizic_rewrite_${candidateName}_${dateStr}.docx`

      return new NextResponse(docxBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        },
      })
    }

    // ── PDF / 기타: 텍스트 추출 후 섹션 기반 새 DOCX 생성
    const resumeText = await extractText(buffer, originalFilename)

    const prompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.
아래 이력서를 원본의 섹션 구성을 그대로 유지하면서 재작성하십시오.

[작업 원칙]
- 원본 이력서에 있는 모든 섹션을 빠짐없이 포함합니다 (인적사항, 학력, 경력사항, 자격/면허, 기타사항, 연봉사항, 지원사유 및 포부 등 원본에 있는 항목 전부)
- 섹션의 순서와 제목은 원본 그대로 유지합니다
- 내용은 원본 이력서 기반으로만 작성합니다 — 없는 경험을 추가하거나 과장하지 않습니다
- 해당 경력 연차에 맞는 어감과 한국 채용 시장 정서에 맞게 문장을 다듬습니다
- 채용 담당자가 긍정적으로 읽히도록 포지셔닝과 표현을 조율합니다
- 구분자는 "/" 를 사용합니다 — "·" (가운데점) 는 절대 사용하지 않습니다
- 경력이 여러 개인 경우 최근 경력에 가중치를 두어 서술합니다
- 각 섹션의 content는 줄바꿈(\\n)으로 구분하여 작성합니다
- 목록 항목은 줄 앞에 "- " 를 붙입니다

[원본 이력서]
${resumeText}
[/원본 이력서]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      tool_choice: { type: 'tool', name: 'rewrite_resume' },
      tools: [
        {
          name: 'rewrite_resume',
          description: '원본 이력서의 모든 섹션을 유지하며 재작성한 결과',
          input_schema: {
            type: 'object' as const,
            properties: {
              candidate_name: {
                type: 'string',
                description: '후보자 이름 (원본에서 추출, 없으면 빈 문자열)',
              },
              sections: {
                type: 'array',
                description: '원본 이력서의 모든 섹션을 순서대로 재작성한 목록',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '섹션 제목 (원본 그대로)' },
                    content: { type: 'string', description: '재작성된 섹션 내용. \\n으로 구분. 목록은 "- "로 시작.' },
                  },
                  required: ['title', 'content'],
                },
              },
            },
            required: ['sections'],
          },
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find(c => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Re-Writing 결과를 받지 못했습니다.' }, { status: 500 })
    }

    const rewriteData = toolUse.input as RewriteResult
    if (!rewriteData.candidate_name) rewriteData.candidate_name = candidateName
    const docxBuffer = await generateResumeDocx(rewriteData)
    const downloadName = `jobizic_rewrite_${rewriteData.candidate_name}_${dateStr}.docx`

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
