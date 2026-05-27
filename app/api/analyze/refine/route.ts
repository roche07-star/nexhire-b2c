import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { analysisId } = await req.json()
    if (!analysisId) return NextResponse.json({ error: '분析 ID가 없습니다.' }, { status: 400 })

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    const { data: userData } = await supabase.from('users').select('plan').eq('email', email).single()
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')
    if (plan === 'FREE') {
      return NextResponse.json({ error: 'PRO 이상 플랜에서 사용 가능합니다.' }, { status: 403 })
    }

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return NextResponse.json({ error: '분析을 찾을 수 없습니다.' }, { status: 404 })
    if (row.result?.refined) {
      return NextResponse.json({ error: '이미 보완 재분析이 완료되었습니다.' }, { status: 409 })
    }

    const r = row.result
    const prompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.

아래는 이미 완료된 이력서 분析 결과입니다.

직무: ${r.job_title ?? ''}
요약: ${r.summary ?? ''}
강점: ${(r.strengths ?? []).join(' / ')}
개선점: ${(r.improvements ?? []).join(' / ')}
커리어 방향: ${r.career_paths?.[0]?.title ?? r.careers?.[0] ?? ''}

이 분析을 바탕으로 후보자에게 보완적으로 제공할 구체적이고 실행 가능한 전략을 추가로 작성하십시오.
첫 번째 분析에서 이미 언급된 내용은 반복하지 말고, 놓쳤거나 더 깊게 짚을 수 있는 부분에 집중하십시오.
빈 말·격려 문구 절대 금지. 수치·직무명·회사 규모 등 구체적 근거를 포함하십시오.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      tool_choice: { type: 'tool', name: 'refine_analysis' },
      tools: [{
        name: 'refine_analysis',
        description: '이력서 분析 보완 결과',
        input_schema: {
          type: 'object' as const,
          properties: {
            action_items: {
              type: 'array',
              items: { type: 'string' },
              description: '1개월 내 즉시 실행 가능한 액션 아이템 3개 (구체적)',
            },
            skill_gaps: {
              type: 'array',
              items: { type: 'string' },
              description: '지금 당장 보강해야 할 핵심 역량 또는 자격 2~3개',
            },
            missed_points: {
              type: 'array',
              items: { type: 'string' },
              description: '첫 분析에서 놓쳤거나 더 강조해야 할 어필 포인트 2~3개',
            },
          },
          required: ['action_items', 'skill_gaps', 'missed_points'],
        },
      }],
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '재분析 결과를 받지 못했습니다.' }, { status: 500 })
    }

    const refinement = toolUse.input as {
      action_items: string[]
      skill_gaps: string[]
      missed_points: string[]
    }

    await supabase
      .from('analyses')
      .update({ result: { ...r, refined: true, refinement } })
      .eq('id', analysisId)

    return NextResponse.json({ refinement })
  } catch (e) {
    console.error('[analyze/refine]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
