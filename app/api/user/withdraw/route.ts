import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 회원 탈퇴 API
 *
 * - 유료 플랜: plan_end_date까지 서비스 이용 가능 (withdrawing 상태)
 * - FREE 플랜: 즉시 탈퇴 (withdrawn 상태)
 * - 데이터는 6개월간 보존
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { confirmed } = await req.json()
  if (!confirmed) {
    return NextResponse.json({ error: '탈퇴 확인이 필요합니다' }, { status: 400 })
  }

  const email = session.user.email

  // 현재 사용자 정보 확인
  const { data: userData } = await supabase
    .from('users')
    .select('plan, plan_end_date, status, last_restored_at')
    .eq('email', email)
    .single()

  if (!userData) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  // 이미 탈퇴 중이거나 탈퇴한 경우
  if (userData.status === 'withdrawing' || userData.status === 'withdrawn') {
    return NextResponse.json({ error: '이미 탈퇴 처리 중입니다' }, { status: 400 })
  }

  // 재가입 후 복원했던 경우: 이전 데이터 삭제, 최신 데이터만 보존
  if (userData.last_restored_at) {
    const restoredAt = new Date(userData.last_restored_at).toISOString()

    // last_restored_at 이전 데이터 삭제 (복원한 이전 데이터)
    await supabase.from('analyses').delete().eq('user_email', email).lt('created_at', restoredAt)
    await supabase.from('jd_analyses').delete().eq('user_email', email).lt('created_at', restoredAt)
    await supabase.from('interview_guides').delete().eq('user_email', email).lt('created_at', restoredAt)

    console.log(`[withdraw] Deleted old data before ${restoredAt} for ${email}`)
  }

  const now = new Date()
  const planEndDate = userData.plan_end_date ? new Date(userData.plan_end_date) : null

  // 유료 플랜이고 plan_end_date가 미래인 경우: withdrawing (종료일까지 유지)
  if (planEndDate && planEndDate > now) {
    const dataDeleteAt = new Date(planEndDate)
    dataDeleteAt.setMonth(dataDeleteAt.getMonth() + 6)  // 종료일 + 6개월

    const { error } = await supabase.from('users').update({
      status: 'withdrawing',
      withdraw_requested_at: now.toISOString(),
      data_delete_at: dataDeleteAt.toISOString(),
      last_restored_at: null,  // 탈퇴 시 복원 기록 초기화
    }).eq('email', email)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      status: 'withdrawing',
      plan_end_date: userData.plan_end_date,
      data_delete_at: dataDeleteAt.toISOString(),
      message: `플랜 종료일(${userData.plan_end_date})까지 서비스를 이용할 수 있습니다. 이후 6개월간 데이터가 보존됩니다.`,
    })
  }

  // FREE 플랜 또는 plan_end_date 지난 경우: 즉시 withdrawn
  const dataDeleteAt = new Date(now)
  dataDeleteAt.setMonth(dataDeleteAt.getMonth() + 6)  // 현재 + 6개월

  const { error } = await supabase.from('users').update({
    status: 'withdrawn',
    withdraw_requested_at: now.toISOString(),
    data_delete_at: dataDeleteAt.toISOString(),
    last_restored_at: null,  // 탈퇴 시 복원 기록 초기화
  }).eq('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    status: 'withdrawn',
    data_delete_at: dataDeleteAt.toISOString(),
    message: '탈퇴가 완료되었습니다. 데이터는 6개월간 보존되며, 재가입 시 복원할 수 있습니다.',
  })
}
