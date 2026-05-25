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

    if (role !== 'MANAGER') {
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

        const limit = (userData.plan === 'PRO' || userData.plan === 'EXPERT') ? Infinity : 1
        if (userData.analyze_count >= limit) {
          return NextResponse.json(
            { error: '이번 달 무료 분석 횟수(1회)를 모두 사용했습니다. PRO로 업그레이드하면 무제한 이용 가능합니다.' },
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

    const prompt = isPro
      ? `다음 이력서를 분석해 주세요. 헤드헌터의 관점에서 강점, 약점을 평가하고, BASELINE(현재 경로 유지) / RECOMMENDED(추천 경로) / STRETCH(고성장 경로) 3가지 커리어 경로를 각각 직무명, 연봉 범위, 연봉 밴드(1년 뒤/3년 뒤/5년 뒤/7년 뒤+), 구체적인 조언과 함께 제시해 주세요.\n\n---\n${maskedText}\n---`
      : `다음 이력서를 분석해 주세요. 헤드헌터의 관점에서 강점, 약점, 적합한 커리어 방향 1가지를 객관적으로 평가해 주세요.\n\n---\n${maskedText}\n---`

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: isPro ? 4096 : 2048,
      tool_choice: { type: 'tool', name: 'analyze_resume' },
      tools: [tool],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
    }

    if (role !== 'MANAGER') {
      await supabase.rpc('increment_analyze_count', { user_email: email })
    }

    const resultPayload = {
      ...(toolUse.input as object),
      plan,
      ...(candidateName ? { candidate_name: candidateName } : {}),
    }

    if (isPro) {
      const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
      const { error: insertError } = await supabase.from('analyses').insert({
        user_email: email,
        result: resultPayload,
        expires_at: expiresAt,
      })
      if (insertError) console.error('[analyze] insert error:', insertError)
    }

    return NextResponse.json(resultPayload)
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
