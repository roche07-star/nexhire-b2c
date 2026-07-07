import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/fix-user-type
 * 임시: user_type이 null인 사용자를 수동으로 수정
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { userType } = await req.json()

    if (!userType || (userType !== 'JOBSEEKER' && userType !== 'HEADHUNTER')) {
      return NextResponse.json({ error: '올바른 사용자 유형을 선택해주세요.' }, { status: 400 })
    }

    const { data: before, error: beforeError } = await supabase
      .from('users')
      .select('user_type, plan, email')
      .eq('email', session.user.email)
      .maybeSingle()

    console.log('[fix-user-type] Email:', session.user.email)
    console.log('[fix-user-type] Before:', before, 'Error:', beforeError)

    if (beforeError) {
      return NextResponse.json({
        error: 'DB 조회 실패',
        details: beforeError.message
      }, { status: 500 })
    }

    if (!before) {
      return NextResponse.json({
        error: '사용자 레코드를 찾을 수 없습니다.',
        email: session.user.email
      }, { status: 404 })
    }

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        user_type: userType,
        service_type: 'B2C',
        last_service_use_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()

    console.log('[fix-user-type] Update result:', updateData, 'Error:', updateError)

    if (updateError) {
      console.error('[fix-user-type] Update error:', updateError)
      return NextResponse.json({
        error: 'user_type 업데이트 실패',
        details: updateError.message
      }, { status: 500 })
    }

    const { data: after, error: afterError } = await supabase
      .from('users')
      .select('user_type, plan, email')
      .eq('email', session.user.email)
      .maybeSingle()

    console.log('[fix-user-type] After:', after, 'Error:', afterError)

    return NextResponse.json({
      success: true,
      message: 'user_type이 업데이트되었습니다.',
      before,
      after
    })

  } catch (e) {
    console.error('[fix-user-type] Error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
