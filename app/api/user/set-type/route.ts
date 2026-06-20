import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { UserType } from '@/types/user'

/**
 * POST /api/user/set-type
 * 사용자 유형 설정 (개인 vs 헤드헌터)
 *
 * 주의:
 * - 첫 로그인 시 1회만 설정 가능
 * - 설정 후 변경 불가 (영구 고정)
 * - MANAGER는 자동으로 HEADHUNTER 설정됨
 *
 * 작성자: 디바 (MIR Team)
 * 작성일: 2026-06-13
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { userType } = await req.json() as { userType: UserType }

    // 유효성 검증
    if (!userType || !['INDIVIDUAL', 'HEADHUNTER'].includes(userType)) {
      return NextResponse.json(
        { error: '올바른 사용자 유형을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 기존 user_type 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    // 이미 설정되어 있으면 변경 불가
    if (existingUser?.user_type) {
      return NextResponse.json(
        {
          error: `이미 ${existingUser.user_type === 'INDIVIDUAL' ? '개인 구직자' : '헤드헌터'}로 설정되어 있습니다.\n사용자 유형은 변경할 수 없습니다.`,
        },
        { status: 409 } // Conflict
      )
    }

    // user_type 및 service_type 설정
    const { error } = await supabase
      .from('users')
      .update({
        user_type: userType,
        service_type: userType === 'INDIVIDUAL' ? 'B2C' : 'B2B',
        user_type_selected_at: new Date().toISOString(),
      })
      .eq('email', session.user.email)

    if (error) {
      console.error('[set-type] Update error:', error)
      return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
    }

    console.log('[set-type] Success:', {
      email: session.user.email,
      userType,
    })

    return NextResponse.json({
      success: true,
      userType,
      message: userType === 'INDIVIDUAL'
        ? '개인 구직자 모드로 설정되었습니다!'
        : '헤드헌터 모드로 설정되었습니다!',
    })
  } catch (e) {
    console.error('[set-type] Error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
