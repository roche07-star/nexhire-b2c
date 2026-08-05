import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Cron job: 플랜 변경 자동 처리
 *
 * 매일 실행:
 * 1. plan_end_date 지난 사용자 중 downgrade_to 있으면 플랜 변경
 * 2. withdraw_requested 사용자 중 plan_end_date 지난 사용자 탈퇴 처리
 * 3. withdrawn 사용자 중 data_delete_at 지난 사용자 완전 삭제
 */
export async function GET(req: NextRequest) {
  // Vercel Cron 인증 (선택)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    planUpgrades: 0,
    planDowngrades: 0,
    withdrawals: 0,
    deletions: 0,
    errors: [] as string[],
  }

  try {
    // 0. 예약 플랜 활성화 (next_plan_starts_at 도달)
    const today = new Date().toISOString().split('T')[0]
    const { data: reservedUsers } = await supabase
      .from('users')
      .select('email, plan, next_plan, next_plan_starts_at, next_plan_end_date')
      .not('next_plan', 'is', null)
      .lte('next_plan_starts_at', new Date().toISOString())

    for (const user of reservedUsers ?? []) {
      const nextPlan = user.next_plan
      const nextPlanEndDate = user.next_plan_end_date

      const updateData = {
        plan: nextPlan,
        plan_end_date: nextPlanEndDate,
        downgrade_to: 'FREE',
        monthly_reset_at: new Date().toISOString(),
        next_plan: null,
        next_plan_starts_at: null,
        next_plan_end_date: null,
        // 사용량 리셋
        analyze_count: 0,
        jd_count: 0,
        rewrite_count: 0,
        interview_count: 0,
        proposal_count: 0,
        resume_count: 0,
        weekly_report_count: 0,
        monthly_report_count: 0,
      }

      const { error } = await supabase.from('users').update(updateData).eq('email', user.email)

      if (error) {
        results.errors.push(`Reserved plan activation failed for ${user.email}: ${error.message}`)
      } else {
        results.planUpgrades++
        console.log(`[cron] ✅ Activated reserved plan ${user.email}: ${user.plan} → ${nextPlan}`)
      }
    }

    // 1. 다운그레이드 처리 (plan_end_date 지남 + downgrade_to 있음)
    const { data: downgradeUsers } = await supabase
      .from('users')
      .select('email, plan, downgrade_to, plan_end_date')
      .not('downgrade_to', 'is', null)
      .lte('plan_end_date', new Date().toISOString().split('T')[0])

    for (const user of downgradeUsers ?? []) {
      const newPlan = user.downgrade_to
      let updateData: Record<string, unknown> = {
        plan: newPlan,
        downgrade_to: null,
        downgrade_requested_at: null,
        monthly_reset_at: new Date().toISOString(),
      }

      // 다운그레이드 to FREE: Max
      if (newPlan === 'FREE') {
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

      const { error } = await supabase.from('users').update(updateData).eq('email', user.email)

      if (error) {
        results.errors.push(`Downgrade failed for ${user.email}: ${error.message}`)
      } else {
        results.planDowngrades++
        console.log(`[cron] ✅ Downgraded ${user.email} from ${user.plan} to ${newPlan}`)
      }
    }

    // 2. 탈퇴 처리 (withdrawing → withdrawn)
    const { data: withdrawingUsers } = await supabase
      .from('users')
      .select('email, plan_end_date')
      .eq('status', 'withdrawing')
      .lte('plan_end_date', new Date().toISOString().split('T')[0])

    for (const user of withdrawingUsers ?? []) {
      const { error } = await supabase
        .from('users')
        .update({ status: 'withdrawn' })
        .eq('email', user.email)

      if (error) {
        results.errors.push(`Withdrawal failed for ${user.email}: ${error.message}`)
      } else {
        results.withdrawals++
        console.log(`[cron] ✅ Withdrawn ${user.email}`)
      }
    }

    // 3. 데이터 완전 삭제 (withdrawn → deleted)
    const { data: withdrawnUsers } = await supabase
      .from('users')
      .select('email, data_delete_at')
      .eq('status', 'withdrawn')
      .lte('data_delete_at', new Date().toISOString())

    for (const user of withdrawnUsers ?? []) {
      // 데이터 삭제 (외래 키 순서: interview_guides → jd_analyses → analyses)
      await supabase.from('interview_guides').delete().eq('user_email', user.email)
      await supabase.from('jd_analyses').delete().eq('user_email', user.email)
      await supabase.from('analyses').delete().eq('user_email', user.email)
      await supabase.from('coupons').delete().eq('claimed_by', user.email)

      // 사용자 삭제
      const { error } = await supabase.from('users').delete().eq('email', user.email)

      if (error) {
        results.errors.push(`Deletion failed for ${user.email}: ${error.message}`)
      } else {
        results.deletions++
        console.log(`[cron] ✅ Deleted ${user.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })

  } catch (error) {
    console.error('[cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    )
  }
}
