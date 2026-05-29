import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'

export const maxDuration = 60

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
      company_insight: {
        type: 'string',
        description: '회사 특성 요약 — 규모·업종·조직 문화·최근 이슈 등 (웹 검색 결과 또는 JD 문맥 기반, 2-3문장)',
      },
      jd_interpretation: {
        type: 'string',
        description: 'JD 실제 해석 — 명시된 요건 너머의 숨은 요구역량, 이 포지션이 진짜 필요로 하는 것 (2-3문장)',
      },
      matching_points: {
        type: 'array',
        items: { type: 'string' },
        description: 'JD 요구사항과 이력서가 정확히 일치하는 강점 (3개, 구체적으로)',
      },
      gaps: {
        type: 'array',
        items: { type: 'string' },
        description: 'JD 요구사항 중 이력서에 없거나 부족한 항목 (2-3개, 솔직하게)',
      },
      pitch_points: {
        type: 'array',
        items: { type: 'string' },
        description: '이 JD에 지원할 때 서류/면접에서 적극 어필해야 할 전략 (3-4개, 구체적으로)',
      },
    },
    required: ['fit_score', 'recommendation', 'verdict', 'company_insight', 'jd_interpretation', 'matching_points', 'gaps', 'pitch_points'],
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
      const { allowed, limit } = await checkUsage(session.user.email, 'jd')
      if (!allowed) {
        const msg = limit === 0
          ? 'JD 적합도 분석은 PRO 이상 플랜에서 이용 가능합니다.'
          : `이번 달 JD 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하거나 쿠폰을 등록하세요.`
        return NextResponse.json({ error: msg }, { status: 403 })
      }
    }

    const { company, position, jd, analysisResult } = await req.json()
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

    const positionLine = position?.trim() ? `포지션: ${position.trim()}\n` : ''

    // 웹 검색으로 회사 실시간 정보 수집
    let companyInfo = ''
    try {
      const searchMsg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        tools: [{ type: 'web_search_20250305' as const, name: 'web_search', max_uses: 2 }],
        messages: [{
          role: 'user',
          content: `"${company}" 회사 정보를 웹에서 검색해줘.${position?.trim() ? ` 채용 포지션: "${position}"` : ''} 다음을 한국어로 간결하게 요약해줘:
- 회사 규모, 업종, 주요 사업 영역
- 최근 주요 뉴스·이슈 (1~2개)
- 조직 문화, 직원 평판 (Glassdoor·블라인드 등 참고)
- 해당 포지션에서 실제로 요구되는 것으로 보이는 역량/환경 특이사항
없는 정보는 생략하고 확인된 내용만 써줘.`,
        }],
      })
      const text = searchMsg.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map(c => c.text)
        .join('\n')
      if (text.trim()) companyInfo = text.trim()
    } catch (err) {
      console.error('[analyze/jd] web search error (non-fatal):', err)
    }

    const prompt = `당신은 한국 시니어 헤드헌터입니다. 목적은 단 하나입니다: "이 후보자를 이 JD에 넣을 수 있는가?"
JD를 요약하지 마십시오. 후보자 이력서를 나열하지 마십시오. 판단하고, 근거를 대고, 전략을 내십시오.
후보자 프로필과 채용공고를 냉정하고 날카롭게 비교 분석하십시오. 좋은 점만 말하지 말고 부족한 점도 직설적으로 지적하십시오.

[분석 절차]

STEP 1 — JD 핵심 요구 역량 추출
JD를 읽고 요구사항을 3가지로 분리합니다:
① 필수 요건(없으면 탈락): 최소 학력/전공, 최소 경력 연수, 특정 도메인/직무 경험, 자격증/어학
② 우대 사항(있으면 가산점): 특정 툴/플랫폼, 관련 업종, 특수 환경(해외/IPO/스타트업 등)
③ 숨은 요구 역량(JD에 없지만 맥락상 필요한 것): "글로벌 팀 협업"→영어 실무, "C-level 보고"→문서화 능력, "스타트업 환경"→멀티태스킹, "팀 리딩"→실제 인사권 여부, "외부 파트너"→협상 경험${companyInfo ? '\n웹 검색으로 확인한 회사 실제 정보도 반드시 반영하십시오.' : ''}

STEP 2 — 타깃 프로파일 한 줄 정의
STEP 1을 종합해 "[도메인]에서 [N]년 이상 [핵심 직무]를 직접 수행한 경험이 있으며, [환경]에서 [역할]을 해본 [직급대] 인재" 형식으로 기준선을 먼저 정한 뒤 후보자를 대조합니다.

STEP 3 — 후보자 항목별 대조
필수 요건 각 항목을 ✅충족 / △부분 / ❌미충족으로 판정하고 판단 근거를 명시합니다.
우대 사항과 숨은 요구도 동일하게 대조합니다.

STEP 4 — 매칭 판정 + 제안 전략
판정: 필수 전항목 충족+우대 2개 이상→APPLY / 필수 1~2개 부분 충족→CONSIDER / 필수 미충족 결정적→SKIP

[출력 필드 매핑]
- fit_score: STEP 3 결과 종합 점수 (필수 가중 60%, 우대 25%, 숨은요구 15%)
- recommendation: APPLY / CONSIDER / SKIP
- verdict: "이 후보자는 [강점]이 강점이나, [리스크] 부분이 리스크입니다. [제안 포지셔닝]으로 제안합니다." — 한 문장, 날카롭게
- company_insight: 회사 규모·업종·조직 문화·최근 이슈 등 핵심 정보를 2-3문장으로 요약. 웹 검색 결과가 있으면 반드시 반영하고, 없으면 JD 문맥에서 추론
- jd_interpretation: JD 문서에 명시되지 않은 숨은 요구역량과 이 포지션의 실제 맥락을 2-3문장으로 해석. STEP 1의 숨은 요구 역량 분석 결과를 활용
- matching_points: 필수✅ + 우대✅ + 숨은요구✅ 항목 (구체적 근거 포함, 3개)
- gaps: 필수❌/△ + 예상 클라이언트 우려 사항 (2-3개, 솔직하게)
- pitch_points: ① 클라이언트 제안 포지셔닝 전략 ② 서류/면접 핵심 어필 포인트 ③ 예상 우려 대응 방안 ④ 제안 전 후보자에게 반드시 확인할 사항 (3-4개, 실전적으로)

[금지]
JD·이력서 내용 그대로 복사 금지 / 강점만 나열 금지 / 숨은 요구 생략 금지 / "좋은 후보자입니다" 류 빈 말 금지

[채용 회사]
${company}
${positionLine}${companyInfo ? `[웹 검색 — 회사 실제 정보]
${companyInfo}

` : ''}[JD]
${jd}

[후보자 이력서 분석 결과]
${candidateProfile}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
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
      position: position?.trim() || null,
      resume_job_title: (a.job_title as string) ?? null,
      resume_analyzed_at: new Date().toISOString(),
    }

    if (jdCouponId) {
      await supabase.from('coupons').update({ used_at: new Date().toISOString() }).eq('id', jdCouponId)
    } else if (userRole !== 'MANAGER') {
      await incrementUsage(session.user.email, 'jd')
    }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 10)

    const { error: insertError } = await supabase.from('jd_analyses').insert({
      user_email: session.user.email,
      result: resultPayload,
      expires_at: expiresAt.toISOString(),
    })
    if (insertError) {
      console.error('[analyze/jd] DB insert error:', insertError)
      return NextResponse.json({ error: `분석 결과 저장 실패: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json(resultPayload)
  } catch (e) {
    console.error('[analyze/jd]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
