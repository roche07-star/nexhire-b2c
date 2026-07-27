import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * PATCH /api/notifications/mark-read
 * 알림 읽음 처리
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await req.json()

    if (id) {
      // 특정 알림 읽음 처리
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_email', session.user.email)

      if (error) {
        console.error('[notifications/mark-read] Error:', error)
        return NextResponse.json({ error: '읽음 처리 실패' }, { status: 500 })
      }
    } else {
      // 전체 알림 읽음 처리
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_email', session.user.email)
        .eq('is_read', false)

      if (error) {
        console.error('[notifications/mark-read] Error:', error)
        return NextResponse.json({ error: '읽음 처리 실패' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[notifications/mark-read] Error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
