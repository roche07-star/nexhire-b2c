import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 예약 플랜 조기 활성화
 * POST /api/plan/activate-early
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const { feature } = await req.json()

    if (!feature) {
      return NextResponse.json({ error: 'feature 필수' }, { status: 400 })
    }

    // 현재 사용자 정보 조회
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('plan, next_plan, next_plan_starts_at, next_plan_end_date')
      .eq('email', session.user.email)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // 예약 플랜이 없으면 에러
    if (!user.next_plan || !user.next_plan_starts_at || !user.next_plan_end_date) {
      return NextResponse.json({ error: '예약된 플랜이 없습니다' }, { status: 400 })
    }

    const now = new Date()
    const nextPlan = user.next_plan
    const nextPlanEndDate = user.next_plan_end_date

    // 예약 플랜을 즉시 활성화
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: nextPlan,
        plan_end_date: nextPlanEndDate,
        downgrade_to: 'FREE',
        monthly_reset_at: now.toISOString(),
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
      })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('[Activate Early] Update error:', updateError)
      return NextResponse.json({ error: '플랜 활성화 실패' }, { status: 500 })
    }

    console.log(`[Activate Early] ✅ ${session.user.email}: ${user.plan} → ${nextPlan} (조기 활성화)`)

    return NextResponse.json({
      success: true,
      newPlan: nextPlan,
      message: `${nextPlan} 플랜이 활성화되었습니다`,
    })

  } catch (error: any) {
    console.error('[Activate Early] Error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
