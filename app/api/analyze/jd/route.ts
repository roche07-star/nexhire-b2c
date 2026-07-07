import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'
import { BASE_HEADHUNTER_ROLE, OUTPUT_RULES } from '@/lib/prompts/base-headhunter'
import { invalidateCache } from '@/lib/cache'

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
        description: '회사 특성 요약 — 규모/업종/조직 문화 등 (JD 문맥 및 회사명에서 추론, 2-3문장)',
      },
      // ===== 상세 회사 분석 (NEW) =====
      company_analysis: {
        type: 'object',
        description: '회사 상세 분석 — JD와 회사명에서 알 수 있는 정보 기반. 정보가 불충분하면 needs_more_info를 true로 설정',
        properties: {
          introduction: {
            type: 'string',
            description: '회사 소개 (업종, 주요 사업, 설립 배경 등). 정보가 없으면 "정보 부족"'
          },
          revenue: {
            type: 'string',
            description: '매출액 또는 규모 추정 (알려진 경우). 정보가 없으면 "정보 부족"'
          },
          current_business: {
            type: 'string',
            description: '현재 진행 중인 주요 사업/프로젝트 (JD에서 추론 가능한 경우). 정보가 없으면 "정보 부족"'
          },
          recent_trends: {
            type: 'string',
            description: '최근 동향 (채용 배경, 사업 확장 등 JD에서 유추). 정보가 없으면 "정보 부족"'
          },
          future_value: {
            type: 'string',
            description: '회사 미래 가치 및 성장 가능성 (산업 전망, 경쟁력, 투자 가치 등). JD와 회사명에서 유추. 정보가 없으면 "정보 부족"'
          },
          needs_more_info: {
            type: 'boolean',
            description: '위 정보 중 2개 이상이 "정보 부족"이면 true로 설정'
          },
          info_request_message: {
            type: 'string',
            description: 'needs_more_info가 true일 때만 작성. "회사에 대해 더 정확한 분석을 위해 다음 정보가 필요합니다: [구체적 항목]" 형식'
          },
        },
        required: ['introduction', 'revenue', 'current_business', 'recent_trends', 'future_value', 'needs_more_info'],
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
    required: ['fit_score', 'recommendation', 'verdict', 'company_insight', 'company_analysis', 'jd_interpretation', 'matching_points', 'gaps', 'pitch_points'],
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

    const { company, position, jd, analysisResult, analysisId, client_comment, company_url } = await req.json()
    if (!company?.trim() || !jd?.trim()) {
      return NextResponse.json({ error: '회사명과 채용공고 내용을 입력해 주세요.' }, { status: 400 })
    }
    if (!analysisResult) {
      return NextResponse.json({ error: '분석할 이력서를 선택해 주세요.' }, { status: 400 })
    }

    // 채용사 URL이 있으면 웹페이지 정보 가져오기
    let companyWebInfo = ''
    if (company_url?.trim()) {
      try {
        const urlToFetch = company_url.trim()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10초 타임아웃

        const response = await fetch(urlToFetch, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })
        clearTimeout(timeout)

        if (response.ok) {
          const html = await response.text()

          // 간단한 HTML 텍스트 추출 (태그 제거)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // script 제거
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // style 제거
            .replace(/<[^>]+>/g, ' ') // 모든 태그 제거
            .replace(/\s+/g, ' ') // 연속 공백 제거
            .trim()
            .substring(0, 3000) // 최대 3000자 (토큰 절약)

          if (textContent.length > 100) {
            companyWebInfo = `\n\n[채용사 웹사이트 정보]\nURL: ${urlToFetch}\n내용: ${textContent}\n\n💡 위 웹사이트 정보를 활용하여 회사의 사업방향, 비전, 핵심가치, 조직문화 등을 파악하고, company_analysis와 pitch_points에 반영하세요.`
          }
        }
      } catch (error) {
        console.error('[analyze/jd] company_url fetch error:', error)
        // 에러 시 무시하고 계속 진행
      }
    }

    // 중복 방지: 동일한 회사/포지션 조합으로 최근 1시간 내 생성된 것이 있는지 확인
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const normalizeStr = (s: string) => s.toLowerCase().replace(/\s+/g, '')
    const { data: recentAnalyses } = await supabase
      .from('jd_analyses')
      .select('id, result, created_at')
      .eq('user_email', session.user.email)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    // 동일한 회사/포지션 조합 찾기
    const normalizedCompany = normalizeStr(company.trim())
    const normalizedPosition = position?.trim() ? normalizeStr(position.trim()) : null
    const duplicate = (recentAnalyses ?? []).find(item => {
      const r = item.result as Record<string, unknown>
      const rCompany = normalizeStr((r.company as string) ?? '')
      const rPosition = r.position ? normalizeStr((r.position as string)) : null
      return rCompany === normalizedCompany && rPosition === normalizedPosition
    })

    // 중복이 있으면 기존 것 반환
    if (duplicate) {
      return NextResponse.json({
        ...duplicate.result,
        id: duplicate.id,
        created_at: duplicate.created_at,
        isDuplicate: true,
        message: '이미 분석된 결과가 있어 기존 결과를 반환합니다.',
      })
    }

    const a = analysisResult as Record<string, unknown>

    // 안전한 배열 변환
    const toArr = (v: unknown): string[] =>
      Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n').filter(Boolean) : []

    const careerSummary = Array.isArray(a.career_paths)
      ? (a.career_paths as Array<{ type: string; title: string; salary_range: string }>)
          .map((p) => `${p.type}: ${p.title} (${p.salary_range})`)
          .join(' | ')
      : ''

    const candidateName = (a.candidate_name as string) ?? (a.name as string) ?? '미상'

    const candidateProfile = `
후보자: ${candidateName}
직무: ${(a.job_title as string) ?? '미상'}
종합 요약: ${(a.summary as string) ?? ''}
핵심 강점: ${toArr(a.strengths).join(' / ')}
개선 필요: ${toArr(a.improvements).join(' / ')}
핵심 키워드: ${toArr(a.keywords).join(', ')}
${careerSummary ? `커리어 경로: ${careerSummary}` : ''}
`.trim()

    const positionLine = position?.trim() ? `포지션: ${position.trim()}\n` : ''

    const systemPrompt = `${BASE_HEADHUNTER_ROLE}

목적은 단 하나입니다: "이 후보자를 이 JD에 넣을 수 있는가?"
JD를 요약하지 마십시오. 후보자 이력서를 나열하지 마십시오. 판단하고, 근거를 대고, 전략을 내십시오.
후보자 프로필과 채용공고를 냉정하고 날카롭게 비교 분석하십시오. 좋은 점만 말하지 말고 부족한 점도 직설적으로 지적하십시오.

[중요: 분석 일관성 유지]
아래 제공된 후보자 이력서 분석 결과는 동일 시스템에서 생성된 것입니다.
이력서 분석에서 '핵심 강점'으로 판단된 항목은 이 JD 분석에서도 강점으로 평가되어야 하며, '개선 필요'로 판단된 항목은 gaps 또는 우려 사항으로 반영되어야 합니다.
후보자의 경력, 직무, 키워드 등 기본 프로필 정보는 이력서 분석 결과와 정확히 일치해야 하며, 모순되는 평가를 하지 마십시오.

[분석 절차]

STEP 1 — JD 핵심 요구 역량 추출
JD를 읽고 요구사항을 3가지로 분리합니다:
① 필수 요건(없으면 탈락): 최소 학력/전공, 최소 경력 연수, 특정 도메인/직무 경험, 자격증/어학
② 우대 사항(있으면 가산점): 특정 툴/플랫폼, 관련 업종, 특수 환경(해외/IPO/스타트업 등)
③ 숨은 요구 역량(JD에 없지만 맥락상 필요한 것): "글로벌 팀 협업"→영어 실무, "C-level 보고"→문서화 능력, "스타트업 환경"→멀티태스킹, "팀 리딩"→실제 인사권 여부, "외부 파트너"→협상 경험

STEP 2 — 타깃 프로파일 한 줄 정의
STEP 1을 종합해 "[도메인]에서 [N]년 이상 [핵심 직무]를 직접 수행한 경험이 있으며, [환경]에서 [역할]을 해본 [직급대] 인재" 형식으로 기준선을 먼저 정한 뒤 후보자를 대조합니다.

STEP 3 — 후보자 항목별 대조
필수 요건 각 항목을 ✅충족 / △부분 / ❌미충족으로 판정하고 판단 근거를 명시합니다.
우대 사항과 숨은 요구도 동일하게 대조합니다.

STEP 4 — 매칭 판정 + 제안 전략
판정: 필수 전항목 충족+우대 2개 이상→APPLY / 필수 1~2개 부분 충족→CONSIDER / 필수 미충족 결정적→SKIP

[fit_score 점수 기준] ⚠️ 반드시 준수
- 85-100점: 우수 매칭. 필수 스킬 80% 이상 + 우대 스킬 50% 이상 → APPLY
- 70-84점: 양호 매칭. 필수 스킬 60% 이상 + 우대 스킬 30% 이상 → CONSIDER
- 55-69점: 보통 매칭. 필수 스킬 40% 이상 → CONSIDER
- 40-54점: 부족 매칭. 필수 스킬 20% 이상 → SKIP
- 0-39점: 부적합. 필수 스킬 거의 없음 → SKIP

⚠️ 중요: 실제 헤드헌팅 시장에서는 필수 스킬 70-80% 매칭이면 "우수" 후보자입니다.
완벽한 100% 매칭은 거의 존재하지 않으므로, 점수를 과도하게 깎지 마십시오.

⚠️⚠️ 평가 일관성 필수 준수 ⚠️⚠️
동일한 후보자 + 동일한 JD 조합에 대해서는 항상 일관된 점수를 반환해야 합니다.
점수 산정 시:
1. 객관적 기준만 사용 (필수 스킬 충족률, 우대 스킬 충족률, 경력 연수)
2. 주관적 해석 최소화 (애매한 표현, 추측성 판단 배제)
3. 명시적 근거 기반 평가 (이력서에 명확히 기재된 내용만 인정)
4. 위 점수 기준 표를 기계적으로 적용 (필수 80% + 우대 50% = 85-100점)

예시:
- 필수 스킬 5개 중 4개 충족 (80%) + 우대 4개 중 2개 충족 (50%) → 반드시 85-100점
- 필수 스킬 5개 중 3개 충족 (60%) + 우대 4개 중 1개 충족 (25%) → 반드시 70-84점
동일 조건이면 반드시 동일 점수를 부여하십시오.

[출력 필드 매핑]
- fit_score: STEP 3 결과 종합 점수 (위 점수 기준 적용)
- recommendation: APPLY / CONSIDER / SKIP
- verdict: "이 후보자는 [강점]이 강점이나, [리스크] 부분이 리스크입니다. [제안 포지셔닝]으로 제안합니다." — 한 문장, 날카롭게
- company_insight: 회사 규모/업종/조직 문화 등 핵심 정보를 2-3문장으로 요약. JD 문맥 및 회사명에서 추론
- company_analysis: 상세 회사 분석
  * introduction: 회사 소개 (업종, 주요 사업, 설립 배경 등). JD와 회사명에서 알 수 있는 정보 기반. 정보가 없으면 "정보 부족"
  * revenue: 매출액 또는 규모 추정. 알려진 경우만 작성, 모르면 "정보 부족"
  * current_business: 현재 진행 중인 주요 사업/프로젝트. JD에서 추론 가능한 경우만 작성
  * recent_trends: 최근 동향 (채용 배경, 사업 확장, 시장 변화 등). JD에서 유추 가능한 경우만 작성
  * future_value: 회사 미래 가치 및 성장 가능성. 산업 전망, 경쟁력, 투자 가치 등을 JD와 회사명에서 유추
  * needs_more_info: 위 정보 중 2개 이상이 "정보 부족"이면 true로 설정
  * info_request_message: needs_more_info가 true일 때만 작성. "회사에 대해 더 정확한 분석을 위해 다음 정보가 필요합니다: [구체적 항목]" 형식
- jd_interpretation: JD 문서에 명시되지 않은 숨은 요구역량과 이 포지션의 실제 맥락을 2-3문장으로 해석. STEP 1의 숨은 요구 역량 분석 결과를 활용
- matching_points: 필수✅ + 우대✅ + 숨은요구✅ 항목 (구체적 근거 포함, 3개)
- gaps: 필수❌/△ + 예상 클라이언트 우려 사항 (2-3개, 솔직하게)
- pitch_points: ① 클라이언트 제안 포지셔닝 전략 ② 서류/면접 핵심 어필 포인트 ③ 예상 우려 대응 방안 ④ 제안 전 후보자에게 반드시 확인할 사항 (3-4개, 실전적으로)

${OUTPUT_RULES}

[추가 금지사항]
JD/이력서 내용 그대로 복사 금지 / 강점만 나열 금지 / 숨은 요구 생략 금지 / "좋은 후보자입니다" 류 빈 말 금지`

    const userContent = client_comment
      ? `[채용 회사]
${company}
${positionLine}
[JD]
${jd}
${companyWebInfo}
[후보자 이력서 분석 결과]
${candidateProfile}

[클라이언트 코멘트]
${client_comment}

**⚠️ 클라이언트 코멘트를 반드시 반영:**
- 요건 완화/강화 사항 확인
- 우선순위 변경 사항 반영
- 기피 프로파일 주의
- 처우 조건 고려
- gaps, pitch_points에 코멘트 내용 통합`
      : `[채용 회사]
${company}
${positionLine}
[JD]
${jd}
${companyWebInfo}
[후보자 이력서 분석 결과]
${candidateProfile}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: [{
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }],
      tool_choice: { type: 'tool', name: 'analyze_jd_fit' },
      tools: [jdTool],
      messages: [{ role: 'user', content: userContent }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
    }

    const resultPayload = {
      ...(toolUse.input as object),
      company,
      position: position?.trim() || null,
      candidate_name: candidateName,
      resume_job_title: (a.job_title as string) ?? null,
      resume_analyzed_at: new Date().toISOString(),
      company_url: company_url?.trim() || null,
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
      analysis_id: analysisId || null,  // 이력서 분석 ID 저장
      result: resultPayload,
      expires_at: expiresAt.toISOString(),
    })
    if (insertError) {
      console.error('[analyze/jd] DB insert error:', insertError)
      return NextResponse.json({ error: `분석 결과 저장 실패: ${insertError.message}` }, { status: 500 })
    }

    // 캐시 무효화 (Dashboard 통계 갱신)
    await invalidateCache(`dashboard:stats:${session.user.email}`)

    // 구직 대시보드에 자동 추가 (JD 매칭 완료 시)
    try {
      const { data: existingApp } = await supabase
        .from('job_applications')
        .select('id')
        .eq('user_email', session.user.email)
        .eq('company', company)
        .eq('position', position || '')
        .single()

      if (!existingApp) {
        await supabase.from('job_applications').insert({
          user_email: session.user.email,
          company,
          position: position || '포지션 미정',
          status: '지원 완료',
          applied_at: new Date().toISOString()
        })
        console.log('✅ 구직 대시보드에 자동 추가:', { company, position })
      } else {
        console.log('ℹ️ 이미 등록된 지원 정보:', { company, position })
      }
    } catch (appError) {
      console.error('구직 대시보드 추가 실패 (무시):', appError)
      // 실패해도 JD 분석 결과는 정상 반환
    }

    return NextResponse.json(resultPayload)
  } catch (e) {
    console.error('[analyze/jd]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
