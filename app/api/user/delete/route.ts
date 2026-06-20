import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { email } = await req.json()
    if (email !== session.user.email) {
      return NextResponse.json({ error: '이메일이 일치하지 않습니다.' }, { status: 400 })
    }

    const userEmail = session.user.email

    console.log('[user/delete] Deleting user data for:', userEmail)

    // 분석 결과 삭제
    await supabase.from('jd_analyses').delete().eq('user_email', userEmail)
    await supabase.from('analyses').delete().eq('user_email', userEmail)

    // 쿠폰 삭제
    await supabase.from('coupons').delete().eq('user_email', userEmail)

    // 개인정보 동의 기록 삭제
    await supabase.from('consents').delete().eq('user_email', userEmail)

    // 면접 가이드 삭제 (있는 경우)
    await supabase.from('interview_guides').delete().eq('user_email', userEmail)

    // users 행 유지(어뷰징 방지), 개인정보 및 설정 초기화
    await supabase.from('users').update({
      plan: 'FREE',
      user_type: null,           // 사용자 유형 초기화
      service_type: 'B2C',       // 서비스 타입 기본값
      address: null,             // 주소 삭제
      analyze_count: 0,          // 사용량 초기화
      jd_count: 0,
      rewrite_count: 0,
      interview_count: 0,
    }).eq('email', userEmail)

    console.log('[user/delete] User data deleted successfully')

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[user/delete]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
