import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from '@/lib/extractText'
import { maskPII } from '@/lib/maskPII'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'

export const maxDuration = 90

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const baseTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '한국어 이력서를 분석하여 구직자의 강점, 개선점, 커리어 방향을 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      job_title: { type: 'string', description: '이력서에서 파악된 현재 또는 목표 직무명' },
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
      improvements: { type: 'array', items: { type: 'string' }, description: '개선 포인트 (최대 4개)' },
      keywords: { type: 'array', items: { type: 'string' }, description: '핵심 키워드 (최대 8개)' },
      summary: { type: 'string', description: '헤드헌터용 종합 요약. 각 항목은 줄바꿈(\\n)으로 구분. 포지셔닝: 경력N년차, 직급, 직무\\n핵심 강점: 수치/프로젝트명 포함\\n커리어 패턴: 성장형/전환형/순환형/분산형, 이직 시그널\\n시장 제안: 제안 가능 포지션 또는 리스크' },
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
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      summary: { type: 'string', description: '헤드헌터용 종합 요약. 각 항목은 줄바꿈(\\n)으로 구분. 포지셔닝: 경력N년차, 직급, 직무\\n핵심 강점: 수치/프로젝트명 포함\\n커리어 패턴: 성장형/전환형/순환형/분산형, 이직 시그널\\n시장 제안: 제안 가능 포지션 또는 리스크' },
      strengths: { type: 'array', items: { type: 'string' }, description: '이력서의 핵심 강점 (최대 4개)' },
      improvements: { type: 'array', items: { type: 'string' }, description: '개선이 필요한 부분 (최대 4개)' },
      keywords: { type: 'array', items: { type: 'string' }, description: '이력서에서 발견된 핵심 키워드 (최대 8개)' },
    },
    required: ['job_title', 'scores', 'summary', 'strengths', 'improvements', 'keywords'],
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

    const nameMatch = resumeText.match(
      /(이름|성명|Name|성 명|성함)\s*[:：]?\s*([가-힣]{2,5}|[a-zA-Z]{2,30}(?:\s[a-zA-Z]{1,20})?)/i
    )
    const candidateName = nameMatch ? nameMatch[2].trim() : undefined

    const maskedText = maskPII(resumeText)

    const { data: planData } = await supabase
      .from('users').select('plan').eq('email', email).single()

    const plan = role === 'MANAGER' ? 'EXPERT' : (planData?.plan ?? 'FREE')
    const isPro = plan === 'PRO' || plan === 'EXPERT'

    const headhunterBase = `당신은 10년 경력의 한국 시니어 헤드헌터입니다. 반도체, 로보틱스, 배터리, AI/fintech, 화장품 R&D, 자동차, 금융회계 등 다양한 산업군에서 임원~전문직급 서치를 수행해왔습니다.
이력서를 읽는 목적은 하나입니다: "이 사람을 클라이언트에게 제안할 수 있는가, 있다면 어떤 포지션에, 어떤 포인트로 제안하는가."
절대로 이력서를 요약하거나 나열하지 마십시오. 해석하고 판단하고 전략을 내십시오.`

    let resultPayload: Record<string, unknown>

    if (isPro) {
      // PRO: 기본 분석 → 커리어 경로 순차 실행 (병렬→504 문제 해결, maxDuration=90)
      const basicPrompt = `${headhunterBase}

[분석 절차]
STEP 1 — 후보자 기본 프로파일 파악
총 경력 연수는 반드시 직접 계산하십시오(후보자 기재 숫자를 그대로 믿지 말 것). 현 직장/직급/재직기간, 이직 횟수, 평균 재직기간, 추정 연봉 범위(업계 시세 기반, 명시된 경우 그대로)를 파악하십시오.

STEP 2 — 커리어 패턴 독해
[성장형/전환형/순환형/분산형] 중 하나로 판단하십시오.

STEP 3 — 강점/리스크/공백 3분류
- strengths: 구체적 수치·프로젝트명·결과물이 있는 항목만. "성과 없는 경험"은 강점 불가.
- improvements: ① 리스크(짧은 재직기간, 직급 대비 성과 불명확, 처우-시세 괴리 등) + ② 공백(해당 직군 통상 요구 역량 중 이력서에 근거 없는 것). 모든 항목을 강점으로 처리 금지.

STEP 4 — 종합 요약 작성 (summary 필드)
헤드헌터가 3초 안에 후보자를 파악할 수 있도록 핵심만 압축. 반드시 아래 순서대로 작성하며, 각 항목은 줄바꿈(\n)으로 구분:

포지셔닝: 총 경력 N년차, 현재 [직급] 수준의 [직무] 전문가.
핵심 강점: 가장 임팩트 있는 성과 (반드시 구체적 수치, 프로젝트명 포함).
커리어 패턴: [성장형/전환형/순환형/분산형], 이직 시그널 분석.
시장 제안: 제안 가능 포지션 또는 명확한 리스크 1가지.

예시:
포지셔닝: 총 7년차, 시니어급 백엔드 엔지니어.
핵심 강점: 카카오페이 결제 시스템 3년 운영, 일 1,000만 건 처리 경험 보유.
커리어 패턴: 성장형 커리어이나 최근 1년 재직으로 이직 탐색 추정.
시장 제안: 대기업 결제 플랫폼 시니어급 제안 가능. 단, 팀 리드 경험 부재.

[출력 규칙]
- 빈 말("다양한 경험", "뛰어난 역량", "풍부한 경력") 절대 금지
- 날짜/경력 계산 오류 금지
- 중간점(·) 사용 금지 → 쉼표(,) 또는 "및" 사용
  예: "Java · Spring" (X) → "Java, Spring" (O)
  예: "개발 · 운영" (X) → "개발 및 운영" (O)

---
[이력서]
${maskedText}
---`

      const basicMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        tool_choice: { type: 'tool', name: 'analyze_resume' },
        tools: [proBasicTool],
        messages: [{ role: 'user', content: basicPrompt }],
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
- BASELINE: 현재 직무 트랙을 유지·발전하는 가장 현실적인 경로
- RECOMMENDED: 강점을 최대로 활용한 현실적인 커리어 전환 경로. 지금보다 높은 연봉과 성장 가능성
- STRETCH: 2~3년 준비 시 도달 가능한 고성장·고위험 경로. 시장 희소성이 높은 포지션

각 경로에 연봉 밴드(1년 뒤, 3년 뒤, 5년 뒤)와 실전 조언 2개를 반드시 포함하십시오.`

        const careerMsg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          tool_choice: { type: 'tool', name: 'generate_career_paths' },
          tools: [proCareerTool],
          messages: [{ role: 'user', content: careerPrompt }],
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
        career_paths: careerPaths,
        plan,
        ...(candidateName ? { candidate_name: candidateName } : {}),
      }
    } else {
      // FREE: 단일 call, BASELINE 1개
      const freePrompt = `${headhunterBase}

[분석 절차]
STEP 1 — 총 경력 연수 직접 계산, 현 직장/직급, 이직 횟수, 추정 연봉 범위 파악.
STEP 2 — 커리어 패턴: [성장형/전환형/순환형/분산형] 판단 후 summary에 한 문장으로 명시.
STEP 3 — strengths는 수치·결과물 있는 항목만. improvements에는 리스크와 공백 모두 포함.
STEP 4 — 이직 동기를 이력서 패턴에서 역추정하여 summary에 반영.

[커리어 경로]
career_paths에 BASELINE(현재 경로 유지) 1개만 반환하십시오.
- type: "BASELINE", label: "현재 경로 유지"
- title: 현실적인 직무명
- salary_range: 업계 시세 기반 연봉 범위 (예: 4,500만원~6,500만원)
- salary_bands: 1년 뒤/3년 뒤/5년 뒤/7년 뒤+ 연봉 밴드 4개 (min/max 만원 단위)
- points: 현재 경로에서 성공하기 위한 구체적 조언 3개

[출력 규칙] 빈 말·근거 없는 강점 처리 금지.

----
[이력서]
${maskedText}
----`

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        tool_choice: { type: 'tool', name: 'analyze_resume' },
        tools: [baseTool],
        messages: [{ role: 'user', content: freePrompt }],
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
      resultPayload = {
        ...(toolUse.input as object),
        plan,
        ...(candidateName ? { candidate_name: candidateName } : {}),
      }
    }

    if (resumeCouponId) {
      await supabase.from('coupons').update({ used_at: new Date().toISOString() }).eq('id', resumeCouponId)
    } else if (role !== 'MANAGER') {
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

    // 원본 파일 보존 (Re-Writing용)
    let rewriteSaved = false
    let rewriteFilePath: string | null = null
    let rewriteCouponUsed: string | null = null

    if (insertData?.id && preserveMode !== 'skip' && (file && buffer || pastedText)) {
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
        // 기존 보존 이력서 모두 삭제 후 교체 (무료)
        canPreserve = true
        for (const a of preserved) {
          const oldPath = a.result._file_path as string
          await supabase.storage.from('resumes').remove([oldPath])
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _file_path: _fp, ...restResult } = a.result as Record<string, unknown>
          await supabase.from('analyses').update({ result: restResult }).eq('id', a.id)
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
        const uploadBuffer = (file && buffer) ? buffer : Buffer.from(pastedText, 'utf-8')
        const fileExt = (file && buffer) ? (file.name.split('.').pop()?.toLowerCase() ?? 'bin') : 'txt'
        const contentType = (file && buffer) ? file.type : 'text/plain'
        const filePath = `${email}/${insertData.id}.${fileExt}`
        const { error: storageErr } = await supabase.storage
          .from('resumes')
          .upload(filePath, uploadBuffer, { contentType, upsert: false })
        if (!storageErr) {
          const { error: updateErr } = await supabase.from('analyses')
            .update({ result: JSON.parse(JSON.stringify({ ...resultPayload, _file_path: filePath })) })
            .eq('id', insertData.id)
          if (updateErr) {
            console.error('[analyze] result update error:', updateErr)
          } else {
            rewriteSaved = true
            rewriteFilePath = filePath
            if (rewriteCouponUsed) {
              await supabase.from('coupons')
                .update({ used_at: new Date().toISOString() })
                .eq('id', rewriteCouponUsed)
            }
          }
        } else {
          console.error('[analyze] storage upload error:', storageErr.message, storageErr)
        }
      }
    }

    return NextResponse.json({
      ...resultPayload,
      _id: insertData?.id ?? null,
      _rewrite_saved: rewriteSaved,
      ...(rewriteFilePath ? { _file_path: rewriteFilePath } : {}),
    })
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
