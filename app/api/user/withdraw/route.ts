import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 회원 탈퇴 API
 *
 * - 유료 플랜: plan_end_date까지 서비스 이용 가능 (withdrawing 상태)
 *   → Cron Job이 plan_end_date 도달 시 자동으로 withdrawn 전환 및 데이터 삭제
 * - FREE 플랜: 즉시 탈퇴 (withdrawn 상태) 및 데이터 삭제
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

  // 이미 탈퇴 중이거나 탈퇴한 경우: status를 active로 복원하고 계속 진행
  // (재로그인 후 재탈퇴 케이스 처리)
  if (userData.status === 'withdrawing' || userData.status === 'withdrawn') {
    console.log(`[withdraw] User ${email} was already withdrawn, resetting to active and proceeding`)
    // status를 active로 복원하고 계속 진행
    await supabase.from('users').update({ status: 'active' }).eq('email', email)
  }

  // 재가입 후 복원했던 경우: 이전 데이터 삭제, 최신 데이터만 보존
  if (userData.last_restored_at) {
    const restoredAt = new Date(userData.last_restored_at).toISOString()

    // last_restored_at 이전 데이터 삭제 (복원한 이전 데이터) - 외래 키 순서 준수
    await supabase.from('interview_guides').delete().eq('user_email', email).lt('created_at', restoredAt)
    await supabase.from('jd_analyses').delete().eq('user_email', email).lt('created_at', restoredAt)
    await supabase.from('analyses').delete().eq('user_email', email).lt('created_at', restoredAt)

    console.log(`[withdraw] Deleted old data before ${restoredAt} for ${email}`)
  }

  const now = new Date()
  const planEndDate = userData.plan_end_date ? new Date(userData.plan_end_date) : null

  // 유료 플랜(PRO/EXPERT): withdrawing (종료일까지 유지)
  if (userData.plan === 'PRO' || userData.plan === 'EXPERT') {
    // plan_end_date가 없거나 과거면 현재 시점으로부터 30일 후로 설정
    const deleteDate = (planEndDate && planEndDate > now)
      ? planEndDate
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후

    const { error } = await supabase.from('users').update({
      status: 'withdrawing',
      withdraw_requested_at: now.toISOString(),
      data_delete_at: deleteDate.toISOString(),
      last_restored_at: null,  // 탈퇴 시 복원 기록 초기화
      name: null,              // ✅ 즉시 익명화
      image: null,             // ✅ 즉시 익명화
    }).eq('email', email)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 개인정보 동의 철회 (재가입 시 다시 동의하도록)
    await supabase.from('consents').update({
      is_agreed: false,
      withdrawn_at: now.toISOString(),
    }).eq('user_email', email).is('withdrawn_at', null)

    // ✅ 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action: 'user_withdraw',
      user_email: email,
      details: {
        status: 'withdrawing',
        deletion_stage: 'immediate',
        plan: userData.plan,
        plan_end_date: deleteDate.toISOString(),
        withdraw_type: 'scheduled'
      },
      deletion_stage: 'immediate'
    })

    console.log(`[withdraw] User ${email} set to withdrawing with immediate anonymization`)

    const endDateStr = userData.plan_end_date || deleteDate.toLocaleDateString('ko-KR')
    return NextResponse.json({
      status: 'withdrawing',
      plan_end_date: endDateStr,
      data_delete_at: deleteDate.toISOString(),
      message: planEndDate && planEndDate > now
        ? `플랜 종료일(${endDateStr})까지 서비스를 이용할 수 있습니다. 종료일에 계정이 탈퇴되고 모든 데이터가 삭제됩니다.`
        : `탈퇴 신청이 완료되었습니다. ${endDateStr}까지 서비스를 이용할 수 있으며, 이후 계정이 탈퇴되고 모든 데이터가 삭제됩니다.`,
    })
  }

  // FREE 플랜 또는 plan_end_date 지난 경우: 즉시 withdrawn 및 데이터 삭제
  const { error } = await supabase.from('users').update({
    status: 'withdrawn',
    withdraw_requested_at: now.toISOString(),
    data_delete_at: now.toISOString(), // 즉시 삭제
    last_restored_at: null,  // 탈퇴 시 복원 기록 초기화
  }).eq('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 개인정보 동의 철회 (soft delete)
  await supabase.from('consents').update({
    is_agreed: false,
    withdrawn_at: now.toISOString(),
  }).eq('user_email', email).is('withdrawn_at', null)

  // ✅ Soft delete: 즉시 삭제 대신 deleted_at 설정
  await supabase.from('analyses').update({
    deleted_at: now.toISOString()
  }).eq('user_email', email).is('deleted_at', null)

  await supabase.from('jd_analyses').update({
    deleted_at: now.toISOString()
  }).eq('user_email', email).is('deleted_at', null)

  await supabase.from('interview_guides').update({
    deleted_at: now.toISOString()
  }).eq('user_email', email).is('deleted_at', null)

  await supabase.from('jobs').update({
    deleted_at: now.toISOString()
  }).eq('user_email', email).is('deleted_at', null)

  // ✅ 개인정보 익명화 (즉시)
  await supabase.from('users').update({
    name: null,
    image: null,
  }).eq('email', email)

  // ✅ 감사 로그 기록
  await supabase.from('audit_logs').insert({
    action: 'user_withdraw',
    user_email: email,
    details: {
      status: 'withdrawn',
      deletion_stage: 'immediate',
      plan: userData.plan,
      withdraw_type: 'immediate'
    },
    deletion_stage: 'immediate'
  })

  // 📌 보존: payments, coupons는 삭제하지 않음 (법적 보존)

  console.log(`[withdraw] User ${email} withdrawn with soft delete`)

  return NextResponse.json({
    status: 'withdrawn',
    data_delete_at: now.toISOString(),
    message: '탈퇴가 완료되었습니다. 모든 데이터가 삭제되었습니다.',
  })
}
