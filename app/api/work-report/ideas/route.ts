import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportHtml, monthOf } = body

    if (!reportHtml || !monthOf) {
      return NextResponse.json(
        { error: '리포트 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // Claude API 호출
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `다음은 구직자의 ${monthOf} 월간 업무 리포트입니다:

${reportHtml.replace(/<[^>]*>/g, '')}

이 리포트를 분석하고, 구직자가 더 나은 취업 성과를 얻을 수 있도록 **구체적이고 실행 가능한 개선 아이디어**를 3-5개 제시해주세요.

형식:
1. [영역] 구체적인 개선 아이디어
   - 왜 필요한가
   - 어떻게 실행할 것인가

**한국어로 작성하고, 친근하면서도 전문적인 톤으로 작성해주세요.**`
        }
      ]
    })

    const ideas = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ ideas })

  } catch (error: any) {
    console.error('아이디어 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '아이디어 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
