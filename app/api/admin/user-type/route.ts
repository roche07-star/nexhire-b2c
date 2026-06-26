import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { UserType } from '@/types/user'

/**
 * POST /api/admin/user-type
 * 관리자 전용: 사용자 유형 강제 변경
 *
 * 일반 사용자는 /api/user/set-type에서 1회만 설정 가능하지만,
 * 관리자는 언제든 변경 가능
 *
 * 작성자: 디바 (MIR Team)
 * 작성일: 2026-06-13
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { email, userType } = await req.json() as { email: string; userType: UserType }

    // 유효성 검증
    if (!email?.trim()) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })
    }

    if (!userType || !['JOBSEEKER', 'HEADHUNTER'].includes(userType)) {
      return NextResponse.json(
        { error: '올바른 사용자 유형을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 존재 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, user_type')
      .eq('email', email)
      .single()

    if (!existingUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // user_type 변경 (관리자는 제한 없이 변경 가능)
    const { error } = await supabase
      .from('users')
      .update({
        user_type: userType,
        user_type_selected_at: new Date().toISOString(), // 마지막 변경 시각 기록
      })
      .eq('email', email)

    if (error) {
      console.error('[admin/user-type] Update error:', error)
      return NextResponse.json({ error: '변경 중 오류가 발생했습니다.' }, { status: 500 })
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
