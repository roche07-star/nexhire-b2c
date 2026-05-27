import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { extractText } from '@/lib/extractText'
import { generateResumeDocx, RewriteResult } from '@/lib/generateDocx'
import { extractDocxParagraphs, applyDocxRewrites } from '@/lib/rewriteDocxInPlace'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface JDContext {
  company: string
  fit_score: number
  verdict: string
  matching_points: string[]
  gaps: string[]
  pitch_points: string[]
}

function buildJDSection(jd: JDContext): string {
  return `
[JD 분析 정보 — 이 이력서를 ${jd.company} 포지션에 추천하기 위한 전략 정보]
채용사: ${jd.company}
적합도 판단: ${jd.fit_score}% / ${jd.verdict}
강점 포인트 (이력서에서 더 부각할 것):
${jd.matching_points.map(p => `  - ${p}`).join('\n')}
보완 포인트 (긍정적으로 재프레이밍할 것):
${jd.gaps.map(g => `  - ${g}`).join('\n')}
헤드헌터 피치 포인트 (이력서 전체 톤에 반영할 것):
${jd.pitch_points.map(p => `  - ${p}`).join('\n')}
`
}

function buildDocxPrompt(paraList: string, count: number, jd: JDContext | null): string {
  const jdSection = jd
    ? buildJDSection(jd)
    : '\n[JD 미선택 — 일반 헤드헌터 관점으로 재작성]\n'

  return `당신은 10년 경력의 한국 시니어 헤드헌터입니다.${jd ? ` 현재 ${jd.company} 포지션에 이 후보자를 추천하기 위해 이력서를 재작성합니다.` : ''}
${jdSection}
[재작성 원칙]
1. 경력 성과를 결과 중심으로 전환합니다 — "담당" → "주도", "참여" → "기여/달성", "수행" → "구현/달성"
2. 원본에 있는 수치·기술명·회사명·기간은 반드시 유지합니다 (없는 수치 추가 절대 금지)
3. 각 경력 항목은 임팩트와 기여도가 명확하게 드러나도록 문장을 구성합니다${jd ? `
4. JD 피치 포인트를 이력서 전반에 자연스럽게 녹여냅니다
5. 강점 포인트는 더 구체적이고 임팩트 있게 표현합니다
6. 보완 포인트는 약점 노출이 아닌 강점으로 전환하여 서술합니다` : `
4. 채용 담당자가 긍정적으로 읽히도록 포지셔닝과 문장을 조율합니다`}
7. 구분자 "/" 사용, "·" (가운데점) 절대 금지
8. 해당 경력 연차에 맞는 한국 채용 시장 어감을 유지합니다
9. 이직이 여러 번인 경우 최근 경력에 가중치를 둡니다
10. 단락이 이름·날짜·구분선 등 단순 정보이면 원본 그대로 반환합니다

[이력서 단락 목록] (총 ${count}개 — 반드시 ${count}개 반환)
${paraList}`
}

function buildSectionPrompt(resumeText: string, jd: JDContext | null): string {
  const jdSection = jd ? buildJDSection(jd) : '\n[JD 미선택 — 일반 헤드헌터 관점으로 재작성]\n'

  return `당신은 10년 경력의 한국 시니어 헤드헌터입니다.${jd ? ` 현재 ${jd.company} 포지션에 이 후보자를 추천하기 위해 이력서를 재작성합니다.` : ''}
${jdSection}
[재작성 원칙]
- 원본 이력서에 있는 모든 섹션을 빠짐없이 포함합니다 (인적사항, 학력, 경력사항, 자격/면허, 기타사항, 연봉사항, 지원사유 및 포부 등 원본에 있는 항목 전부)
- 섹션의 순서와 제목은 원본 그대로 유지합니다
- 경력 성과를 결과 중심으로 전환합니다 — "담당" → "주도", "참여" → "기여/달성", "수행" → "구현/달성"
- 원본에 있는 수치·기술명·회사명·기간은 반드시 유지합니다 (없는 수치 추가 절대 금지)${jd ? `
- JD 피치 포인트를 이력서 전반에 자연스럽게 녹여냅니다
- 강점 포인트는 더 구체적이고 임팩트 있게 표현합니다
- 보완 포인트는 긍정적으로 재프레이밍합니다` : `
- 채용 담당자가 긍정적으로 읽히도록 포지셔닝과 문장을 조율합니다`}
- 구분자 "/" 사용, "·" (가운데점) 절대 금지
- 해당 경력 연차에 맞는 한국 채용 시장 어감을 유지합니다
- 이직이 여러 번인 경우 최근 경력에 가중치를 둡니다
- 각 섹션의 content는 줄바꿈(\\n)으로 구분, 목록 항목은 "- "로 시작합니다

[원본 이력서]
${resumeText}
[/원본 이력서]`
}

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

    const { analysisId, jdAnalysisId } = await req.json()
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

    // JD 컨텍스트 로드 (선택적)
    let jdContext: JDContext | null = null
    if (jdAnalysisId) {
      const { data: jdRow } = await supabase
        .from('jd_analyses')
        .select('result')
        .eq('id', jdAnalysisId)
        .eq('user_email', email)
        .single()
      if (jdRow?.result) {
        jdContext = jdRow.result as JDContext
      }
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

      const paraList = nonEmpty.map((p, i) => `[${i + 1}] ${p.text}`).join('\n')
      const prompt = buildDocxPrompt(paraList, nonEmpty.length, jdContext)

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
      const allRewrites = paras.map(p => {
        const nonEmptyIdx = nonEmpty.findIndex(ne => ne.index === p.index)
        return nonEmptyIdx !== -1 ? (rewrites[nonEmptyIdx] ?? p.text) : p.text
      })

      const docxBuffer = await applyDocxRewrites(buffer, allRewrites)
      const suffix = jdContext ? `_${jdContext.company}` : ''
      const downloadName = `jobizic_rewrite_${candidateName}${suffix}_${dateStr}.docx`

      return new NextResponse(docxBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        },
      })
    }

    // ── PDF / 기타: 텍스트 추출 후 섹션 기반 새 DOCX
    const resumeText = await extractText(buffer, originalFilename)
    const prompt = buildSectionPrompt(resumeText, jdContext)

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
              candidate_name: { type: 'string', description: '후보자 이름 (원본에서 추출, 없으면 빈 문자열)' },
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
    const suffix = jdContext ? `_${jdContext.company}` : ''
    const downloadName = `jobizic_rewrite_${rewriteData.candidate_name}${suffix}_${dateStr}.docx`

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
