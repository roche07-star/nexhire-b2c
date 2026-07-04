import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from '@/lib/extractText'
import { maskPII } from '@/lib/maskPII'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'
import { BASE_HEADHUNTER_ROLE, ANALYSIS_STEPS, OUTPUT_RULES, B2C_PURPOSE } from '@/lib/prompts/base-headhunter'
import { VALIDATION_PROMPT, ValidationResult } from '@/lib/prompts/validation'
import { invalidateCache } from '@/lib/cache'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'

export const maxDuration = 180 // PDF OCR + 분석 = 최대 3분

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 🔐 보안: 마스킹 전 원본에서 이름 추출 (Claude API로 PII 전송 방지)
function extractNameFromResume(text: string): string {
  // 1. 레이블이 있는 경우 (이름:, 성명:, Name:)
  const labelMatch = text.match(
    /(이름|성명|Name|성 명|성함)\s*[:：]?\s*([가-힣]{2,5}|[a-zA-Z]{2,30}(?:\s[a-zA-Z]{1,20})?)/i
  )
  if (labelMatch) return labelMatch[2].trim()

  // 2. 헤더 형식 (홍길동 | Backend Developer)
  const headerMatch = text.match(/^([가-힣]{2,4})\s*[|｜]/m)
  if (headerMatch) return headerMatch[1].trim()

  // 3. 첫 줄에 이름만 있는 경우
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length > 0) {
    const firstLine = lines[0]
    // 첫 줄이 2-4글자 한글이고, 회사명 패턴이 아닌 경우
    if (/^[가-힣]{2,4}$/.test(firstLine) && !/(주식회사|유한회사|주|㈜|Co\.|Ltd|Inc)/.test(firstLine)) {
      return firstLine
    }
  }

  // 4. 추출 실패
  return ''
}

const baseTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '한국어 이력서를 분석하여 구직자의 강점, 개선점, 커리어 방향을 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      job_title: { type: 'string', description: '이력서에서 파악된 현재 또는 목표 직무명' },
      total_experience_years: { type: 'number', description: '총 경력 연수 (소수점 가능, 예: 8.5년 = 8년 6개월)' },
      education: { type: 'string', description: '최종 학력 (예: "서울대학교 석사 졸업", "연세대학교 학사 졸업", 없으면 빈 문자열)' },
      current_salary: { type: 'string', description: '현재 연봉 또는 직전 연봉 (예: "연 6,500만원", 없으면 빈 문자열)' },
      address: { type: 'string', description: '거주지 주소 (이력서에 명시된 경우만, 예: "서울시 강남구", 없으면 빈 문자열)' },
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      strengths: { type: 'array', items: { type: 'string' }, description: '핵심 강점 (최대 4개)' },
      improvements: { type: 'array', items: { type: 'string' }, description: '개선 포인트 (최대 4개). ⚠️ 연차별 현실적 기준 적용: 1-3년차는 실무 숙련, 4-7년차는 프로젝트 리딩, 8년차 이상만 팀 관리 기대. 6년차에게 관리자급 경험 요구 금지!' },
      keywords: { type: 'array', items: { type: 'string' }, description: '핵심 키워드 (최대 8개)' },
      summary: { type: 'string', description: '헤드헌터용 종합 요약. 각 항목은 줄바꿈(\\n)으로 구분. 콜론(:) 없이 작성. 포지셔닝 경력N년차, 직급, 직무\\n핵심 강점 수치/프로젝트명 포함\\n커리어 패턴 성장형/전환형/순환형/분산형, 이직 시그널\\n시장 제안 제안 가능 포지션 또는 리스크' },
      career_paths: {
        type: 'array',
        description: 'BASELINE 1개만 반환',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'BASELINE 고정' },
            label: { type: 'string', description: '현재 경로 유지' },
            title: { type: 'string', description: '직무명' },
            salary_range: { type: 'string', description: '예상 연봉 범위 (예: 4,500만원~6,500만원)' },
            salary_bands: {
              type: 'array',
              description: '4개: 1년 뒤, 3년 뒤, 5년 뒤, 7년 뒤+',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  min: { type: 'number', description: '최솟값 (만원)' },
                  max: { type: 'number', description: '최댓값 (만원)' },
                },
                required: ['period', 'min', 'max'],
              },
            },
            points: { type: 'array', items: { type: 'string' }, description: '구체적 조언 3~4개' },
          },
          required: ['type', 'label', 'title', 'salary_range', 'salary_bands', 'points'],
        },
      },
    },
    required: ['job_title', 'scores', 'career_paths', 'strengths', 'improvements', 'keywords', 'summary'],
  },
}
const proBasicTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '한국어 이력서를 분석하여 구직자의 강점, 개선점을 상세히 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      job_title: { type: 'string', description: '이력서에서 파악된 현재 또는 목표 직무명 (예: 백엔드 개발자, 마케팅 매니저)' },
      total_experience_years: { type: 'number', description: '총 경력 연수 (소수점 가능, 예: 8.5년 = 8년 6개월)' },
      education: { type: 'string', description: '최종 학력 (예: "서울대학교 석사 졸업", "연세대학교 학사 졸업", 없으면 빈 문자열)' },
      current_salary: { type: 'string', description: '현재 연봉 또는 직전 연봉 (예: "연 6,500만원", 없으면 빈 문자열)' },
      address: { type: 'string', description: '거주지 주소 (이력서에 명시된 경우만, 예: "서울시 강남구", 없으면 빈 문자열)' },
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      summary: { type: 'string', description: '헤드헌터용 종합 요약. 각 항목은 줄바꿈(\\n)으로 구분. 콜론(:) 없이 작성. 포지셔닝 경력N년차, 직급, 직무\\n핵심 강점 수치/프로젝트명 포함\\n커리어 패턴 성장형/전환형/순환형/분산형, 이직 시그널\\n시장 제안 제안 가능 포지션 또는 리스크' },
      strengths: { type: 'array', items: { type: 'string' }, description: '이력서의 핵심 강점 (최대 4개)' },
      improvements: { type: 'array', items: { type: 'string' }, description: '개선이 필요한 부분 (최대 4개). ⚠️ 연차별 현실적 기준: 1-3년차는 실무, 4-7년차는 리딩, 8년차+ 팀 관리. 6년차에게 관리자급 경험 요구 절대 금지!' },
      keywords: { type: 'array', items: { type: 'string' }, description: '이력서에서 발견된 핵심 키워드 (최대 8개)' },
    },
    required: ['job_title', 'scores', 'summary', 'strengths', 'improvements', 'keywords'],
  },
}

