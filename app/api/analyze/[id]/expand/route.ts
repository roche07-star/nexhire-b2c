import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 45

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const careerPathsTool: Anthropic.Tool = {
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email

    // 플랜 확인
    const { data: userData } = await supabase
      .from('users').select('plan').eq('email', email).single()
    const role = (session.user as { role?: string }).role
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')
    if (plan === 'FREE') {
      return NextResponse.json({ error: 'PRO 플랜이 필요합니다.' }, { status: 403 })
    }

    // 기존 분석 조회
    const { data: row } = await supabase
      .from('analyses')
      .select('result')
      .eq('id', id)
      .eq('user_email', email)
      .single()

    if (!row) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = row.result as Record<string, unknown>

    // 이미 3개 경로가 있으면 그대로 반환
    const existingPaths = result.career_paths as unknown[]
    if (Array.isArray(existingPaths) && existingPaths.length >= 3) {
      return NextResponse.json({ career_paths: existingPaths })
    }

    // 기존 BASELINE 경로 추출
    const baseline = Array.isArray(existingPaths) && existingPaths.length > 0
      ? (existingPaths[0] as Record<string, unknown>)
      : null

    const strengths = Array.isArray(result.strengths) ? (result.strengths as string[]).join(' / ') : ''
    const improvements = Array.isArray(result.improvements) ? (result.improvements as string[]).join(' / ') : ''
    const keywords = Array.isArray(result.keywords) ? (result.keywords as string[]).join(', ') : ''

    const systemPrompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다. 아래 후보자 프로필을 바탕으로 3가지 커리어 방향을 제시하십시오.

[경로별 지침]
- BASELINE: 현재 직무 트랙을 유지/발전하는 가장 현실적인 경로. 위 BASELINE 방향과 일치해야 함
- RECOMMENDED: 강점을 최대로 활용한 현실적인 커리어 전환 경로. 지금보다 높은 연봉과 성장 가능성
- STRETCH: 2~3년 준비 시 도달 가능한 고성장/고위험 경로. 시장 희소성이 높은 포지션

각 경로에 연봉 밴드(1년 뒤, 3년 뒤, 5년 뒤)와 실전 조언 2개를 반드시 포함하십시오.`

    const userContent = `[후보자 프로필]
현재 직무: ${result.job_title ?? '미상'}
종합 요약: ${result.summary ?? ''}
핵심 강점: ${strengths}
개선 포인트: ${improvements}
핵심 키워드: ${keywords}
${baseline ? `현재 경로(BASELINE) 참고: ${(baseline.title as string) ?? ''} (${(baseline.salary_range as string) ?? ''})` : ''}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: [{
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }],
      tool_choice: { type: 'tool', name: 'generate_career_paths' },
      tools: [careerPathsTool],
      messages: [{ role: 'user', content: userContent }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '커리어 경로 생성에 실패했습니다.' }, { status: 500 })
    }

    const careerPaths = (toolUse.input as { career_paths: unknown[] }).career_paths
    if (!Array.isArray(careerPaths) || careerPaths.length === 0) {
      return NextResponse.json({ error: '커리어 경로 생성에 실패했습니다. 다시 시도해 주세요.' }, { status: 500 })
    }

    // DB 업데이트 (fire-and-forget)
    const updatedResult = { ...result, career_paths: careerPaths, plan: 'PRO' }
    supabase
      .from('analyses')
      .update({ result: updatedResult })
      .eq('id', id)
      .eq('user_email', email)
      .then(() => {})

    return NextResponse.json({ career_paths: careerPaths })
  } catch (e) {
    console.error('[analyze/expand]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
