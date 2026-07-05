import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

/**
 * 정산 요약 정보 조회 (SUPER_ADMIN 전용)
 * GET /api/admin/settlements/summary?start=2026-07-01&end=2026-07-31
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const end = searchParams.get('end') || new Date().toISOString().split('T')[0]

  // 종료일에 시간 추가 (해당 날짜 23:59:59까지 포함)
  const endWithTime = end + 'T23:59:59.999Z'

  try {
    // 1. 총 매출 (해당 기간 내 성공한 결제)
    const { data: successPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success')
      .gte('paid_at', start)
      .lte('paid_at', endWithTime)

    if (paymentsError) throw paymentsError

    const grossRevenue = (successPayments || []).reduce((sum, p) => sum + p.amount, 0)

    // 2. 환불액 (해당 기간 내 완료된 환불)
    const { data: completedRefunds, error: refundsError } = await supabase
      .from('refunds')
      .select('amount')
      .eq('status', 'completed')
      .gte('processed_at', start)
      .lte('processed_at', endWithTime)

    if (refundsError) throw refundsError

    const totalRefunds = (completedRefunds || []).reduce((sum, r) => sum + r.amount, 0)

    // 3. 순 매출
    const netRevenue = grossRevenue - totalRefunds

    // 4. MRR (현재 활성 구독)
    const { data: activeSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('plan, amount, user_type')
      .eq('status', 'active')

    if (subsError) throw subsError

    const mrr = (activeSubscriptions || []).reduce((sum, s) => sum + s.amount, 0)

    // 5. 플랜별 구독자 수
    const planCounts = {
      PRO: (activeSubscriptions || []).filter(s => s.plan === 'PRO').length,
      EXPERT: (activeSubscriptions || []).filter(s => s.plan === 'EXPERT').length,
    }

    // 6. ARPU (Average Revenue Per User)
    const activeUsers = (activeSubscriptions || []).length
    const arpu = activeUsers > 0 ? Math.round(mrr / activeUsers) : 0

    return NextResponse.json({
      grossRevenue,
      netRevenue,
      totalRefunds,
      mrr,
      arpu,
      activeSubscriptions: activeUsers,
      planCounts,
      period: { start, end }
    })
  } catch (error: any) {
    console.error('Settlements summary error:', error)
    return NextResponse.json({ error: '정산 요약 조회 실패' }, { status: 500 })
  }
}
