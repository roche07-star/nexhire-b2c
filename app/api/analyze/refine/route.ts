import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { callClaude } from '@/lib/claude-client'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'
import { BASE_HEADHUNTER_ROLE, ANALYSIS_STEPS, OUTPUT_RULES, B2C_PURPOSE } from '@/lib/prompts/base-headhunter'

export const maxDuration = 60

const refineTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '보완 정보를 반영한 완전히 새로운 이력서 분석을 생성합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      job_title: { type: 'string', description: '이력서에서 파악된 현재 또는 목표 직무명' },
      total_experience_years: { type: 'number', description: '총 경력 연수 (소수점 가능)' },
      career_gap_warning: { type: 'string', description: '경력 공백 경고 (공백이 없으면 빈 문자열)' },
      education: { type: 'string', description: '최종 학력' },
      current_salary: { type: 'string', description: '현재 연봉 또는 직전 연봉' },
      address: { type: 'string', description: '거주지 주소' },
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      strengths: { type: 'array', items: { type: 'string' }, description: '핵심 강점 (최소 2개, 최대 4개)' },
      improvements: { type: 'array', items: { type: 'string' }, description: '개선 포인트 (최소 2개, 최대 4개)' },
      keywords: { type: 'array', items: { type: 'string' }, description: '핵심 키워드 (최대 8개)' },
      summary: { type: 'string', description: '종합 요약' },
    },
    required: ['job_title', 'scores', 'strengths', 'improvements', 'keywords', 'summary'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { analysisId, userInput } = await req.json()
    if (!analysisId) return NextResponse.json({ error: '분석 ID가 없습니다.' }, { status: 400 })
    if (!userInput?.trim()) return NextResponse.json({ error: '추가 정보를 입력해 주세요.' }, { status: 400 })

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    const { data: userData } = await supabase.from('users').select('plan').eq('email', email).single()
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')
    if (plan === 'FREE') {
      return NextResponse.json({ error: 'PRO 이상 플랜에서 사용 가능합니다.' }, { status: 403 })
    }

    // 사용량 체크 (MANAGER 제외)
    if (role !== 'MANAGER') {
      const { allowed, limit } = await checkUsage(email, 'analyze')
      if (!allowed) {
        return NextResponse.json(
          { error: `이번 달 이력서 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하세요.` },
          { status: 403 }
        )
      }
    }

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return NextResponse.json({ error: '분석을 찾을 수 없습니다.' }, { status: 404 })
    if (row.result?.refined) {
      return NextResponse.json({ error: '이미 보완 재분석이 완료되었습니다.' }, { status: 409 })
    }

    const r = row.result

    // 보완 정보를 포함한 "재구성된 이력서 텍스트"
    const reconstructedResume = `[기본 정보]
직무: ${r.job_title ?? '미상'}
총 경력: ${r.total_experience_years ?? '미상'}년
학력: ${r.education ?? '미상'}
현재 연봉: ${r.current_salary ?? '미상'}
${r.address ? `거주지: ${r.address}` : ''}

[종합 요약]
${r.summary ?? ''}

[핵심 강점]
${(r.strengths ?? []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

[개선 필요]
${(r.improvements ?? []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

[핵심 키워드]
${(r.keywords ?? []).join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【후보자가 추가로 제공한 보완 정보】
${userInput.trim()}`

    const systemPrompt = `${BASE_HEADHUNTER_ROLE}

${ANALYSIS_STEPS}

${OUTPUT_RULES}

${B2C_PURPOSE}

⚠️⚠️ 중요: 위는 기존 분석 결과와 후보자가 추가로 제공한 보완 정보입니다.
보완 정보를 반영하여 **완전히 새로운 전체 분석**을 생성하십시오.
기존 강점에 보완 정보로 발견된 강점을 추가하고, 개선점과 요약도 재작성하십시오.`

    const message = await callClaude({
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: reconstructedResume }],
      tools: [refineTool],
      tool_choice: { type: 'tool', name: 'analyze_resume' },
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    if (!toolUse || toolUse.name !== 'analyze_resume') {
      return NextResponse.json({ error: '분석 결과를 생성할 수 없습니다.' }, { status: 500 })
    }

    const basicInput = toolUse.input as any

    // 검증
    if (!Array.isArray(basicInput.strengths) || basicInput.strengths.length < 2) {
      return NextResponse.json({ error: '강점이 최소 2개 이상 필요합니다.' }, { status: 500 })
    }
    if (!Array.isArray(basicInput.improvements) || basicInput.improvements.length < 2) {
      return NextResponse.json({ error: '개선점이 최소 2개 이상 필요합니다.' }, { status: 500 })
    }

    // 기존 데이터 유지하면서 업데이트
    const updatedResult = {
      ...r,
      job_title: basicInput.job_title ?? r.job_title,
      total_experience_years: basicInput.total_experience_years ?? r.total_experience_years,
      career_gap_warning: basicInput.career_gap_warning ?? r.career_gap_warning,
      education: basicInput.education ?? r.education,
      current_salary: basicInput.current_salary ?? r.current_salary,
      address: basicInput.address ?? r.address,
      scores: basicInput.scores ?? r.scores,
      strengths: basicInput.strengths,
      improvements: basicInput.improvements,
      keywords: basicInput.keywords ?? r.keywords,
      summary: basicInput.summary ?? r.summary,
      refined: true,
    }

    // DB 업데이트
    await supabase
      .from('analyses')
      .update({ result: updatedResult })
      .eq('id', analysisId)

    // 사용량 증가
    await incrementUsage(email, 'analyze')

    return NextResponse.json({ success: true, result: updatedResult })
  } catch (e) {
    console.error('[analyze/refine]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
