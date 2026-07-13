/**
 * Telegram Bot Utility Functions
 * 결제 완료 시 관리자에게 알림 전송
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export interface TelegramMessage {
  chatId: number | string
  text: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableWebPagePreview?: boolean
}

/**
 * 텔레그램 메시지 전송
 */
export async function sendTelegramMessage(options: TelegramMessage): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: options.chatId,
        text: options.text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disableWebPagePreview ?? true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Telegram] Send message failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Send message error:', error)
    return false
  }
}

/**
 * 관리자에게 결제 알림 전송
 */
export async function sendPaymentNotification(data: {
  type: 'plan' | 'coupon'
  userEmail: string
  productName: string
  amount: number
  gateway: string
}): Promise<boolean> {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!adminChatId) {
    console.log('[Telegram] TELEGRAM_ADMIN_CHAT_ID not configured')
    return false
  }

  const emoji = data.type === 'plan' ? '💳' : '🎁'
  const typeLabel = data.type === 'plan' ? '플랜 구매' : '쿠폰 구매'

  const text = `
${emoji} <b>${typeLabel} 완료</b>

👤 사용자: ${data.userEmail}
📦 상품: ${data.productName}
💰 금액: ${data.amount.toLocaleString()}원
💳 결제: ${data.gateway}

⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
`.trim()

  return sendTelegramMessage({
    chatId: adminChatId,
    text,
    parseMode: 'HTML',
  })
}

/**
 * 관리자에게 환불 알림 전송
 */
export async function sendRefundNotification(data: {
  type: 'plan' | 'coupon'
  userEmail: string
  productName: string
  amount: number
  reason?: string
  transactionId: string
}): Promise<boolean> {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!adminChatId) {
    console.log('[Telegram] TELEGRAM_ADMIN_CHAT_ID not configured')
    return false
  }

  const emoji = '🔄'
  const typeLabel = data.type === 'plan' ? '플랜' : '쿠폰'

  const text = `
${emoji} <b>환불 처리 완료</b>

👤 사용자: ${data.userEmail}
📦 상품: ${data.productName} (${typeLabel})
💰 금액: ${data.amount.toLocaleString()}원
📝 사유: ${data.reason || '사용자 취소'}
🔢 거래: ${data.transactionId.substring(0, 20)}...

⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
`.trim()

  return sendTelegramMessage({
    chatId: adminChatId,
    text,
    parseMode: 'HTML',
  })
}

/**
 * Webhook 설정
 */
export async function setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured')
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message'],
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      console.error('[Telegram] setWebhook failed:', result)
      return false
    }

    console.log('[Telegram] Webhook set successfully:', webhookUrl)
    return true
  } catch (error) {
    console.error('[Telegram] setWebhook error:', error)
    return false
  }
}

/**
 * 봇 정보 조회
 */
export async function getMe(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) return null

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`)
    const result = await response.json()
    return result.ok ? result.result : null
  } catch (error) {
    console.error('[Telegram] getMe error:', error)
    return null
  }
}

/**
 * Webhook 정보 조회
 */
export async function getWebhookInfo(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) return null

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`)
    const result = await response.json()
    return result.ok ? result.result : null
  } catch (error) {
    console.error('[Telegram] getWebhookInfo error:', error)
    return null
  }
}
