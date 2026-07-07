import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // last_restored_at 조회 (탈퇴 후 재가입 시 이전 데이터 제외)
    const { data: userData } = await supabase
      .from('users')
      .select('last_restored_at')
      .eq('email', session.user.email)
      .maybeSingle()

    let query = supabase
      .from('jd_analyses')
      .select('id, analysis_id, result, created_at, expires_at')
      .eq('user_email', session.user.email)

    // last_restored_at 이후 생성된 것만 (재가입 후 데이터만)
    if (userData?.last_restored_at) {
      query = query.gte('created_at', userData.last_restored_at)
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ analyses: data ?? [] })
  } catch (e) {
    console.error('[analyze/jd/list]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