// 검증 Tool (하이브리드 하네스 엔지니어링)
const validationTool: Anthropic.Tool = {
  name: 'validate_analysis',
  description: '1차 분석 결과를 검증하고 문제를 찾아 수정합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      career_level_issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original: { type: 'string', description: '원본 개선 포인트' },
            reason: { type: 'string', description: '문제 이유 (연차별 기준 위반)' },
            corrected: { type: 'string', description: '수정된 개선 포인트' },
          },
          required: ['original', 'reason', 'corrected'],
        },
        description: '연차별 비현실적 기대치 문제들',
      },
      hallucination_issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original: { type: 'string', description: '원본 개선 포인트/약점' },
            reason: { type: 'string', description: '환각 이유 (이력서에 명시된 내용)' },
            action: { type: 'string', enum: ['remove', 'keep'], description: '삭제 여부' },
          },
          required: ['original', 'reason', 'action'],
        },
        description: '이력서 명시 내용을 약점으로 지적한 환각들',
      },
      generic_phrase_issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original: { type: 'string', description: '원본 강점' },
            reason: { type: 'string', description: '빈 말 이유 (구체성 없음)' },
            has_specifics: { type: 'boolean', description: '수치/프로젝트명 포함 여부' },
          },
          required: ['original', 'reason', 'has_specifics'],
        },
        description: '구체성 없는 빈 말 강점들',
      },
      corrected_improvements: {
        type: 'array',
        items: { type: 'string' },
        description: '수정된 개선 포인트 목록 (문제 없으면 원본 그대로)',
      },
      corrected_strengths: {
        type: 'array',
        items: { type: 'string' },
        description: '수정된 강점 목록 (문제 없으면 원본 그대로)',
      },
      validation_passed: {
        type: 'boolean',
        description: '검증 통과 여부 (문제 없으면 true)',
      },
    },
    required: ['career_level_issues', 'hallucination_issues', 'generic_phrase_issues', 'corrected_improvements', 'corrected_strengths', 'validation_passed'],
  },
}

