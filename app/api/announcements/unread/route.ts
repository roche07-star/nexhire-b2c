import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 미열람 공지사항 조회
 * GET /api/announcements/unread
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 사용자 타입 조회
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'
    const isAdmin = userType === 'SUPER_ADMIN' || userType === 'MANAGER'

    // 활성화된 공지사항 조회 (대상 필터링)
    const now = new Date().toISOString()
    let query = supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)

    // 관리자는 모든 공지를 볼 수 있음
    if (!isAdmin) {
      query = query.or(`target_user_type.eq.${userType},target_user_type.eq.ALL`)
    }

    const { data: announcements, error: announcementsError } = await query
      .order('priority', { ascending: false }) // urgent first
      .order('created_at', { ascending: false })

    if (announcementsError) {
      console.error('Announcements query error:', announcementsError)
      return NextResponse.json({ error: '공지사항 조회 실패' }, { status: 500 })
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({ announcements: [] })
    }

    // 읽음 처리된 공지사항 조회
    const { data: reads } = await supabase
      .from('announcement_reads')
      .select('announcement_id, dismissed_until')
      .eq('user_email', session.user.email)
      .in('announcement_id', announcements.map(a => a.id))

    const readMap = new Map(reads?.map(r => [r.announcement_id, r]) || [])

    // 미열람 공지만 필터링
    const unreadAnnouncements = announcements.filter(announcement => {
      const read = readMap.get(announcement.id)
      if (!read) return true // 읽음 기록 없음 = 미열람

      // dismissed_until이 있고 아직 유효하면 제외
      if (read.dismissed_until) {
        const dismissedUntil = new Date(read.dismissed_until)
        if (dismissedUntil > new Date()) {
          return false
        }
      }

      return false // 읽음 처리됨
    })

    return NextResponse.json({
      announcements: unreadAnnouncements
    })

  } catch (error: any) {
    console.error('Unread announcements error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
