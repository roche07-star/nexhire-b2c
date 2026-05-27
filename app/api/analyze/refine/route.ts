import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { analysisId } = await req.json()
    if (!analysisId) return Response.json({ error: '분석 ID가 없습니다.' }, { status: 400 })

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    const { data: userData } = await supabase.from('users').select('plan').eq('email', email).single()
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')
    if (plan === 'FREE') {
      return Response.json({ error: 'PRO 이상 플랜에서 사용 가능합니다.' }, { status: 403 })
    }

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return Response.json({ error: '분석을 찾을 수 없습니다.' }, { status: 404 })
    if (row.result?.refined) {
      return Response.json({ error: '이미 보완 재분석이 완료되었습니다.' }, { status: 409 })
    }

    const r = row.result
    const prompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.

아래는 이미 완료된 이력서 분석 결과입니다.

직무: ${r.job_title ?? ''}
요약: ${r.summary ?? ''}
강점: ${(r.strengths ?? []).join(' / ')}
개선점: ${(r.improvements ?? []).join(' / ')}
커리어 방향: ${r.career_paths?.[0]?.title ?? r.careers?.[0] ?? ''}

이 분석을 바탕으로 후보자에게 보완적으로 제공할 구체적이고 실행 가능한 전략을 추가로 작성하십시오.
첫 번째 분석에서 이미 언급된 내용은 반복하지 말고, 놓쳤거나 더 깊게 짚을 수 있는 부분에 집중하십시오.
빈 말·격려 문구 절대 금지. 수치·직무명·회사 규모 등 구체적 근거를 포함하십시오.

반드시 아래 세 섹션으로 작성하십시오 (각 섹션 제목은 ## 으로 시작):

## 즉시 실행 액션 아이템 (1개월 내)
- 항목 1 (구체적 수치·직무명 포함)
- 항목 2
- 항목 3

## 보강이 필요한 핵심 역량
- 항목 1
- 항목 2

## 더 강조할 어필 포인트
- 항목 1
- 항목 2`

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    let fullText = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              fullText += text
              controller.enqueue(new TextEncoder().encode(text))
            }
          }
          await supabase
            .from('analyses')
            .update({ result: { ...r, refined: true, refinement_text: fullText } })
            .eq('id', analysisId)
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    console.error('[analyze/refine]', e)
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
