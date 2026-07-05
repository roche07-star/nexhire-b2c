import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'
import { CHATBOT_SYSTEM_PROMPT } from '@/lib/chatbot-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages 필수' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: CHATBOT_SYSTEM_PROMPT,
      messages,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: '응답 오류' }, { status: 500 })
    }

    return NextResponse.json({
      message: content.text,
      usage: response.usage,
    })
  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      { error: '챗봇 응답 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
