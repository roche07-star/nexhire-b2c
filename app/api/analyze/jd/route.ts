import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const jdTool: Anthropic.Tool = {
  name: 'analyze_jd_fit',
  description: '후보자의 이력서 분석 결과와 채용공고를 비교하여 적합도를 분석합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      fit_score: { type: 'number', description: '채용공고 적합도 (0-100)' },
      recommendation: {
        type: 'string',
        description: 'APPLY(지원 강력 추천) 또는 CONSIDER(조건부 추천) 또는 SKIP(부적합)',
      },
      verdict: {
        type: 'string',
        description: '한 줄 판정 — 솔직하고 날카롭게 (예: "핵심 기술 스택 80% 부합, 리더십 경험 공백이 유일한 약점")',
      },
      matching_points: {
        type: 'array',
        items: { type: 'string' },
        description: 'JD 요구사항과 이력서가 정확히 일치하는 강점 (3-5개, 구체적으로)',
      },
      gaps: {
        type: 'array',
        items: { type: 'string' },
        description: 'JD 요구사항 중 이력서에 없거나 부족한 항목 (2-4개, 솔직하게)',
      },
      pitch_points: {
        type: 'array',
        items: { type: 'string' },
        description: '이 JD에 지원할 때 서류/면접에서 적극 어필해야 할 전략 (4-6개, 구체적으로)',
      },
    },
    required: ['fit_score', 'recommendation', 'verdict', 'matching_points', 'gaps', 'pitch_points'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role

    // JD 쿠폰 체크
    let jdCouponId: string | null = null
    if (userRole !== 'MANAGER') {
      const { data: jdCoupons } = await supabase
        .from('coupons')
        .select('id, expires_at')
        .eq('claimed_by', session.user.email)
        .eq('feature', 'jd')
        .is('used_at', null)
      const now = new Date()
      const valid = (jdCoupons ?? []).find(c => !c.expires_at || new Date(c.expires_at) > now)
      if (valid) jdCouponId = valid.id
    }

    // 플랜 횟수 제한 체크
    if (userRole !== 'MANAGER' && !jdCouponId) {
      const { data: userData } = await supabase
        .from('users')
        .select('plan, jd_count, jd_reset_at')
        .eq('email', session.user.email)
        .single()

      if (userData) {
        const resetAt = new Date(userData.jd_reset_at)
        if (new Date() >= resetAt) {
          const nextReset = new Date()
          nextReset.setMonth(nextReset.getMonth() + 1)
          nextReset.setDate(1)
          nextReset.setHours(0, 0, 0, 0)
          await supabase
            .from('users')
            .update({ jd_count: 0, jd_reset_at: nextReset.toISOString() })
            .eq('email', session.user.email)
          userData.jd_count = 0
        }

        const jdLimits: Record<string, number> = { FREE: 0, PRO: 15, EXPERT: 30 }
        const limit = jdLimits[userData.plan] ?? 0
        if (userData.jd_count >= limit) {
          const msg = limit === 0
            ? 'JD 적합도 분석은 PRO 이상 플랜에서 이용 가능합니다.'
            : `이번 달 JD 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하거나 쿠폰을 등록하세요.`
          return NextResponse.json({ error: msg }, { status: 403 })
        }
      }
    }

    const { company, jd, analysisResult } = await req.json()
    if (!company?.trim() || !jd?.trim()) {
      return NextResponse.json({ error: '회사명과 채용공고 내용을 입력해 주세요.' }, { status: 400 })
    }
    if (!analysisResult) {
      return NextResponse.json({ error: '분석할 이력서를 선택해 주세요.' }, { status: 400 })
    }

    const a = analysisResult as Record<string, unknown>
    const careerSummary = Array.isArray(a.career_paths)
      ? (a.career_paths as Array<{ type: string; title: string; salary_range: string }>)
          .map((p) => `${p.type}: ${p.title} (${p.salary_range})`)
          .join(' | ')
      : ''

    const candidateProfile = `
직무: ${(a.job_title as string) ?? '미상'}
종합 요약: ${(a.summary as string) ?? ''}
핵심 강점: ${((a.strengths as string[]) ?? []).join(' / ')}
개선 필요: ${((a.improvements as string[]) ?? []).join(' / ')}
핵심 키워드: ${((a.keywords as string[]) ?? []).join(', ')}
${careerSummary ? `커리어 경로: ${careerSummary}` : ''}
`.trim()

    const prompt = `당신은 10년 경력의 공격적인 헤드헌터입니다. 후보자 프로필과 채용공고를 냉정하고 날카롭게 비교 분석하세요. 좋은 점만 말하지 말고 부족한 점도 직설적으로 지적하세요.

[후보자 이력서 분석 결과]
${candidateProfile}

[채용 회사]
${company}

[채용공고 내용]
${jd}

위 정보를 바탕으로 후보자가 이 JD에 실질적으로 적합한지 냉정하게 분석하세요. 면접관 시각에서 매칭 강점, 리스크, 지원 전략, 면접 대비 방향을 실전적으로 제시하세요.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      tool_choice: { type: 'tool', name: 'analyze_jd_fit' },
      tools: [jdTool],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
    }

    const resultPayload = {
      ...(toolUse.input as object),
      company,
      resume_job_title: (a.job_title as string) ?? null,
      resume_analyzed_at: new Date().toISOString(),
    }

    if (jdCouponId) {
      await supabase.from('coupons').update({ used_at: new Date().toISOString() }).eq('id', jdCouponId)
    } else if (userRole !== 'MANAGER') {
      await supabase.rpc('increment_jd_count', { user_email: session.user.email })
    }

    const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('jd_analyses').insert({
      user_email: session.user.email,
      result: resultPayload,
      expires_at: expiresAt,
    })

    return NextResponse.json({ ...resultPayload, expires_at: expiresAt })
  } catch (e) {
    console.error('[analyze/jd]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
