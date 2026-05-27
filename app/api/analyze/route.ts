import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from '@/lib/extractText'
import { maskPII } from '@/lib/maskPII'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const baseTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '한국어 이력서를 분석하여 구직자의 강점, 개선점, 커리어 방향을 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      job_title: {
        type: 'string',
        description: '이력서에서 파악된 현재 또는 목표 직무명 (예: 백엔드 개발자, 마케팅 매니저)',
      },
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      careers: {
        type: 'array',
        items: { type: 'string' },
        description: '추천 커리어 방향 (1가지)',
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: '이력서의 핵심 강점 (최대 4개)',
      },
      improvements: {
        type: 'array',
        items: { type: 'string' },
        description: '개선이 필요한 부분 (최대 4개)',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '이력서에서 발견된 핵심 키워드 (최대 8개)',
      },
      summary: {
        type: 'string',
        description: '지원자에 대한 전체 요약 (2-3문장)',
      },
    },
    required: ['job_title', 'scores', 'careers', 'strengths', 'improvements', 'keywords', 'summary'],
  },
}

const proTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '한국어 이력서를 분석하여 구직자의 강점, 개선점, 커리어 방향을 상세히 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      job_title: {
        type: 'string',
        description: '이력서에서 파악된 현재 또는 목표 직무명 (예: 백엔드 개발자, 마케팅 매니저)',
      },
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: '이력서의 핵심 강점 (최대 4개)',
      },
      improvements: {
        type: 'array',
        items: { type: 'string' },
        description: '개선이 필요한 부분 (최대 4개)',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '이력서에서 발견된 핵심 키워드 (최대 8개)',
      },
      summary: {
        type: 'string',
        description: '지원자에 대한 전체 요약 (2-3문장)',
      },
      career_paths: {
        type: 'array',
        description: '3가지 커리어 경로: BASELINE(현재 경로 유지), RECOMMENDED(추천 경로), STRETCH(고성장 경로) 순서로 반드시 3개',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'BASELINE 또는 RECOMMENDED 또는 STRETCH' },
            label: { type: 'string', description: '현재 경로 유지 또는 추천 경로 또는 고성장 경로' },
            title: { type: 'string', description: '직무명 (예: Product Manager, 마케팅 팀장)' },
            salary_range: { type: 'string', description: '예상 연봉 범위 (예: 4,500만원~6,500만원)' },
            salary_bands: {
              type: 'array',
              description: '연봉 밴드 (1년 뒤, 3년 뒤, 5년 뒤, 7년 뒤+ 순서로 4개)',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  min: { type: 'number', description: '최솟값 (만원)' },
                  max: { type: 'number', description: '최댓값 (만원), 상한 없으면 0' },
                },
                required: ['period', 'min', 'max'],
              },
            },
            points: {
              type: 'array',
              items: { type: 'string' },
              description: '이 경로에 대한 구체적인 조언 3~4개',
            },
          },
          required: ['type', 'label', 'title', 'salary_range', 'salary_bands', 'points'],
        },
      },
    },
    required: ['job_title', 'scores', 'career_paths', 'strengths', 'improvements', 'keywords', 'summary'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { email, role } = session.user

    // 쿠폰 체크 (MANAGER 제외)
    let resumeCouponId: string | null = null
    if (role !== 'MANAGER') {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('id, expires_at')
        .eq('claimed_by', email)
        .eq('feature', 'resume')
        .is('used_at', null)
      const now = new Date()
      const valid = (coupons ?? []).find(c => !c.expires_at || new Date(c.expires_at) > now)
      if (valid) resumeCouponId = valid.id
    }

    if (role !== 'MANAGER' && !resumeCouponId) {
      const { data: userData } = await supabase
        .from('users')
        .select('plan, analyze_count, analyze_reset_at')
        .eq('email', email)
        .single()

      if (userData) {
        const resetAt = new Date(userData.analyze_reset_at)
        if (new Date() >= resetAt) {
          const nextReset = new Date()
          nextReset.setMonth(nextReset.getMonth() + 1)
          nextReset.setDate(1)
          nextReset.setHours(0, 0, 0, 0)
          await supabase
            .from('users')
            .update({ analyze_count: 0, analyze_reset_at: nextReset.toISOString() })
            .eq('email', email)
          userData.analyze_count = 0
        }

        const planLimits: Record<string, number> = { FREE: 1, PRO: 10, EXPERT: 30 }
        const limit = planLimits[userData.plan] ?? 1
        if (userData.analyze_count >= limit) {
          return NextResponse.json(
            { error: `이번 달 이력서 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하거나 쿠폰을 등록하세요.` },
            { status: 403 }
          )
        }
      }
    }

    const formData = await req.formData()
    const file = formData.get('resume') as File | null
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    let resumeText: string
    try {
      resumeText = await extractText(buffer, file.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '파일을 읽을 수 없습니다.'
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: '이력서에서 텍스트를 추출할 수 없습니다.' }, { status: 422 })
    }

    const nameMatch = resumeText.match(
      /(이름|성명|Name|성 명|성함)\s*[:：]?\s*([가-힣]{2,5}|[a-zA-Z]{2,30}(?:\s[a-zA-Z]{1,20})?)/i
    )
    const candidateName = nameMatch ? nameMatch[2].trim() : undefined

    const maskedText = maskPII(resumeText)

    const { data: planData } = await supabase
      .from('users').select('plan').eq('email', email).single()

    const plan = role === 'MANAGER' ? 'EXPERT' : (planData?.plan ?? 'FREE')
    const isPro = plan === 'PRO' || plan === 'EXPERT'
    const tool = isPro ? proTool : baseTool

    const headhunterBase = `당신은 10년 경력의 한국 시니어 헤드헌터입니다. 반도체, 로보틱스, 배터리, AI/fintech, 화장품 R&D, 자동차, 금융회계 등 다양한 산업군에서 임원~전문직급 서치를 수행해왔습니다.

이력서를 읽는 목적은 하나입니다: "이 사람을 클라이언트에게 제안할 수 있는가, 있다면 어떤 포지션에, 어떤 포인트로 제안하는가."
절대로 이력서를 요약하거나 나열하지 마십시오. 해석하고 판단하고 전략을 내십시오.`

    const prompt = isPro
      ? `${headhunterBase}

[분석 절차]
STEP 1 — 후보자 기본 프로파일 파악
총 경력 연수는 반드시 직접 계산하십시오(후보자 기재 숫자를 그대로 믿지 말 것). 현 직장/직급/재직기간, 이직 횟수, 평균 재직기간, 추정 연봉 범위(업계 시세 기반, 명시된 경우 그대로)를 파악하십시오.

STEP 2 — 커리어 패턴 독해
[성장형/전환형/순환형/분산형] 중 하나로 판단하고, summary 필드에 "이 후보자의 커리어는 [패턴]이며, [이유]" 형식으로 반드시 명시하십시오.

STEP 3 — 강점/리스크/공백 3분류
- strengths: 구체적 수치·프로젝트명·결과물이 있는 항목만. "성과 없는 경험"은 강점 불가.
- improvements: ① 리스크(짧은 재직기간, 직급 대비 성과 불명확, 처우-시세 괴리 등) + ② 공백(해당 직군 통상 요구 역량 중 이력서에 근거 없는 것). 모든 항목을 강점으로 처리 금지.

STEP 4 — 이직 동기 추정
이력서 패턴에서 역으로 추정하여 summary에 반영하십시오. (재직 3년차 대리급 이직→승진 누락, 스타트업→대기업→안정 추구, 공백 6개월+→비자발적 이직 가능성, 동일 직급 반복→관리직 전환 실패 등)

[커리어 경로 3가지]
BASELINE: 현재 방향 유지 시 현실적 예상 경로 / RECOMMENDED: 강점 최대 활용 헤드헌터 추천 방향 / STRETCH: 2~3년 준비 후 도달 가능한 고성장 경로(리스크 포함)

[출력 규칙] 빈 말("다양한 경험", "훌륭한 경력") 절대 금지. 후보자가 쓴 표현 검증 없이 수용 금지. 날짜·경력 계산 오류 금지.

---
[이력서]
${maskedText}
---`
      : `${headhunterBase}

[분석 절차]
STEP 1 — 총 경력 연수 직접 계산, 현 직장/직급, 이직 횟수, 추정 연봉 범위 파악.
STEP 2 — 커리어 패턴: [성장형/전환형/순환형/분산형] 판단 후 summary에 한 문장으로 명시.
STEP 3 — strengths는 수치·결과물 있는 항목만. improvements에는 리스크와 공백 모두 포함.
STEP 4 — 이직 동기를 이력서 패턴에서 역추정하여 summary에 반영.

[출력 규칙] careers 1가지는 가장 적합한 포지션 직무명으로. 빈 말·근거 없는 강점 처리 금지.

---
[이력서]
${maskedText}
---`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPro ? 4096 : 2048,
      tool_choice: { type: 'tool', name: 'analyze_resume' },
      tools: [tool],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
    }

    if (resumeCouponId) {
      await supabase.from('coupons').update({ used_at: new Date().toISOString() }).eq('id', resumeCouponId)
    } else if (role !== 'MANAGER') {
      await supabase.rpc('increment_analyze_count', { user_email: email })
    }

    const resultPayload = {
      ...(toolUse.input as object),
      plan,
      ...(candidateName ? { candidate_name: candidateName } : {}),
    }

    const { error: insertError } = await supabase.from('analyses').insert({
      user_email: email,
      result: resultPayload,
    })
    if (insertError) console.error('[analyze] insert error:', insertError)

    return NextResponse.json(resultPayload)
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
