import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // ✅ deleted_at이 null이면 복원된 데이터 포함
    // ✅ analysis_id가 있는 것만 (JD + 이력서 매칭 분석)
    const { data } = await supabase
      .from('jd_analyses')
      .select('id, analysis_id, result, created_at, expires_at')
      .eq('user_email', session.user.email)
      .is('deleted_at', null)  // ✅ Soft delete 제외 (복원된 데이터는 deleted_at=null)
      .not('analysis_id', 'is', null)  // ✅ JD기반 분석만 (analysis_id 있음)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ analyses: data ?? [] })
  } catch (e) {
    console.error('[analyze/jd/list]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
