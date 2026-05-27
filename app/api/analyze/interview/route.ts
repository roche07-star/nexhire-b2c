import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return []
}

const interviewTool: Anthropic.Tool = {
  name: 'generate_interview_guide',
  description: '후보자 맞춤형 면접 가이드를 6개 섹션으로 생성합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      positioning_message: {
        type: 'string',
        description: 'SECTION 1 — 후보자 핵심 포지셔닝 메시지 (한 문장, 구체적으로)',
      },
      self_intro: {
        type: 'string',
        description: 'SECTION 2 — 자기소개 설계. 커리어 흐름(30초), 핵심 역량 3가지(수치 포함), 포지션 연결(30초) 포함. 줄바꿈으로 구분.',
      },
      qa_resign_reason: {
        type: 'string',
        description: 'SECTION 3A — 이직 사유 답변 가이드. 전 직장 비판 없이, 구조: 환경 변화 → 방향 불일치 → 이 포지션 선택 이유.',
      },
      qa_domain_gap: {
        type: 'string',
        description: 'SECTION 3B — 도메인 갭 대응 (갭이 없으면 "해당없음"). 갭을 회피하지 말고 방법론 전이 가능성 중심으로.',
      },
      qa_competency: {
        type: 'string',
        description: 'SECTION 3C — JD 핵심 역량별 STAR 답변 가이드. Situation/Task/Action/Result 구조. 주요 2~3개 역량.',
      },
      qa_post_join: {
        type: 'string',
        description: 'SECTION 3D — 입사 후 계획 답변 (JD 과제 역으로 언급, 기여 가능 영역 1~2개).',
      },
      qa_salary: {
        type: 'string',
        description: 'SECTION 3E — 희망 연봉 답변 가이드 (회사 밴드 먼저 유도, 현재 연봉 기준).',
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: 'SECTION 4 — 면접에서 반드시 어필할 강점 (JD 필수 요건 매칭, 수치 포함, 3개).',
      },
      risks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            risk: { type: 'string' },
            response: { type: 'string' },
          },
          required: ['risk', 'response'],
        },
        description: 'SECTION 4 — 면접관이 우려할 리스크와 대응 전략 (2~3개).',
      },
      reverse_questions: {
        type: 'array',
        items: { type: 'string' },
        description: 'SECTION 5 — 면접 말미 역질문 추천 (조직 구조, 핵심 과제, 6개월 기대 성과 관련, 2~3개).',
      },
      checklist: {
        type: 'array',
        items: { type: 'string' },
        description: 'SECTION 6 — 면접 전 체크리스트 (7~8개, 이 후보자에게 맞춤화).',
      },
    },
    required: [
      'positioning_message', 'self_intro',
      'qa_resign_reason', 'qa_domain_gap', 'qa_competency', 'qa_post_join', 'qa_salary',
      'strengths', 'risks', 'reverse_questions', 'checklist',
    ],
  },
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

    const { analysisId, jdAnalysisId, interviewFormat, interviewerInfo, specialNotes } = await req.json()
    if (!analysisId) return NextResponse.json({ error: '분석 ID가 없습니다.' }, { status: 400 })

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return NextResponse.json({ error: '분석을 찾을 수 없습니다.' }, { status: 404 })

    let jdContext: Record<string, unknown> | null = null
    if (jdAnalysisId) {
      const { data: jdRow } = await supabase
        .from('jd_analyses')
        .select('result')
        .eq('id', jdAnalysisId)
        .eq('user_email', email)
        .single()
      if (jdRow?.result) jdContext = jdRow.result as Record<string, unknown>
    }

    const a = row.result as Record<string, unknown>
    const careerSummary = Array.isArray(a.career_paths)
      ? (a.career_paths as Array<{ type: string; title: string; salary_range: string }>)
          .map(p => `${p.type}: ${p.title} (${p.salary_range})`)
          .join(' | ')
      : ''

    const candidateProfile = `직무: ${(a.job_title as string) ?? '미상'}
종합 요약: ${(a.summary as string) ?? ''}
핵심 강점: ${toArr(a.strengths).join(' / ')}
개선 필요: ${toArr(a.improvements).join(' / ')}
핵심 키워드: ${toArr(a.keywords).join(', ')}
${careerSummary ? `커리어 경로: ${careerSummary}` : ''}`

    const jdSection = jdContext
      ? `[채용 회사]: ${jdContext.company}${jdContext.position ? ` — ${jdContext.position}` : ''}
[JD 적합도 분석]:
- 적합도: ${jdContext.fit_score}% / ${jdContext.verdict}
- 매칭 강점: ${toArr(jdContext.matching_points).join(' / ')}
- 보완 필요: ${toArr(jdContext.gaps).join(' / ')}
- 피치 포인트: ${toArr(jdContext.pitch_points).join(' / ')}`
      : '[JD 미선택 — 일반 헤드헌터 관점으로 작성]'

    const additionalLines = [
      interviewFormat && `면접 형식: ${interviewFormat}`,
      interviewerInfo && `면접관: ${interviewerInfo}`,
      specialNotes && `특이사항: ${specialNotes}`,
    ].filter(Boolean).join('\n')

    const prompt = `🎯 역할 정의
당신은 10년 경력의 한국 시니어 헤드헌터입니다.
후보자가 면접에서 최상의 퍼포먼스를 낼 수 있도록 JD와 후보자 프로파일을 기반으로 맞춤형 면접 가이드를 작성합니다.
일반적인 면접 팁을 나열하지 마십시오.
이 후보자가, 이 회사의, 이 포지션 면접에서 구체적으로 무엇을 어떻게 말해야 하는지를 설계하십시오.

[후보자 이력서 분석 결과]
${candidateProfile}

[채용 정보]
${jdSection}
${additionalLines ? `\n[추가 정보]\n${additionalLines}` : ''}

🚫 절대 하지 말 것
❌ 일반적인 면접 팁 나열 (이 후보자에게 맞춤화되지 않은 내용)
❌ 없는 경험이나 성과를 답변에 포함하도록 유도
❌ 전 직장 비판, 인간관계 갈등, 연봉 불만을 이직 사유로 언급
❌ STAR 답변에서 팀 성과를 개인 성과로 포장
❌ 도메인 갭을 답변에서 회피하거나 축소`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      tool_choice: { type: 'tool', name: 'generate_interview_guide' },
      tools: [interviewTool],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find(c => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '면접 가이드를 생성하지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      ...(toolUse.input as object),
      company: jdContext?.company ?? null,
      position: jdContext?.position ?? null,
      candidate_name: (a.candidate_name as string | undefined) ?? null,
    })
  } catch (e) {
    console.error('[analyze/interview]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
