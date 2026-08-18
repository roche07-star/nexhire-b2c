import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 예약 구매 취소 API (사용자용)
 *
 * - 예약된 플랜 취소 (next_plan → NULL)
 * - 환불은 별도 요청 필요
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const email = session.user.email

  // 현재 사용자 정보 확인
  const { data: userData } = await supabase
    .from('users')
    .select('next_plan, next_plan_starts_at, next_plan_end_date')
    .eq('email', email)
    .single()

  if (!userData) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  // 예약된 플랜이 없으면 에러
  if (!userData.next_plan) {
    return NextResponse.json({ error: '예약된 플랜이 없습니다' }, { status: 400 })
  }

  // 예약 취소
  const { error } = await supabase
    .from('users')
    .update({
      next_plan: null,
      next_plan_starts_at: null,
      next_plan_end_date: null,
    })
    .eq('email', email)

  if (error) {
    console.error('예약 취소 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: '예약된 플랜이 취소되었습니다. 환불을 원하시면 관리자에게 문의해 주세요.',
    cancelled_plan: userData.next_plan,
  })
}
