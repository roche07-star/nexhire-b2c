import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/user/check-type
 * DB에서 직접 user_type 조회 (세션 갱신 딜레이 대응)
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('[check-type] DB error:', error)
      return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({
      userType: data?.user_type ?? null
    })

  } catch (e) {
    console.error('[check-type] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
