import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 구독 종료 API (사용자용)
 *
 * - 자신의 플랜을 FREE로 다운그레이드
 * - plan_end_date 있으면 예약, 없으면 즉시 전환
 * - FREE 플랜이면 에러 반환
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
    .select('plan, plan_end_date, monthly_reset_at')
    .eq('email', email)
    .single()

  if (!userData) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  // 이미 FREE 플랜이면 에러
  if (userData.plan === 'FREE') {
    return NextResponse.json({ error: '이미 FREE 플랜입니다' }, { status: 400 })
  }

  const now = new Date()

  // plan_end_date 결정: 있으면 사용, 없으면 monthly_reset_at + 1달
  let planEndDate: Date | null = null
  if (userData.plan_end_date) {
    planEndDate = new Date(userData.plan_end_date)
  } else if (userData.monthly_reset_at) {
    // monthly_reset_at은 마지막 리셋 날짜 → 다음 리셋일 계산
    planEndDate = new Date(userData.monthly_reset_at)
    planEndDate.setMonth(planEndDate.getMonth() + 1)
  }

  // planEndDate가 미래인 경우: 다운그레이드 예약
  if (planEndDate && planEndDate > now) {
    const updates: any = {
      downgrade_to: 'FREE',
      downgrade_requested_at: now.toISOString(),
    }

    // plan_end_date가 없었으면 설정
    if (!userData.plan_end_date) {
      updates.plan_end_date = planEndDate.toISOString().split('T')[0]  // YYYY-MM-DD
    }

    const { error } = await supabase.from('users').update(updates).eq('email', email)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '구독 종료가 예약되었습니다',
      plan_end_date: planEndDate.toLocaleDateString('ko-KR'),
      downgrade_to: 'FREE',
    })
  }

  // plan_end_date 없거나 지난 경우: 즉시 FREE로 전환
  const { error } = await supabase.from('users').update({
    plan: 'FREE',
    analyze_count: 3,  // FREE 플랜 Max
    jd_count: 3,
    rewrite_count: 3,
    interview_count: 0,
    monthly_reset_at: now.toISOString(),
    plan_end_date: null,
    downgrade_to: null,
    downgrade_requested_at: null,
  }).eq('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'FREE 플랜으로 전환되었습니다',
    plan: 'FREE',
  })
}
