import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 공지사항 읽음 처리
 * POST /api/announcements/mark-read
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { announcementId, dismissUntil } = await req.json()

    if (!announcementId) {
      return NextResponse.json({ error: 'announcementId가 필요합니다' }, { status: 400 })
    }

    // 읽음 처리 기록 생성 또는 업데이트
    const readData: any = {
      announcement_id: announcementId,
      user_email: session.user.email,
      read_at: new Date().toISOString()
    }

    // dismissUntil이 있으면 (오늘 하루 보지 않기)
    if (dismissUntil) {
      readData.dismissed_until = dismissUntil
    }

    const { data, error } = await supabase
      .from('announcement_reads')
      .upsert(readData, {
        onConflict: 'announcement_id,user_email'
      })
      .select()
      .single()

    if (error) {
      console.error('Mark read error:', error)
      return NextResponse.json({ error: '읽음 처리 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      read: data
    })

  } catch (error: any) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
