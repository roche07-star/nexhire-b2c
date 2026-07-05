import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

/**
 * 월별 매출 차트 데이터 (SUPER_ADMIN 전용)
 * GET /api/admin/settlements/chart?start=2026-01-01&end=2026-12-31
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  const end = searchParams.get('end') || new Date().toISOString().split('T')[0]

  // 종료일에 시간 추가 (해당 날짜 23:59:59까지 포함)
  const endWithTime = end + 'T23:59:59.999Z'

  try {
    // 결제 데이터 조회 (성공한 결제만)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, paid_at, status')
      .eq('status', 'success')
      .gte('paid_at', start)
      .lte('paid_at', endWithTime)
      .order('paid_at', { ascending: true })

    if (paymentsError) throw paymentsError

    // 환불 데이터 조회 (완료된 환불만)
    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select('amount, processed_at, status')
      .eq('status', 'completed')
      .gte('processed_at', start)
      .lte('processed_at', endWithTime)
      .order('processed_at', { ascending: true })

    if (refundsError) throw refundsError

    // 월별로 그룹화
    const monthlyData: Record<string, { month: string; revenue: number; refunds: number; net: number }> = {}

    // 결제 데이터 집계
    payments?.forEach((payment) => {
      const month = payment.paid_at.substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, refunds: 0, net: 0 }
      }
      monthlyData[month].revenue += payment.amount
    })

    // 환불 데이터 집계
    refunds?.forEach((refund) => {
      const month = refund.processed_at.substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, refunds: 0, net: 0 }
      }
      monthlyData[month].refunds += refund.amount
    })

    // 순 매출 계산
    Object.values(monthlyData).forEach((data) => {
      data.net = data.revenue - data.refunds
    })

    // 정렬된 배열로 변환
    const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({ data: chartData })
  } catch (error: any) {
    console.error('Chart data fetch error:', error)
    return NextResponse.json({ error: '차트 데이터 조회 실패' }, { status: 500 })
  }
}
