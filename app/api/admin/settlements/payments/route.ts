import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

/**
 * 결제 내역 조회 (SUPER_ADMIN 전용)
 * GET /api/admin/settlements/payments?page=1&limit=50&plan=PRO&status=success&search=user@
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const plan = searchParams.get('plan') // 'PRO', 'EXPERT', 'ALL'
  const status = searchParams.get('status') // 'success', 'failed', 'refunded', 'pending', 'ALL'
  const search = searchParams.get('search') // 이메일 검색
  const start = searchParams.get('start') // 시작일 (YYYY-MM-DD)
  const end = searchParams.get('end') // 종료일 (YYYY-MM-DD)

  try {
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .order('paid_at', { ascending: false })

    // 필터 적용
    if (plan && plan !== 'ALL') {
      query = query.eq('plan', plan)
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.ilike('user_email', `%${search}%`)
    }
    if (start) {
      query = query.gte('paid_at', `${start}T00:00:00`)
    }
    if (end) {
      query = query.lte('paid_at', `${end}T23:59:59`)
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // 각 결제에 대한 쿠폰 사용 현황 조회
    const paymentsWithCouponStatus = await Promise.all(
      (data || []).map(async (payment) => {
        // STORE 결제만 쿠폰 조회
        if (payment.plan !== 'STORE' || !payment.paid_at) {
          return { ...payment, coupon_status: null }
        }

        // 결제 시간 전후 2분 이내에 발급된 쿠폰 찾기
        const paidAt = new Date(payment.paid_at)
        const couponSearchStart = new Date(paidAt.getTime() - 120000)
        const couponSearchEnd = new Date(paidAt.getTime() + 120000)

        const { data: coupons } = await supabase
          .from('coupons')
          .select('*')
          .eq('issued_to', payment.user_email)
          .eq('issued_by', 'STORE')
          .gte('claimed_at', couponSearchStart.toISOString())
          .lte('claimed_at', couponSearchEnd.toISOString())

        if (!coupons || coupons.length === 0) {
          return { ...payment, coupon_status: null }
        }

        // 쿠폰 사용 현황 계산
        const totalCredits = coupons.reduce((sum, c) => sum + c.credits, 0)
        const usedCredits = coupons.reduce((sum, c) => sum + (c.used || 0), 0)
        const hasUsed = usedCredits > 0

        return {
          ...payment,
          coupon_status: {
            total_credits: totalCredits,
            used_credits: usedCredits,
            has_used: hasUsed,
            coupons: coupons.map(c => ({
              id: c.id,
              feature: c.feature,
              credits: c.credits,
              used: c.used || 0,
              claimed_at: c.claimed_at,
            })),
          },
        }
      })
    )

    return NextResponse.json({
      payments: paymentsWithCouponStatus,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Payments fetch error:', error)
    return NextResponse.json({ error: '결제 내역 조회 실패' }, { status: 500 })
  }
}
