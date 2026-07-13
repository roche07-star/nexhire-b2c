import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { setWebhook, getMe, getWebhookInfo } from '@/lib/telegram'

/**
 * POST /api/admin/telegram/setup
 * 텔레그램 봇 Webhook 설정 (SUPER_ADMIN 전용)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // SUPER_ADMIN 체크
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (user?.user_type !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다 (SUPER_ADMIN 전용)' }, { status: 403 })
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    const results: any = {
      botInfo: null,
      webhook: false,
    }

    // 1. 봇 정보 확인
    const botInfo = await getMe()
    if (!botInfo) {
      return NextResponse.json(
        { error: '봇 정보를 가져올 수 없습니다. TELEGRAM_BOT_TOKEN을 확인하세요.' },
        { status: 500 }
      )
    }
    results.botInfo = botInfo

    // 2. Webhook 설정
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://jobizic.vercel.app'}/api/telegram/webhook`
    const secretToken = process.env.TELEGRAM_SECRET_TOKEN || crypto.randomUUID()

    const webhookSet = await setWebhook(webhookUrl, secretToken)
    results.webhook = webhookSet

    // 3. 환경 변수 가이드
    const warnings = []
    if (!process.env.TELEGRAM_SECRET_TOKEN) {
      warnings.push(`TELEGRAM_SECRET_TOKEN이 설정되지 않았습니다. .env에 추가하세요: TELEGRAM_SECRET_TOKEN=${secretToken}`)
    }
    if (!process.env.TELEGRAM_ADMIN_CHAT_ID) {
      warnings.push('TELEGRAM_ADMIN_CHAT_ID가 설정되지 않았습니다. 봇과 대화 후 chat_id를 확인하세요.')
    }

    if (warnings.length > 0) {
      results.warning = warnings.join('\n')
    }

    // 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action: 'telegram_setup',
      actor_email: session.user.email,
      details: {
        botUsername: botInfo.username,
        webhookUrl,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: '텔레그램 봇 설정이 완료되었습니다!',
      ...results,
    })
  } catch (error: any) {
    console.error('[Telegram Setup] Error:', error)
    return NextResponse.json(
      { error: error.message || '설정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/telegram/setup
 * 텔레그램 봇 설정 상태 확인 (SUPER_ADMIN 전용)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // SUPER_ADMIN 체크
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (user?.user_type !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다 (SUPER_ADMIN 전용)' }, { status: 403 })
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        configured: false,
        message: 'TELEGRAM_BOT_TOKEN이 설정되지 않았습니다',
      })
    }

    const botInfo = await getMe()
    const webhookInfo = await getWebhookInfo()

    return NextResponse.json({
      configured: !!botInfo && !!webhookInfo?.url,
      botInfo,
      webhookUrl: webhookInfo?.url || null,
      webhookInfo,
      hasSecretToken: !!process.env.TELEGRAM_SECRET_TOKEN,
      hasAdminChatId: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    })
  } catch (error: any) {
    console.error('[Telegram Setup] Get status error:', error)
    return NextResponse.json(
      { error: error.message || '상태 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
