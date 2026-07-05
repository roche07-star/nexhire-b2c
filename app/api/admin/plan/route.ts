import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

const PLAN_PRIORITY = { FREE: 0, PRO: 1, EXPERT: 2 }

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super Admin 권한이 필요합니다.' }, { status: 403 })
  }

  const { email, plan } = await req.json()
  if (!email || !['FREE', 'PRO', 'EXPERT'].includes(plan)) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  // 현재 플랜 및 plan_end_date 확인
  const { data: userData } = await supabase
    .from('users')
    .select('plan, plan_end_date')
    .eq('email', email)
    .single()

  const currentPlan = userData?.plan ?? 'FREE'
  const planEndDate = userData?.plan_end_date

  // 업그레이드 vs 다운그레이드 판단
  const isUpgrade = PLAN_PRIORITY[plan as keyof typeof PLAN_PRIORITY] > PLAN_PRIORITY[currentPlan as keyof typeof PLAN_PRIORITY]

  // 업그레이드: 즉시 변경
  if (isUpgrade) {
    const updateData: Record<string, unknown> = {
      plan,
      analyze_count: 0,
      jd_count: 0,
      rewrite_count: 0,
      interview_count: 0,
      monthly_reset_at: new Date().toISOString(),
      downgrade_to: null,  // 기존 다운그레이드 예약 취소
      downgrade_requested_at: null,
    }

    const { error } = await supabase.from('users').update(updateData).eq('email', email)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      message: `${plan} 플랜으로 즉시 업그레이드되었습니다.`,
      immediate: true,
    })
  }

  // 다운그레이드: plan_end_date까지 유지 (있는 경우)
  if (planEndDate && new Date(planEndDate) > new Date()) {
    const { error } = await supabase.from('users').update({
      downgrade_to: plan,
      downgrade_requested_at: new Date().toISOString(),
    }).eq('email', email)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      message: `${plan} 플랜으로 다운그레이드가 예약되었습니다. ${planEndDate}까지 ${currentPlan} 플랜을 이용할 수 있습니다.`,
      immediate: false,
      plan_end_date: planEndDate,
    })
  }

  // plan_end_date 없거나 이미 지난 경우: 즉시 변경
  let updateData: Record<string, unknown> = {
    plan,
    monthly_reset_at: new Date().toISOString(),
    downgrade_to: null,
    downgrade_requested_at: null,
  }

  // 다운그레이드 to FREE: Max (이미 소진)
  if (plan === 'FREE') {
    updateData = {
      ...updateData,
      analyze_count: 3,
      jd_count: 3,
      rewrite_count: 3,
      interview_count: 0,
    }
  }
  // 다운그레이드 to PRO: 리셋
  else {
    updateData = {
      ...updateData,
      analyze_count: 0,
      jd_count: 0,
      rewrite_count: 0,
      interview_count: 0,
    }
  }

  const { error } = await supabase.from('users').update(updateData).eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    message: `${plan} 플랜으로 즉시 변경되었습니다.`,
    immediate: true,
  })
}
