import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 유저용 공지사항 조회 (확인 안 한 공지만)
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ announcements: [] })
    }

    const userEmail = session.user.email
    const now = new Date().toISOString()

    // 1. 유저 정보 조회 (user_type 확인)
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', userEmail)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'

    // 2. 활성화된 공지사항 조회 (대상 유저 타입 + 기간 내)
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`target_user_type.eq.ALL,target_user_type.eq.${userType}`)
      .lte('starts_at', now)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('priority', { ascending: false }) // urgent 우선
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Announcements query error:', error)
      return NextResponse.json({ announcements: [] })
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({ announcements: [] })
    }

    // 3. 유저가 확인한 공지사항 ID 조회
    const { data: viewedData } = await supabase
      .from('announcement_views')
      .select('announcement_id')
      .eq('user_email', userEmail)

    const viewedIds = new Set(viewedData?.map(v => v.announcement_id) || [])

    // 4. 확인 안 한 공지만 필터링
    const unviewedAnnouncements = announcements.filter(a => !viewedIds.has(a.id))

    return NextResponse.json({ announcements: unviewedAnnouncements })

  } catch (error: any) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ announcements: [] })
  }
}
