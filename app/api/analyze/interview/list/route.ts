import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 🔍 디버깅: 현재 로그인한 사용자 확인
    console.log('[interview/list] 요청 사용자:', session.user.email)

    // last_restored_at 조회 (탈퇴 후 재가입 시 이전 데이터 제외)
    const { data: userData } = await supabase
      .from('users')
      .select('last_restored_at')
      .eq('email', session.user.email)
      .maybeSingle()

    let query = supabase
      .from('interview_guides')
      .select('id, result, created_at, expires_at, user_email')
      .eq('user_email', session.user.email)
      .is('deleted_at', null)  // ✅ Soft delete 제외
      .gt('expires_at', new Date().toISOString())

    // last_restored_at 이후 생성된 것만 (재가입 후 데이터만)
    if (userData?.last_restored_at) {
      query = query.gte('created_at', userData.last_restored_at)
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(20)

    // 🔍 디버깅: 조회된 데이터 확인
    console.log('[interview/list] 조회된 건수:', data?.length ?? 0)
    if (data && data.length > 0) {
      console.log('[interview/list] 첫 번째 가이드 user_email:', data[0].user_email)
    }

    return NextResponse.json({ guides: data ?? [] })
  } catch (e) {
    console.error('[analyze/interview/list]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
