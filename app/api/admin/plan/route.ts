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

  const { email, plan, duration } = await req.json()
  if (!email || !['FREE', 'PRO', 'EXPERT'].includes(plan)) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  // duration 검증 (1, 3, 6, 12, 0=무제한)
  if (duration !== undefined && ![0, 1, 3, 6, 12].includes(duration)) {
    return NextResponse.json({ error: '잘못된 기간' }, { status: 400 })
  }

  // 대상 사용자 정보 조회 (관리자 여부 확인)
  const { data: targetUser } = await supabase
    .from('users')
    .select('user_type')
    .eq('email', email)
    .single()

  const isAdmin = targetUser?.user_type === 'MANAGER' || targetUser?.user_type === 'SUPER_ADMIN'

  // 관리자 강제 플랜 변경: 무조건 즉시 적용
  const now = new Date()

  const updateData: Record<string, unknown> = {
    plan,
    downgrade_to: plan === 'FREE' || duration === 0 || isAdmin ? null : 'FREE', // 관리자와 무제한은 다운그레이드 없음
    downgrade_requested_at: null,
    next_plan: null,
    next_plan_starts_at: null,
    next_plan_end_date: null,
  }

  // 기간 설정 (FREE는 무제한, PRO/EXPERT는 선택된 기간)
  if (plan === 'FREE' || duration === 0) {
    // 무제한
    updateData.plan_end_date = null
    updateData.plan_expires_at = null
    updateData.monthly_reset_at = null
  } else if (duration && duration > 0) {
    // 지정된 기간
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + duration)
    updateData.plan_end_date = expires.toISOString().split('T')[0]
    updateData.plan_expires_at = expires.toISOString()
    updateData.monthly_reset_at = isAdmin ? null : expires.toISOString() // plan_end_date와 동일
  } else {
    // duration 없으면 기본 1개월
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + 1)
    updateData.plan_end_date = expires.toISOString().split('T')[0]
    updateData.plan_expires_at = expires.toISOString()
    updateData.monthly_reset_at = isAdmin ? null : expires.toISOString() // plan_end_date와 동일
  }

  // FREE 플랜: 사용량 Max (이미 소진)
  if (plan === 'FREE') {
    updateData.analyze_count = 3
    updateData.jd_count = 3
    updateData.rewrite_count = 3
    updateData.interview_count = 0
    updateData.weekly_report_count = 0
    updateData.monthly_report_count = 0
  }
  // PRO/EXPERT: 사용량 리셋
  else {
    updateData.analyze_count = 0
    updateData.jd_count = 0
    updateData.rewrite_count = 0
    updateData.interview_count = 0
    updateData.weekly_report_count = 0
    updateData.monthly_report_count = 0
  }

  const { error } = await supabase.from('users').update(updateData).eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    message: `${plan} 플랜으로 즉시 변경되었습니다.`,
    immediate: true,
  })
}
