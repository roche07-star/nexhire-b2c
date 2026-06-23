import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 관리자 전용 — 유저 삭제 API
 * 유저와 관련된 모든 데이터를 삭제합니다 (CASCADE)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 매니저 권한 확인
    const MANAGER_EMAILS = (process.env.MANAGER_EMAILS || '').split(',').map(e => e.trim())
    if (!MANAGER_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 })
    }

    // 자기 자신 삭제 방지
    if (email === session.user.email) {
      return NextResponse.json({ error: '자기 자신을 삭제할 수 없습니다.' }, { status: 400 })
    }

    // 다른 매니저 삭제 방지 (선택적)
    if (MANAGER_EMAILS.includes(email)) {
      return NextResponse.json({ error: '매니저 계정은 삭제할 수 없습니다.' }, { status: 400 })
    }

    console.log(`[admin] 유저 삭제 시작: ${email} (요청자: ${session.user.email})`)

    // 1. interview_guides 삭제
    const { error: interviewError } = await supabase
      .from('interview_guides')
      .delete()
      .eq('user_email', email)

    if (interviewError) {
      console.error('[admin] interview_guides 삭제 실패:', interviewError)
    } else {
      console.log('[admin] interview_guides 삭제 완료')
    }

    // 2. jd_analyses 삭제
    const { error: jdError } = await supabase
      .from('jd_analyses')
      .delete()
      .eq('user_email', email)

    if (jdError) {
      console.error('[admin] jd_analyses 삭제 실패:', jdError)
    } else {
      console.log('[admin] jd_analyses 삭제 완료')
    }

    // 3. analyses 삭제
    const { error: analysesError } = await supabase
      .from('analyses')
      .delete()
      .eq('user_email', email)

    if (analysesError) {
      console.error('[admin] analyses 삭제 실패:', analysesError)
    } else {
      console.log('[admin] analyses 삭제 완료')
    }

    // 4. coupons 삭제 (해당 유저에게 발급되거나 사용된 쿠폰)
    const { error: couponsError } = await supabase
      .from('coupons')
      .delete()
      .or(`issued_to.eq.${email},claimed_by.eq.${email}`)

    if (couponsError) {
      console.error('[admin] coupons 삭제 실패:', couponsError)
    } else {
      console.log('[admin] coupons 삭제 완료')
    }

    // 5. users 삭제 (마지막)
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)

    if (usersError) {
      console.error('[admin] users 삭제 실패:', usersError)
      return NextResponse.json(
        { error: '유저 삭제에 실패했습니다: ' + usersError.message },
        { status: 500 }
      )
    }

    console.log(`[admin] 유저 삭제 완료: ${email}`)

    return NextResponse.json({
      success: true,
      message: '유저와 관련된 모든 데이터가 삭제되었습니다.',
      email
    })

  } catch (error: any) {
    console.error('[admin] delete-user error:', error)
    return NextResponse.json(
      { error: error.message || '유저 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
