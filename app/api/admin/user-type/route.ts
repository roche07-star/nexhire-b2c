import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'
import type { UserType } from '@/types/user'

/**
 * POST /api/admin/user-type
 * Super Admin 전용: 사용자 유형 강제 변경
 *
 * 일반 사용자는 /api/user/set-type에서 1회만 설정 가능하지만,
 * Super Admin은 언제든 변경 가능
 *
 * 작성자: 디바 (MIR Team)
 * 작성일: 2026-06-13
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[admin/user-type] Request start')

    const session = await auth()
    console.log('[admin/user-type] Session:', { email: session?.user?.email, userType: session?.user?.userType })

    if (!session?.user || !isSuperAdmin(session)) {
      console.log('[admin/user-type] Unauthorized')
      return NextResponse.json({ error: 'Super Admin 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await req.json()
    console.log('[admin/user-type] Request body:', body)
    const { email, userType } = body as { email: string; userType: UserType }

    // 유효성 검증
    if (!email?.trim()) {
      console.log('[admin/user-type] Email missing')
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })
    }

    const validTypes: UserType[] = ['SUPER_ADMIN', 'MANAGER', 'HEADHUNTER', 'JOBSEEKER']
    if (!userType || !validTypes.includes(userType)) {
      console.log('[admin/user-type] Invalid userType:', userType)
      return NextResponse.json(
        { error: '올바른 사용자 유형을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 존재 확인
    console.log('[admin/user-type] Checking user exists:', email)
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('email, user_type')
      .eq('email', email)
      .single()

    if (selectError) {
      console.error('[admin/user-type] Select error:', selectError)
    }

    if (!existingUser) {
      console.log('[admin/user-type] User not found')
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    console.log('[admin/user-type] Existing user:', existingUser)

    // user_type 변경 (관리자는 제한 없이 변경 가능)
    console.log('[admin/user-type] Updating user_type to:', userType)

    // Manager로 변경 시 플랜도 EXPERT로 설정
    const updateData: any = { user_type: userType }
    if (userType === 'MANAGER') {
      updateData.plan = 'EXPERT'
    }

    const { error, data } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email)
      .select()

    console.log('[admin/user-type] Update result:', { error, data })

    if (error) {
      console.error('[admin/user-type] Update error:', error)
      return NextResponse.json({
        error: '변경 중 오류가 발생했습니다.',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('[admin/user-type] Success:', {
      admin: session.user.email,
      targetEmail: email,
      userType,
      previousType: existingUser.user_type,
    })

    return NextResponse.json({
      success: true,
      email,
      userType,
      message: `${email}을(를) ${userType === 'JOBSEEKER' ? '구직자' : '헤드헌터'}로 변경했습니다.`,
    })
  } catch (e) {
    console.error('[admin/user-type] Error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
