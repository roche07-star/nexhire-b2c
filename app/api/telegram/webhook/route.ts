import { NextRequest, NextResponse } from 'next/server'

/**
 * 텔레그램 Webhook
 * POST /api/telegram/webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Secret Token 검증 (임시 비활성화 - Chat ID 확인용)
    // const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
    // if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    //   console.error('[Telegram Webhook] Invalid secret token')
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await req.json()
    console.log('[Telegram Webhook] ========================================')
    console.log('[Telegram Webhook] FULL BODY:', JSON.stringify(body, null, 2))
    console.log('[Telegram Webhook] ========================================')

    // 메시지가 있으면 로그 (Chat ID 확인용)
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text
      const username = body.message.chat.username

      console.log('[Telegram Webhook] ⭐⭐⭐ Chat ID:', chatId, '⭐⭐⭐')
      console.log('[Telegram Webhook] Username:', username)
      console.log('[Telegram Webhook] Text:', text)

      // 환영 메시지 응답 (선택사항)
      if (text === '/start') {
        await sendMessage(chatId, '안녕하세요! Jobizic 알림 봇입니다.\n결제 완료 시 자동으로 알림을 보내드립니다.')
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function sendMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    })
  } catch (err) {
    console.error('[Telegram] Send message error:', err)
  }
}
