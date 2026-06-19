import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { analysisId, userInput } = await req.json()
    if (!analysisId) return Response.json({ error: '분석 ID가 없습니다.' }, { status: 400 })
    if (!userInput?.trim()) return Response.json({ error: '추가 정보를 입력해 주세요.' }, { status: 400 })

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

후보자가 이력서에 누락되었거나 보완하고 싶다고 직접 입력한 추가 정보:
"""
${userInput.trim()}
"""

위 추가 정보를 기존 분석에 반영하여 종합적으로 재평가하십시오.
기존 분석에서 이 정보로 인해 달라지는 평가, 새롭게 강조할 수 있는 강점, 수정되어야 할 약점, 업그레이드된 커리어 방향을 구체적으로 작성하십시오.
빈 말/격려 문구 절대 금지. 수치/직무명/자격증명/회사 규모 등 구체적 근거를 포함하십시오.

반드시 아래 세 섹션으로 작성하십시오 (각 섹션 제목은 ## 으로 시작):

## 추가 정보 반영 시 달라지는 평가
- 항목 (기존 평가 대비 구체적으로 무엇이 달라지는지)

## 새롭게 강조할 수 있는 강점
- 항목 (수치/자격증/경험 포함)

## 업그레이드된 커리어 전략
- 항목 (직무명/연봉 수준 포함)`

    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
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
