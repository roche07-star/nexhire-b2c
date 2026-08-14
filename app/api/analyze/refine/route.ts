import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { callClaude, streamClaude } from '@/lib/claude-client'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60


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

    // 보완 정보를 포함한 "재구성된 이력서 요약"
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

[커리어 경로]
${r.career_paths?.[0] ? `현재 경로: ${r.career_paths[0].title} (${r.career_paths[0].salary_range})` : r.careers?.[0] ?? '미상'}

【후보자가 추가로 제공한 보완 정보】
${userInput.trim()}`

    const prompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.

아래는 기존 이력서 분석 결과와 후보자가 추가로 제공한 보완 정보입니다.

${reconstructedResume}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 중요 지시사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**보완 정보를 반영하여 완전히 새로운 전체 분석을 생성하십시오.**

기존 분석과 보완 정보를 종합하여:
1. **강점 (최소 2개, 최대 4개)**: 기존 강점 + 보완 정보로 새롭게 발견된 강점을 재구성
2. **개선점 (최소 2개, 최대 4개)**: 보완 정보를 고려한 새로운 개선 포인트
3. **종합 요약**: 보완 정보를 포함한 전체 요약 재작성
4. **업그레이드된 커리어 방향**: 보완 정보로 인해 달라진 포지셔닝

빈 말/격려 문구 절대 금지. 수치/직무명/자격증명/회사 규모 등 구체적 근거를 포함하십시오.

반드시 아래 네 섹션으로 작성하십시오 (각 섹션 제목은 ## 으로 시작):

## 재분석된 핵심 강점
- 항목 (구체적 수치/자격증/경험 포함, 보완 정보 반영)

## 재분석된 개선 포인트
- 항목 (연차별 현실적 기준 적용, 보완 정보 반영)

## 보완된 종합 요약
기존 분석과 보완 정보를 종합한 전체 요약 (4-5문장)

## 업그레이드된 커리어 전략
보완 정보로 인해 달라진 포지셔닝 및 추천 경로 (구체적 직무명/연봉 수준 포함)`

    const stream = streamClaude({
      max_tokens: 2000, // 1500 → 2000 (전체 재분석이므로 더 긴 응답 필요)
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
