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

  // 관리자 강제 플랜 변경: 무조건 즉시 적용
  const updateData: Record<string, unknown> = {
    plan,
    plan_end_date: null,
    plan_expires_at: null,
    monthly_reset_at: new Date().toISOString(),
    downgrade_to: null,
    downgrade_requested_at: null,
    next_plan: null,
    next_plan_starts_at: null,
    next_plan_end_date: null,
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
