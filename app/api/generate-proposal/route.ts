import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// 기본 템플릿 생성 함수 (Fallback)
function createFallbackProposal(resumeAnalysis: any, jdAnalysis: any) {
  console.log('[generate-proposal] Using fallback template')

  const experience = resumeAnalysis.total_experience_years
    ? `총 ${Math.floor(resumeAnalysis.total_experience_years)}년 ${Math.round((resumeAnalysis.total_experience_years % 1) * 12)}개월`
    : '미기재'

  return {
    title: '후보자 추천 요약',
    company: jdAnalysis.company || '미상',
    position: jdAnalysis.position || '미상',
    date: new Date().toISOString().slice(0, 7).replace('-', '. '),
    summary: `${resumeAnalysis.candidate_name}님은 ${resumeAnalysis.job_title} 분야에서 ${experience}의 경력을 보유하고 있으며, 우수한 후보자입니다.`,
    candidate_info: {
      name: resumeAnalysis.candidate_name || '미상',
      current_position: resumeAnalysis.job_title || '미기재',
      experience: experience,
      education: resumeAnalysis.education || '미기재',
      current_salary: resumeAnalysis.current_salary || '미기재',
      availability: '협의 후 결정',
    },
    strengths: Array.isArray(resumeAnalysis.strengths) && resumeAnalysis.strengths.length > 0
      ? resumeAnalysis.strengths.slice(0, 5)
      : ['경력 기반 전문성', '직무 적합성', '성장 가능성'],
    fit_analysis: {
      technical_fit: `기술적 요구사항을 충족합니다.`,
      cultural_fit: `매칭 강점을 바탕으로 조직 문화에 잘 적응할 것으로 예상됩니다.`,
      growth_potential: `장기적인 발전 가능성이 높습니다.`,
    },
    recommendation: jdAnalysis.recommendation === 'APPLY' ? 'HIGHLY_RECOMMEND' :
                     jdAnalysis.recommendation === 'CONSIDER' ? 'RECOMMEND' : 'CONSIDER',
    next_steps: '면접 일정 조율을 제안합니다.',
  }
}

// Validation 함수 (완화됨 - 경고만 출력)
function validateResumeAnalysis(data: any): { valid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = []

  if (!data) return { valid: false, error: 'resumeAnalysis가 없습니다.' }

  // 선택적 필드 검증 (경고만)
  if (!data.candidate_name) warnings.push('candidate_name이 없습니다.')
  if (!data.job_title) warnings.push('job_title이 없습니다.')
  if (!data.scores) warnings.push('scores가 없습니다.')
  if (!data.strengths || !Array.isArray(data.strengths)) warnings.push('strengths가 배열이 아닙니다.')

  return { valid: true, warnings }
}

