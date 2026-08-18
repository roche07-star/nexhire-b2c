import { NextRequest, NextResponse } from 'next/server'

/**
 * Sentry Webhook → 텔레그램 알림
 *
 * Sentry에서 에러 발생 시 자동으로 텔레그램으로 알림을 보냅니다.
 *
 * 설정 방법:
 * 1. Sentry 대시보드 → Settings → Integrations → Webhooks
 * 2. Add Webhook
 * 3. URL: https://jobizic.com/api/webhooks/sentry
 * 4. Events: issue.created, issue.assigned
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('[Sentry Webhook] Received:', payload)

    // Sentry 이벤트 타입 확인
    const action = payload.action
    const data = payload.data?.issue || payload.data

    if (!data) {
      console.warn('[Sentry Webhook] No issue data')
      return NextResponse.json({ ok: true, message: 'No issue data' })
    }

    // 텔레그램 메시지 생성
    const message = formatTelegramMessage(action, data)

    // 텔레그램 전송
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

    if (!telegramBotToken || !telegramChatId) {
      console.error('[Sentry Webhook] Telegram credentials missing')
      return NextResponse.json(
        { error: 'Telegram credentials missing' },
        { status: 500 }
      )
    }

    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
    const telegramRes = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!telegramRes.ok) {
      const error = await telegramRes.text()
      console.error('[Sentry Webhook] Telegram send failed:', error)
      return NextResponse.json(
        { error: 'Telegram send failed', details: error },
        { status: 500 }
      )
    }

    console.log('[Sentry Webhook] Telegram sent successfully')
    return NextResponse.json({ ok: true, message: 'Notification sent' })

  } catch (error) {
    console.error('[Sentry Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * 텔레그램 메시지 포맷
 */
function formatTelegramMessage(action: string, issue: any): string {
  const title = issue.title || 'Unknown Error'
  const culprit = issue.culprit || 'Unknown'
  const level = issue.level || 'error'
  const url = issue.web_url || issue.url || '#'
  const project = issue.project?.name || 'Unknown'
  const environment = issue.tags?.find((t: any) => t.key === 'environment')?.value || 'unknown'

  // 사용자 정보
  const user = issue.tags?.find((t: any) => t.key === 'user')?.value ||
                issue.tags?.find((t: any) => t.key === 'user.email')?.value ||
                'Unknown'

  // 에러 위치 (파일명:라인)
  const location = issue.metadata?.filename
    ? `${issue.metadata.filename}:${issue.metadata.function}`
    : culprit

  // 이모지 선택
  const emoji = level === 'fatal' ? '🔴' :
                level === 'error' ? '⚠️' :
                level === 'warning' ? '🟡' : 'ℹ️'

  const actionText = action === 'created' ? '새 에러 발생' :
                      action === 'resolved' ? '에러 해결됨' :
                      action === 'assigned' ? '에러 할당됨' :
                      `이벤트: ${action}`

  return `
${emoji} <b>${actionText}</b>

<b>프로젝트:</b> ${project}
<b>환경:</b> ${environment}
<b>레벨:</b> ${level.toUpperCase()}

<b>에러:</b> ${escapeHtml(title)}
<b>위치:</b> <code>${escapeHtml(location)}</code>

<b>사용자:</b> ${escapeHtml(user)}

<a href="${url}">Sentry에서 보기</a>
`.trim()
}

/**
 * HTML 이스케이프
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
