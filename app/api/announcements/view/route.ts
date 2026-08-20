import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 공지사항 확인 처리
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { announcementId } = await req.json()

    if (!announcementId) {
      return NextResponse.json({ error: 'announcementId 필요' }, { status: 400 })
    }

    // 확인 기록 저장 (UNIQUE 제약으로 중복 방지)
    const { error } = await supabase
      .from('announcement_views')
      .insert({
        announcement_id: announcementId,
        user_email: session.user.email,
      })

    // 이미 확인한 경우 에러 무시
    if (error && error.code !== '23505') { // 23505 = unique violation
      console.error('Save announcement view error:', error)
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Mark announcement viewed error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