function validateJDAnalysis(data: any): { valid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = []

  if (!data) return { valid: false, error: 'jdAnalysis가 없습니다.' }

  // 선택적 필드 검증 (경고만)
  if (!data.company) warnings.push('company가 없습니다.')
  if (!data.position) warnings.push('position이 없습니다.')
  if (typeof data.fit_score !== 'number') warnings.push('fit_score가 숫자가 아닙니다.')
  if (!data.recommendation) warnings.push('recommendation이 없습니다.')

  return { valid: true, warnings }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 사용량 체크
    const usage = await checkUsage(session.user.email, 'proposal')
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: '클라이언트 제안서 생성 한도를 초과했습니다.',
          limit: usage.limit,
          plan: usage.plan
        },
        { status: 429 }
      )
    }

    const { resumeAnalysis, jdAnalysis } = await req.json()

    // 기본 검증
    if (!resumeAnalysis || !jdAnalysis) {
      return NextResponse.json(
        { error: '이력서 분석 결과와 JD 분석 결과가 필요합니다.' },
        { status: 400 }
      )
    }

    // 상세 검증 (완화됨)
    const resumeValidation = validateResumeAnalysis(resumeAnalysis)
    if (!resumeValidation.valid) {
      console.error('[generate-proposal] Resume validation failed:', resumeValidation.error)
      return NextResponse.json(
        { error: `이력서 분석 데이터 오류: ${resumeValidation.error}` },
        { status: 400 }
      )
    }

    // 경고만 로그 (계속 진행)
    if (resumeValidation.warnings && resumeValidation.warnings.length > 0) {
      console.warn('[generate-proposal] Resume validation warnings:', resumeValidation.warnings)
    }

    const jdValidation = validateJDAnalysis(jdAnalysis)
    if (!jdValidation.valid) {
      console.error('[generate-proposal] JD validation failed:', jdValidation.error)
      return NextResponse.json(
        { error: `JD 분석 데이터 오류: ${jdValidation.error}` },
        { status: 400 }
      )
    }

    // 경고만 로그 (계속 진행)
    if (jdValidation.warnings && jdValidation.warnings.length > 0) {
      console.warn('[generate-proposal] JD validation warnings:', jdValidation.warnings)
    }

    console.log('[generate-proposal] Validation passed:', {
      candidateName: resumeAnalysis.candidate_name || '미상',
      company: jdAnalysis.company || '미상',
      position: jdAnalysis.position || '미상',
      hasWarnings: (resumeValidation.warnings?.length || 0) + (jdValidation.warnings?.length || 0) > 0
    })

    // Claude API로 제안서 생성 (Tool Use로 환각 방지) + Fallback
    let proposal: any
    try {
      const startTime = Date.now()
      const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      tool_choice: { type: 'tool', name: 'generate_proposal' },
      tools: [
        {
          name: 'generate_proposal',
          description: '후보자 추천서 생성 (제공된 정보만 사용, 환각 절대 금지)',
          input_schema: {
            type: 'object' as const,
            properties: {
              title: { type: 'string', description: '제안서 제목' },
              company: { type: 'string', description: 'JD 회사명 (제공된 값 그대로)' },
              position: { type: 'string', description: 'JD 포지션 (제공된 값 그대로)' },
              date: { type: 'string', description: '작성 날짜 YYYY. MM' },
              summary: { type: 'string', description: '추천 요약 (3-5문장, 구체적 경력과 강점 중심)' },
              candidate_info: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: '후보자명 (제공된 값 그대로, 변경 금지)' },
                  current_position: { type: 'string', description: '직무 (제공된 값 그대로)' },
                  experience: { type: 'string', description: '제공된 "총 경력" 정보를 "총 O년 O개월" 형식으로 변환 (예: "총 8년 6개월"), 없으면 "미기재"' },
                  education: { type: 'string', description: '제공된 "최종 학력" 정보 그대로 사용 (예: "서울대학교 석사 졸업"), 없으면 "미기재"' },
                  current_salary: { type: 'string', description: '제공된 "현재/직전 연봉" 정보 그대로 사용 (예: "연 6,500만원"), 없으면 "미기재"' },
                  availability: { type: 'string', description: '입사 가능일, "협의 후 결정" 기본값' },
                },
                required: ['name', 'current_position', 'experience', 'education', 'current_salary', 'availability'],
              },
              strengths: {
                type: 'array',
                description: '제공된 강점 기반 핵심 강점 3-5개',
                items: { type: 'string' },
              },
              fit_analysis: {
                type: 'object',
                properties: {
                  technical_fit: { type: 'string', description: '기술적 적합성 분석' },
                  cultural_fit: { type: 'string', description: '문화적 적합성 분석' },
                  growth_potential: { type: 'string', description: '성장 가능성 분석' },
                },
                required: ['technical_fit', 'cultural_fit', 'growth_potential'],
              },
              recommendation: {
                type: 'string',
                enum: ['HIGHLY_RECOMMEND', 'RECOMMEND', 'CONSIDER'],
                description: '추천도',
              },
              next_steps: { type: 'string', description: '다음 단계 제안' },
            },
            required: ['title', 'company', 'position', 'date', 'summary', 'candidate_info', 'strengths', 'fit_analysis', 'recommendation', 'next_steps'],
          },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `당신은 Executive Search 헤드헌터입니다. 클라이언트(채용 기업)에게 제출할 후보자 추천서를 작성해 주세요.

⚠️ **중요**: 아래 제공된 정보만 사용하십시오. 없는 정보는 추측하거나 생성하지 말고 "미기재"로 표시하십시오.

## 후보자 이력서 분석 결과:
- 후보자명: ${resumeAnalysis.candidate_name || '미상'}
- 직무: ${resumeAnalysis.job_title || '미상'}
- 총 경력: ${resumeAnalysis.total_experience_years ? `${resumeAnalysis.total_experience_years}년` : '미기재'}
- 최종 학력: ${resumeAnalysis.education || '미기재'}
- 현재/직전 연봉: ${resumeAnalysis.current_salary || '미기재'}
- 직무 적합도: ${resumeAnalysis.scores?.job_fit || 0}점
- 시장 경쟁력: ${resumeAnalysis.scores?.market_competitiveness || 0}점
- 성장 가능성: ${resumeAnalysis.scores?.growth_potential || 0}점
- 강점: ${Array.isArray(resumeAnalysis.strengths) ? resumeAnalysis.strengths.join(', ') : '없음'}
- 개선점: ${Array.isArray(resumeAnalysis.improvements) ? resumeAnalysis.improvements.join(', ') : '없음'}
- 핵심 키워드: ${Array.isArray(resumeAnalysis.keywords) ? resumeAnalysis.keywords.join(', ') : '없음'}

## JD 적합도 분석 결과:
- 회사: ${jdAnalysis.company || '미상'}
- 포지션: ${jdAnalysis.position || '미상'}
- 적합도 점수: ${jdAnalysis.fit_score || 0}점
- 추천도: ${jdAnalysis.recommendation || 'CONSIDER'}
- 매칭 강점: ${Array.isArray(jdAnalysis.matching_points) ? jdAnalysis.matching_points.join(', ') : '없음'}
- 부족한 점: ${Array.isArray(jdAnalysis.gaps) ? jdAnalysis.gaps.join(', ') : '없음'}

다음 형식으로 프로페셔널한 후보자 추천서를 작성해 주세요:

{
  "title": "후보자 추천 요약",
  "company": "${jdAnalysis.company || '미상'}",
  "position": "${jdAnalysis.position || '미상'}",
  "date": "${new Date().toISOString().slice(0, 7).replace('-', '. ')}",
  "summary": "후보자에 대한 전체적인 추천 요약 (3-5문장, 구체적 수치 포함)",
  "candidate_info": {
    "name": "${resumeAnalysis.candidate_name || '미상'}",
    "current_position": "${resumeAnalysis.job_title || '미기재'}",
    "experience": "${resumeAnalysis.total_experience_years ? `총 ${Math.floor(resumeAnalysis.total_experience_years)}년 ${Math.round((resumeAnalysis.total_experience_years % 1) * 12)}개월` : '미기재'}" (위 총 경력 정보 사용, 없으면 '미기재'),
    "education": "${resumeAnalysis.education || '미기재'}" (위 최종 학력 정보 사용, 없으면 '미기재'),
    "current_salary": "${resumeAnalysis.current_salary || '미기재'}" (위 현재/직전 연봉 정보 사용, 없으면 '미기재'),
    "availability": "협의 후 결정" (기본값)
  },
  "strengths": [
    "위 강점 정보를 기반으로 한 핵심 강점 3-5개 (구체적 사례 포함)"
  ],
  "fit_analysis": {
    "technical_fit": "매칭 강점 기반 기술적 적합성 분석",
    "cultural_fit": "조직 문화 및 협업 능력 기반 문화적 적합성 분석",
    "growth_potential": "경력 경로 및 잠재력 기반 성장 가능성 분석"
  },
  "recommendation": "${jdAnalysis.recommendation === 'APPLY' ? 'HIGHLY_RECOMMEND' : jdAnalysis.recommendation === 'CONSIDER' ? 'RECOMMEND' : 'CONSIDER'}",
  "next_steps": "면접 일정 조율을 제안합니다."
}

❌ **절대 금지**:
- 후보자 이름을 임의로 변경하거나 생성하지 마세요
- 없는 경력이나 학력을 추측하지 마세요
- 제공되지 않은 연봉 정보를 임의로 작성하지 마세요
- 경력을 "8년" 대신 반드시 "총 8년 O개월" 형식으로 작성하세요
- 학력을 반드시 "대학교명 + 석사/학사 + 졸업/수료" 형식으로 작성하세요

✅ **필수 추출 규칙**:
1. **경력**: 이력서에서 "총 경력", "경력 기간", "근무 기간" 등의 정보를 찾아 "총 O년 O개월" 형식으로 정확히 기재
2. **학력**: 이력서에서 최종 학력을 찾아 "대학교명 + 학위(석사/학사) + 졸업/수료" 형식으로 기재
3. **연봉**: 이력서에서 "현재 연봉", "현재 급여", "직전 연봉" 등의 키워드를 찾아 그대로 기재
4. **없는 정보**: 위 정보가 이력서에 없으면 반드시 "미기재"로 표시

- 위 JSON 형식 그대로 출력
- JSON만 출력하고 다른 설명은 하지 마세요`,
        },
      ],
    })

    // 🔍 토큰 사용량 로깅
    const duration = Date.now() - startTime
    console.log('[generate-proposal] 토큰 사용량:', {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
      total: message.usage.input_tokens + message.usage.output_tokens,
      duration: `${duration}ms`
    })

    // Tool use 응답 추출 (환각 방지)
    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      console.error('[generate-proposal] No tool_use in response:', JSON.stringify(message.content))
      throw new Error('제안서 생성 응답 형식 오류')
    }

      proposal = toolUse.input as any

      // 필수 필드 검증 (환각 방지)
      if (!proposal.candidate_info?.name || proposal.candidate_info.name === '미상') {
        console.error('[generate-proposal] Missing or invalid candidate name')
        // 원본 데이터로 대체
        if (!proposal.candidate_info) proposal.candidate_info = {}
        proposal.candidate_info.name = resumeAnalysis.candidate_name || '미상'
      }

      if (!proposal.candidate_info?.current_position) {
        proposal.candidate_info.current_position = resumeAnalysis.job_title || '미기재'
      }

      if (!proposal.candidate_info?.education) {
        proposal.candidate_info.education = resumeAnalysis.education || '미기재'
      }

      // 로깅 (디버깅용)
      console.log('[generate-proposal] ✅ Generated proposal successfully:', {
        candidateName: proposal.candidate_info?.name,
        position: proposal.candidate_info?.current_position,
        company: proposal.company,
      })

    } catch (claudeError: any) {
      // Claude API 실패 시 Fallback 템플릿 사용
      console.error('[generate-proposal] Claude API failed, using fallback:', {
        error: claudeError.message,
        type: claudeError.constructor?.name,
      })

      proposal = createFallbackProposal(resumeAnalysis, jdAnalysis)
      console.log('[generate-proposal] ✅ Fallback proposal created')
    }

    // 제안서를 interview_guides 테이블에 저장
    try {
      const session = await auth()
      if (session?.user?.email) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30일 후 만료

        const { data: inserted, error: insertError } = await supabase
          .from('interview_guides')
          .insert({
            user_email: session.user.email,
            result: proposal,
            expires_at: expiresAt.toISOString()
          })
          .select('id')
          .single()

        if (!insertError && inserted) {
          console.log('[generate-proposal] ✅ Saved to DB, ID:', inserted.id)
          // 사용량 증가
          await incrementUsage(session.user.email, 'proposal')
          return NextResponse.json({ proposal, id: inserted.id })
        } else {
          console.error('[generate-proposal] ⚠️ Failed to save to DB:', insertError?.message)
        }
      }
    } catch (saveError) {
      console.error('[generate-proposal] ⚠️ Error saving to DB:', saveError)
    }

    // 사용량 증가
    await incrementUsage(session.user.email, 'proposal')
    return NextResponse.json({ proposal })

  } catch (error: any) {
    // 상세한 에러 로그
    console.error('[generate-proposal] ❌ Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'), // 스택의 처음 3줄만
      type: error.constructor?.name,
      isAnthropicError: error.constructor?.name === 'APIError',
    })

    // Anthropic API 에러인 경우
    if (error.constructor?.name === 'APIError') {
      console.error('[generate-proposal] Anthropic API Error:', {
        status: error.status,
        statusText: error.statusText,
        headers: error.headers,
      })
      return NextResponse.json(
        { error: `Claude API 오류: ${error.message}` },
        { status: 500 }
      )
    }

    // Tool use 응답 오류인 경우
    if (error.message?.includes('응답 형식')) {
      return NextResponse.json(
        { error: 'AI 응답 형식 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 일반 에러
    return NextResponse.json(
      { error: error.message || '제안서 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
