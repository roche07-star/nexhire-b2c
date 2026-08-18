import { auth } from '@/auth'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/notifications
 * 미열람 알림 조회
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', session.user.email)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[notifications] Query error:', error)
      Sentry.captureException(error)
      return NextResponse.json({ error: '알림을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })

  } catch (error: any) {
    console.error('[notifications] Error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