// PRO 커리어 경로 전용 tool (3 salary bands, 2 points — expand route와 동일 스키마)
const proCareerTool: Anthropic.Tool = {
  name: 'generate_career_paths',
  description: '후보자 프로필을 바탕으로 3가지 커리어 방향(BASELINE/RECOMMENDED/STRETCH)을 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      career_paths: {
        type: 'array',
        description: 'BASELINE / RECOMMENDED / STRETCH 순서로 정확히 3개',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'BASELINE 또는 RECOMMENDED 또는 STRETCH' },
            label: { type: 'string', description: '현재 경로 유지 또는 추천 경로 또는 고성장 경로' },
            title: { type: 'string', description: '직무명 (한국 채용 시장 통용 포지션명)' },
            salary_range: { type: 'string', description: '예상 연봉 범위 (예: 4,500만원~6,500만원)' },
            salary_bands: {
              type: 'array',
              description: '3개: 1년 뒤, 3년 뒤, 5년 뒤',
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
            points: { type: 'array', items: { type: 'string' }, description: '이 경로의 실전 조언 2개' },
          },
          required: ['type', 'label', 'title', 'salary_range', 'salary_bands', 'points'],
        },
      },
    },
    required: ['career_paths'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { email, role } = session.user

    // Rate limiting (MANAGER 제외)
    if (role !== 'MANAGER') {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const rateLimitKey = `${email}:${ip}`
      const limited = await checkRateLimit(rateLimitKey, RATE_LIMITS.ANALYZE)

      if (!limited.success) {
        return NextResponse.json(
          { error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(RATE_LIMITS.ANALYZE.limit),
              'X-RateLimit-Remaining': String(limited.remaining),
              'X-RateLimit-Reset': String(limited.reset),
            }
          }
        )
      }
    }

    // 사용량 체크 (MANAGER 제외)
    if (role !== 'MANAGER') {
      const { allowed, limit } = await checkUsage(email, 'analyze')
      if (!allowed) {
        return NextResponse.json(
          { error: `이번 달 이력서 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하거나 쿠폰을 등록하세요.` },
          { status: 403 }
        )
      }
    }

    const formData = await req.formData()
    const file = formData.get('resume') as File | null
    const pastedText = ((formData.get('resumeText') as string | null) ?? '').trim()
    const preserveMode = (formData.get('preserveMode') as string | null) ?? 'auto'
    const replaceTargetId = (formData.get('replaceTargetId') as string | null) ?? null

    // 이력서 저장 개수 체크 (MANAGER 제외, 새로 추가하는 경우만)
    if (role !== 'MANAGER' && preserveMode !== 'replace') {
      // 현재 저장된 이력서 개수
      const { count: savedCount } = await supabase
        .from('analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_email', email)

      // 보유한 이력서 추가 저장 쿠폰 개수 (사용 여부 무관)
      const { count: resumeCouponCount } = await supabase
        .from('coupons')
        .select('id', { count: 'exact', head: true })
        .eq('claimed_by', email)
        .eq('feature', 'resume')
        .is('deleted_at', null)

      const allowedCount = 1 + (resumeCouponCount ?? 0) // 기본 1개 + 쿠폰 개수

      if ((savedCount ?? 0) >= allowedCount) {
        return NextResponse.json(
          { error: `이력서는 최대 ${allowedCount}개까지 저장됩니다 (현재 ${savedCount}개 저장됨). 추가 저장을 원하시면 "이력서 추가 저장 쿠폰"을 구매하세요. 사용 방법: 쿠폰 구매 후 내정보에서 등록!` },
          { status: 403 }
        )
      }
    }

    let resumeText: string
    let buffer: Buffer | null = null

    if (pastedText) {
      resumeText = pastedText
    } else {
      if (!file) return NextResponse.json({ error: '파일 또는 텍스트를 입력해 주세요.' }, { status: 400 })
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
      buffer = Buffer.from(await file.arrayBuffer())
      try {
        resumeText = await extractText(buffer, file.name)
      } catch (e) {
        const msg = e instanceof Error ? e.message : '파일을 읽을 수 없습니다.'
        return NextResponse.json({ error: msg }, { status: 422 })
      }
      if (!resumeText.trim()) {
        return NextResponse.json({ error: '이력서에서 텍스트를 추출할 수 없습니다.' }, { status: 422 })
      }
    }

    // 🔐 보안: 마스킹 전 원본에서 이름 추출 (Claude API로 전송 방지)
    const candidateName = extractNameFromResume(resumeText)

    const maskedText = maskPII(resumeText)

    const { data: planData } = await supabase
      .from('users').select('plan').eq('email', email).single()

    const plan = role === 'MANAGER' ? 'EXPERT' : (planData?.plan ?? 'FREE')
    const isPro = plan === 'PRO' || plan === 'EXPERT'

    const headhunterBase = `${BASE_HEADHUNTER_ROLE}

${B2C_PURPOSE}

[중요: 분석 일관성 유지]
이 분석 결과(직무, 핵심 강점, 개선 포인트, 커리어 패턴, 키워드 등)는 이후 JD 적합도 분석 및 이력서 보완 작업에서도 동일하게 참조됩니다.
동일 후보자에 대한 모든 분석은 서로 모순되지 않고 일관된 평가를 유지해야 합니다.
강점으로 판단한 항목은 JD 분석에서도 강점으로, 리스크로 판단한 항목은 JD 분석에서도 리스크로 평가되어야 합니다.`

    let resultPayload: Record<string, unknown>

    if (isPro) {
      // PRO: 기본 분석 → 커리어 경로 순차 실행 (병렬→504 문제 해결, maxDuration=90)
      const basicSystemPrompt = `${headhunterBase}

${ANALYSIS_STEPS}

STEP 4 — 종합 요약 작성 (summary 필드)
헤드헌터가 3초 안에 후보자를 파악할 수 있도록 핵심만 압축. 반드시 아래 형식 그대로 작성하며, 각 항목은 개행 문자(\n)로 구분:

포지셔닝 총 경력 N년차, 현재 [직급] 수준의 [직무] 전문가
핵심 강점 가장 임팩트 있는 성과 (반드시 구체적 수치, 프로젝트명 포함)
커리어 패턴 [성장형/전환형/순환형/분산형], 이직 시그널 분석
시장 제안 제안 가능 포지션 또는 명확한 리스크 1가지

정확한 예시 (반드시 이 형식 준수):
포지셔닝 총 7년차, 시니어급 백엔드 엔지니어
핵심 강점 카카오페이 결제 시스템 3년 운영, 일 1,000만 건 처리 경험 보유
커리어 패턴 성장형 커리어이나 최근 1년 재직으로 이직 탐색 추정
시장 제안 대기업 결제 플랫폼 시니어급 제안 가능, 단 팀 리드 경험 부재가 리스크

[중요] 각 항목은 반드시 개행(\n)으로 구분. 콜론(:) 사용 금지. 마침표(.)로 끝내지 말 것.

${OUTPUT_RULES}
- summary 각 항목은 반드시 개행(\n)으로 구분`

      const basicMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: [{
          type: 'text',
          text: basicSystemPrompt,
          cache_control: { type: 'ephemeral' }
        }],
        tool_choice: { type: 'tool', name: 'analyze_resume' },
        tools: [proBasicTool],
        messages: [{ role: 'user', content: `다음 이력서를 분석해주세요:\n\n${maskedText}` }],
      })

      // 🔍 토큰 사용량 로깅
      console.log('[analyze] 기본 분석 토큰:', {
        input: basicMsg.usage.input_tokens,
        output: basicMsg.usage.output_tokens,
        cache_creation: basicMsg.usage.cache_creation_input_tokens || 0,
        cache_read: basicMsg.usage.cache_read_input_tokens || 0,
        total: basicMsg.usage.input_tokens + basicMsg.usage.output_tokens
      })

      const basicTU = basicMsg.content.find(c => c.type === 'tool_use')
      if (!basicTU || basicTU.type !== 'tool_use') {
        return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
      }

      const basicInput = basicTU.input as Record<string, unknown>

      const scoresObj = basicInput.scores as Record<string, unknown> | undefined
      if (!scoresObj || typeof scoresObj.job_fit !== 'number') {
        console.error('[analyze] missing scores in PRO tool output:', JSON.stringify(basicInput).slice(0, 400))
        return NextResponse.json({ error: '분석 결과가 불완전합니다. 다시 시도해 주세요.' }, { status: 500 })
      }
      if (!Array.isArray(basicInput.keywords) || (basicInput.keywords as unknown[]).length === 0) {
        console.error('[analyze] missing keywords in PRO tool output:', JSON.stringify(basicInput).slice(0, 400))
        return NextResponse.json({ error: '분석 결과가 불완전합니다. 다시 시도해 주세요.' }, { status: 500 })
      }

      // 하이브리드 하네스 검증 단계 (토큰 절약: 환경 변수로 제어)
      const ENABLE_VALIDATION = process.env.ENABLE_VALIDATION !== 'false'

      if (ENABLE_VALIDATION) {
        console.log('[analyze] 🔍 검증 단계 실행 (ENABLE_VALIDATION=true)')
      } else {
        console.log('[analyze] ⚡ 검증 단계 건너뜀 (토큰 절약 모드)')
      }

      try {
        if (!ENABLE_VALIDATION) {
          // 검증 건너뛰기 → 1,500 tokens 절약
          throw new Error('SKIP_VALIDATION')
        }

        const validationPrompt = `${VALIDATION_PROMPT}

[1차 분석 결과]
총 경력: ${basicInput.total_experience_years ?? '미상'}년
개선 포인트: ${JSON.stringify(basicInput.improvements, null, 2)}
강점: ${JSON.stringify(basicInput.strengths, null, 2)}

[이력서 원문 (처음 3000자)]
${maskedText.slice(0, 3000)}

위 1차 분석 결과를 검증하고, 문제가 있으면 수정하십시오.`

        const validationMsg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          tool_choice: { type: 'tool', name: 'validate_analysis' },
          tools: [validationTool],
          messages: [{ role: 'user', content: validationPrompt }],
        })

        // 🔍 토큰 사용량 로깅
        console.log('[analyze] 검증 단계 토큰:', {
          input: validationMsg.usage.input_tokens,
          output: validationMsg.usage.output_tokens,
          total: validationMsg.usage.input_tokens + validationMsg.usage.output_tokens
        })

        const validationTU = validationMsg.content.find(c => c.type === 'tool_use')
        if (validationTU && validationTU.type === 'tool_use') {
          const validation = validationTU.input as ValidationResult
          if (!validation.validation_passed) {
            console.log('[analyze] ⚠️ 검증 실패 - 자동 수정:', {
              career_level_issues: validation.career_level_issues.length,
              hallucination_issues: validation.hallucination_issues.length,
              generic_phrase_issues: validation.generic_phrase_issues.length,
            })
            // 문제 발견 시 자동 수정
            if (validation.corrected_improvements.length > 0) {
              basicInput.improvements = validation.corrected_improvements
            }
            if (validation.corrected_strengths.length > 0) {
              basicInput.strengths = validation.corrected_strengths
            }
          } else {
            console.log('[analyze] ✅ 검증 통과 - 문제 없음')
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'SKIP_VALIDATION') {
          // 검증 건너뛰기 (정상 흐름)
        } else {
          console.error('[analyze] validation error (non-fatal):', err)
          // 검증 실패해도 분석은 계속 진행
        }
      }

      // 커리어 경로: 기본 분석 완료 후 순차 실행 (실패 시 [] 반환 — expand 엔드포인트가 재시도 역할)
      let careerPaths: unknown[] = []
      try {
        const strengths = Array.isArray(basicInput.strengths) ? (basicInput.strengths as string[]).join(' / ') : ''
        const improvements = Array.isArray(basicInput.improvements) ? (basicInput.improvements as string[]).join(' / ') : ''
        const keywords = Array.isArray(basicInput.keywords) ? (basicInput.keywords as string[]).join(', ') : ''

        const careerPrompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다. 아래 후보자 프로필을 바탕으로 3가지 커리어 방향을 제시하십시오.

[후보자 프로필]
현재 직무: ${basicInput.job_title ?? '미상'}
종합 요약: ${basicInput.summary ?? ''}
핵심 강점: ${strengths}
개선 포인트: ${improvements}
핵심 키워드: ${keywords}

[경로별 지침]
- BASELINE: 현재 직무 트랙을 유지/발전하는 가장 현실적인 경로
- RECOMMENDED: 강점을 최대로 활용한 현실적인 커리어 전환 경로. 지금보다 높은 연봉과 성장 가능성
- STRETCH: 2~3년 준비 시 도달 가능한 고성장/고위험 경로. 시장 희소성이 높은 포지션

각 경로에 연봉 밴드(1년 뒤, 3년 뒤, 5년 뒤)와 실전 조언 2개를 반드시 포함하십시오.`

        const careerMsg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          tool_choice: { type: 'tool', name: 'generate_career_paths' },
          tools: [proCareerTool],
          messages: [{ role: 'user', content: careerPrompt }],
        })

        // 🔍 토큰 사용량 로깅
        console.log('[analyze] 커리어 경로 토큰:', {
          input: careerMsg.usage.input_tokens,
          output: careerMsg.usage.output_tokens,
          cache_read: careerMsg.usage.cache_read_input_tokens || 0,
          total: careerMsg.usage.input_tokens + careerMsg.usage.output_tokens
        })

        const careerTU = careerMsg.content.find(c => c.type === 'tool_use')
        if (careerTU && careerTU.type === 'tool_use') {
          const paths = (careerTU.input as { career_paths: unknown[] }).career_paths
          if (Array.isArray(paths) && paths.length > 0) careerPaths = paths
        }
      } catch (err) {
        console.error('[analyze] career paths error (non-fatal):', err)
      }

      resultPayload = {
        ...basicInput,
        candidate_name: candidateName, // 원본 이름 (마스킹 전 추출)
        career_paths: careerPaths,
        plan,
      }
    } else {
      // FREE: 단일 call, BASELINE 1개
      const freeSystemPrompt = `${headhunterBase}

${ANALYSIS_STEPS}

STEP 4 — 이직 동기를 이력서 패턴에서 역추정하여 summary에 반영.

[커리어 경로]
career_paths에 BASELINE(현재 경로 유지) 1개만 반환하십시오.
- type: "BASELINE", label: "현재 경로 유지"
- title: 현실적인 직무명
- salary_range: 업계 시세 기반 연봉 범위 (예: 4,500만원~6,500만원)
- salary_bands: 1년 뒤/3년 뒤/5년 뒤/7년 뒤+ 연봉 밴드 4개 (min/max 만원 단위)
- points: 현재 경로에서 성공하기 위한 구체적 조언 3개

${OUTPUT_RULES}`

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: [{
          type: 'text',
          text: freeSystemPrompt,
          cache_control: { type: 'ephemeral' }
        }],
        tool_choice: { type: 'tool', name: 'analyze_resume' },
        tools: [baseTool],
        messages: [{ role: 'user', content: `다음 이력서를 분석해주세요:\n\n${maskedText}` }],
      })
      const toolUse = message.content.find(c => c.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
      }
      const freeInput = toolUse.input as Record<string, unknown>
      const freeScores = freeInput.scores as Record<string, unknown> | undefined
      if (!freeScores || typeof freeScores.job_fit !== 'number') {
        console.error('[analyze] missing scores in FREE tool output:', JSON.stringify(freeInput).slice(0, 400))
        return NextResponse.json({ error: '분석 결과가 불완전합니다. 다시 시도해 주세요.' }, { status: 500 })
      }
      if (!Array.isArray(freeInput.keywords) || (freeInput.keywords as unknown[]).length === 0) {
        console.error('[analyze] missing keywords in FREE tool output:', JSON.stringify(freeInput).slice(0, 400))
        return NextResponse.json({ error: '분석 결과가 불완전합니다. 다시 시도해 주세요.' }, { status: 500 })
      }

      // 하이브리드 하네스 검증 단계 (FREE도 동일 적용)
      try {
        const validationPrompt = `${VALIDATION_PROMPT}

[1차 분석 결과]
총 경력: ${freeInput.total_experience_years ?? '미상'}년
개선 포인트: ${JSON.stringify(freeInput.improvements, null, 2)}
강점: ${JSON.stringify(freeInput.strengths, null, 2)}

[이력서 원문 (처음 3000자)]
${maskedText.slice(0, 3000)}

위 1차 분석 결과를 검증하고, 문제가 있으면 수정하십시오.`

        const validationMsg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          tool_choice: { type: 'tool', name: 'validate_analysis' },
          tools: [validationTool],
          messages: [{ role: 'user', content: validationPrompt }],
        })

        // 🔍 토큰 사용량 로깅
        console.log('[analyze] 검증 단계 토큰:', {
          input: validationMsg.usage.input_tokens,
          output: validationMsg.usage.output_tokens,
          total: validationMsg.usage.input_tokens + validationMsg.usage.output_tokens
        })

        const validationTU = validationMsg.content.find(c => c.type === 'tool_use')
        if (validationTU && validationTU.type === 'tool_use') {
          const validation = validationTU.input as ValidationResult
          if (!validation.validation_passed) {
            console.log('[analyze] ⚠️ 검증 실패 - 자동 수정:', {
              career_level_issues: validation.career_level_issues.length,
              hallucination_issues: validation.hallucination_issues.length,
              generic_phrase_issues: validation.generic_phrase_issues.length,
            })
            // 문제 발견 시 자동 수정
            if (validation.corrected_improvements.length > 0) {
              freeInput.improvements = validation.corrected_improvements
            }
            if (validation.corrected_strengths.length > 0) {
              freeInput.strengths = validation.corrected_strengths
            }
          } else {
            console.log('[analyze] ✅ 검증 통과 - 문제 없음')
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'SKIP_VALIDATION') {
          // 검증 건너뛰기 (정상 흐름)
        } else {
          console.error('[analyze] validation error (non-fatal):', err)
          // 검증 실패해도 분석은 계속 진행
        }
      }

      resultPayload = {
        ...(toolUse.input as object),
        candidate_name: candidateName, // 원본 이름 (마스킹 전 추출)
        plan,
      }
    }

    // 사용량 증가 (MANAGER 제외)
    if (role !== 'MANAGER') {
      await incrementUsage(email, 'analyze')
    }

    const resultToSave = JSON.parse(JSON.stringify(resultPayload)) as Record<string, unknown>
    const { data: insertData, error: insertError } = await supabase
      .from('analyses')
      .insert({ user_email: email, result: resultToSave })
      .select('id')
      .single()
    if (insertError) {
      console.error('[analyze] insert error:', insertError)
      return NextResponse.json({ error: `분석 결과 저장 실패: ${insertError.message}` }, { status: 500 })
    }

    // 월간 업무 Report 자동 통합
    let monthlyReportMessage: string | null = null
    let integratedResult = resultToSave
    if (insertData?.id) {
      const { integrateMonthlyReports } = await import('@/lib/integrateMonthlyReports')
      const { updatedResult, changeMessage } = await integrateMonthlyReports(
        insertData.id,
        email,
        resultToSave
      )
      integratedResult = updatedResult
      monthlyReportMessage = changeMessage
      if (changeMessage) {
        console.log('[analyze] ✅ 월간 Report 통합:', changeMessage)
      }
    }

    // 캐시 무효화 (Dashboard 통계 갱신)
    await invalidateCache(`dashboard:stats:${email}`)

    // Eve 업데이트 (헤드헌터 공유 동의한 구직자)
    try {
      const { data: user } = await supabase
        .from('users')
        .select('user_type, headhunter_sharing_enabled, eve_candidate_id')
        .eq('email', email)
        .single()

      if (
        user?.user_type === 'JOBSEEKER' &&
        user?.headhunter_sharing_enabled &&
        user?.eve_candidate_id
      ) {
        console.log('[analyze] Eve 업데이트 시작:', user.eve_candidate_id)

        const eveResponse = await fetch(
          `${process.env.EVE_API_URL}/api/super-admin/candidates/${user.eve_candidate_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.ADAM_TO_EVE_API_KEY || ''
            },
            body: JSON.stringify({
              total_experience_years: resultPayload.total_experience_years,
              job_title: resultPayload.job_title,
              current_salary: resultPayload.current_salary,
              education: resultPayload.education,
              address: resultPayload.address || null,
              skills: resultPayload.keywords || [],
              strengths: resultPayload.strengths || [],
              career_summary: resultPayload.summary,
              analysis_result: resultPayload
            })
          }
        )

        if (eveResponse.ok) {
          console.log('[analyze] Eve 업데이트 성공')
        } else {
          console.error('[analyze] Eve 업데이트 실패:', eveResponse.status)
        }
      }
    } catch (err) {
      console.error('[analyze] Eve 업데이트 실패 (non-fatal):', err)
      // Eve 업데이트 실패는 치명적이지 않으므로 계속 진행
    }

    // 원본 파일 보존 (Re-Writing용)
    let rewriteSaved = false
    let rewriteFilePath: string | null = null
    let rewriteCouponUsed: string | null = null

    if (insertData?.id && preserveMode !== 'skip' && (file && buffer || pastedText)) {
      console.log('[analyze] 보존 조건 확인:', { preserveMode, hasFile: !!(file && buffer), hasPastedText: !!pastedText })
      const { data: prevAnalyses } = await supabase
        .from('analyses')
        .select('id, result')
        .eq('user_email', email)
        .limit(100)
      const preserved = (prevAnalyses ?? []).filter(
        (a) => a.result?._file_path && a.id !== insertData.id
      )
      const hasPreserved = preserved.length > 0

      let canPreserve = false

      if (preserveMode === 'replace') {
        // 기존 보존 이력서 교체 (무료)
        canPreserve = true

        // 교체 대상 결정: replaceTargetId가 있으면 해당 이력서, 없으면 첫 번째 이력서
        const targetToReplace = replaceTargetId
          ? preserved.find(a => a.id === replaceTargetId)
          : preserved[0]

        if (targetToReplace) {
          const oldPath = targetToReplace.result._file_path as string
          await supabase.storage.from('resumes').remove([oldPath])
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _file_path: _fp, ...restResult } = targetToReplace.result as Record<string, unknown>
          await supabase.from('analyses').update({ result: restResult }).eq('id', targetToReplace.id)
        }
      } else if (!hasPreserved) {
        // 첫 번째 보존 — 무료
        canPreserve = true
      } else {
        // 추가 보존 — rewrite 쿠폰 필요
        const { data: rewriteCoupons } = await supabase
          .from('coupons')
          .select('id, expires_at')
          .eq('claimed_by', email)
          .eq('feature', 'rewrite')
          .is('used_at', null)
        const validRewrite = (rewriteCoupons ?? []).find(
          (c) => !c.expires_at || new Date(c.expires_at) > new Date()
        )
        if (validRewrite) {
          rewriteCouponUsed = validRewrite.id
          canPreserve = true
        }
      }

      if (canPreserve) {
        console.log('[analyze] 이력서 보존 시작:', { email, preserveMode, hasPreserved })
        const uploadBuffer = (file && buffer) ? buffer : Buffer.from(pastedText, 'utf-8')
        const fileExt = (file && buffer) ? (file.name.split('.').pop()?.toLowerCase() ?? 'bin') : 'txt'
        const contentType = (file && buffer) ? file.type : 'text/plain'
        const filePath = `${email}/${insertData.id}.${fileExt}`
        const { error: storageErr } = await supabase.storage
          .from('resumes')
          .upload(filePath, uploadBuffer, { contentType, upsert: false })
        if (!storageErr) {
          const { error: updateErr } = await supabase.from('analyses')
            .update({ result: JSON.parse(JSON.stringify({ ...integratedResult, _file_path: filePath })) })
            .eq('id', insertData.id)
          if (updateErr) {
            console.error('[analyze] 이력서 보존 실패 - DB 업데이트 오류:', updateErr)
          } else {
            rewriteSaved = true
            rewriteFilePath = filePath
            console.log('[analyze] ✅ 이력서 파일 보존 성공:', { email, analysisId: insertData.id, filePath, preserveMode })
            if (rewriteCouponUsed) {
              await supabase.from('coupons')
                .update({ used_at: new Date().toISOString() })
                .eq('id', rewriteCouponUsed)
            }
          }
        } else {
          console.error('[analyze] 이력서 보존 실패 - 스토리지 업로드 오류:', storageErr.message, storageErr)
        }
      } else {
        console.log('[analyze] ❌ 보존 불가:', { canPreserve, hasPreserved, preserveMode, hasRewriteCoupon: !!rewriteCouponUsed })
      }
    } else {
      console.log('[analyze] ⏭️ 보존 생략:', {
        hasInsertId: !!insertData?.id,
        preserveMode,
        hasFile: !!(file && buffer),
        hasPastedText: !!pastedText
      })
    }

    return NextResponse.json({
      ...resultPayload,
      _id: insertData?.id ?? null,
      _rewrite_saved: rewriteSaved,
      ...(rewriteFilePath ? { _file_path: rewriteFilePath } : {}),
      ...(monthlyReportMessage ? { _monthly_report_integrated: monthlyReportMessage } : {}),
    })
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
