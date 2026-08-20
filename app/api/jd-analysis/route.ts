import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 60

const jdAnalysisTool: Anthropic.Tool = {
  name: 'analyze_jd',
  description: '채용공고(JD)를 분석하여 우선순위, 난이도, 필수스킬, 타겟 프로필, 검색 전략을 도출합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      priority: {
        type: 'string',
        description: '우선순위 (상/중/하) - 급한 채용, 중요한 포지션일수록 상'
      },
      difficulty: {
        type: 'string',
        description: '난이도 (상/중/하) - 요구사항이 까다롭거나 시장에서 찾기 어려울수록 상'
      },
      required_skills: {
        type: 'array',
        items: { type: 'string' },
        description: '필수 기술/스킬 목록 (5-10개, 구체적으로)'
      },
      key_points: {
        type: 'array',
        items: { type: 'string' },
        description: 'JD의 핵심 포인트 (3-5개)'
      },
      target_profile: {
        type: 'string',
        description: '타겟 후보자 프로필 (2-3문장) - 어떤 배경/경험을 가진 사람이 적합한지'
      },
      search_strategy: {
        type: 'string',
        description: '검색/서치 전략 (2-3문장) - 어떤 채널에서 어떻게 찾을 것인지'
      },
      difficulty_reason: {
        type: 'string',
        description: '난이도 판단 근거 (1-2문장)'
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '검색 키워드 (5-8개)'
      }
    },
    required: ['priority', 'difficulty', 'required_skills', 'key_points', 'target_profile', 'search_strategy', 'difficulty_reason', 'keywords']
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 헤드헌터 또는 관리자만 접근 가능
    const userType = (session.user as any).userType?.toLowerCase()
    const userRole = (session.user as any).role
    if (userType !== 'headhunter' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: '헤드헌터 또는 관리자만 이용 가능한 기능입니다.' }, { status: 403 })
    }

    const { company, position, location, salary_estimate, content, client_comment, company_url } = await req.json()

    if (!company || !position || !content) {
      return NextResponse.json({ error: '회사명, 포지션, JD 내용은 필수입니다.' }, { status: 400 })
    }

    // Claude API 호출
    const prompt = `다음 채용공고를 분석해 주세요.

[회사명]
${company}

[포지션]
${position}

${location ? `[근무지]\n${location}\n\n` : ''}${salary_estimate ? `[연봉]\n${salary_estimate}\n\n` : ''}[JD 내용]
${content}

${client_comment ? `[인사팀 코멘트]\n${client_comment}\n\n` : ''}${company_url ? `[회사 URL]\n${company_url}\n\n` : ''}우선순위, 난이도, 필수 스킬, 타겟 프로필, 검색 전략을 분석해 주세요.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: '당신은 전문 헤드헌터입니다. 채용공고를 분석하여 우선순위, 난이도, 필수 스킬, 타겟 프로필, 검색 전략을 제시합니다.',
      messages: [{ role: 'user', content: prompt }],
      tools: [jdAnalysisTool],
      tool_choice: { type: 'tool', name: 'analyze_jd' }
    })

    const toolUse = response.content.find((c: any) => c.type === 'tool_use') as any
    if (!toolUse) {
      throw new Error('분석 결과를 생성하지 못했습니다.')
    }

    const result = {
      company,
      position,
      location: location || null,
      salary_estimate: salary_estimate || null,
      priority: toolUse.input.priority,
      difficulty: toolUse.input.difficulty,
      required_skills: toolUse.input.required_skills,
      key_points: toolUse.input.key_points,
      target_profile: toolUse.input.target_profile,
      search_strategy: toolUse.input.search_strategy,
      difficulty_reason: toolUse.input.difficulty_reason,
      keywords: toolUse.input.keywords,
      raw_text: content,
      client_comment: client_comment || null,
      company_url: company_url || null
    }

    // Supabase에 저장
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30일 보관

    const { data, error } = await supabase
      .from('jd_analyses')
      .insert({
        user_email: session.user.email,
        result,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error('저장 실패')
    }

    return NextResponse.json({
      result: data.result,
      id: data.id
    })

  } catch (e: any) {
    console.error('[jd-analysis] Error:', e)
    return NextResponse.json({ error: e.message || '분석 실패' }, { status: 500 })
  }
}
