import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

/**
 * 환불 처리 (SUPER_ADMIN 전용)
 * POST /api/admin/settlements/refund
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { paymentId, amount, reason } = body

    if (!paymentId || !amount || !reason) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
    }

    // 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 환불된 결제인지 확인
    if (payment.status === 'refunded') {
      return NextResponse.json({ error: '이미 환불된 결제입니다' }, { status: 400 })
    }

    // 환불 금액이 결제 금액보다 큰지 확인
    if (amount > payment.amount) {
      return NextResponse.json({ error: '환불 금액이 결제 금액보다 큽니다' }, { status: 400 })
    }

    // 환불 내역 생성
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        user_email: payment.user_email,
        amount,
        reason,
        status: 'approved', // Super Admin이 직접 처리하므로 바로 승인
        requested_by: session.user.email,
        processed_by: session.user.email,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (refundError) throw refundError

    // 결제 상태 업데이트
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    if (updateError) throw updateError

    // 쿠폰 무효화 (환불된 결제로 발급된 쿠폰 삭제)
    // STORE 결제는 paid_at 시간 기준으로 쿠폰을 찾아서 삭제
    if (payment.plan === 'STORE' && payment.paid_at) {
      // payment description → feature 매핑
      const descriptionToFeature: Record<string, string> = {
        '이력서 분석': 'analyze',
        'JD 적합도 분석': 'jd',
        '이력서 생성': 'rewrite',
        '면접 가이드': 'interview',
        '클라이언트 제안서': 'proposal',
        '📁 추가 저장 Slot': 'storage',
        '🎁 올인원 패키지': 'package',
      }

      const feature = descriptionToFeature[payment.description || '']

      if (feature) {
        // 결제 시간 전후 2분 이내에 발급된 쿠폰 찾기 (동시 구매 고려)
        const paidAt = new Date(payment.paid_at)
        const couponDeleteStart = new Date(paidAt.getTime() - 120000) // 2분 전
        const couponDeleteEnd = new Date(paidAt.getTime() + 120000)   // 2분 후

        if (feature === 'package') {
          // 패키지 상품: 여러 feature의 쿠폰 삭제
          const packageFeatures = ['analyze', 'jd', 'rewrite', 'interview', 'proposal']

          for (const pkgFeature of packageFeatures) {
            const { error: couponDeleteError } = await supabase
              .from('coupons')
              .delete()
              .eq('issued_to', payment.user_email)
              .eq('issued_by', 'STORE')
              .eq('feature', pkgFeature)
              .gte('claimed_at', couponDeleteStart.toISOString())
              .lte('claimed_at', couponDeleteEnd.toISOString())

            if (couponDeleteError) {
              console.error(`패키지 쿠폰 삭제 오류 (${pkgFeature}):`, couponDeleteError)
            }
          }
        } else {
          // 단일 상품: 해당 feature 쿠폰만 삭제
          const { error: couponDeleteError } = await supabase
            .from('coupons')
            .delete()
            .eq('issued_to', payment.user_email)
            .eq('issued_by', 'STORE')
            .eq('feature', feature)
            .gte('claimed_at', couponDeleteStart.toISOString())
            .lte('claimed_at', couponDeleteEnd.toISOString())

          if (couponDeleteError) {
            console.error('쿠폰 삭제 오류:', couponDeleteError)
          }
        }
      }
    }

    // 실제 PG사 환불 API 호출은 여기에 추가
    // TODO: 토스페이먼츠/포트원 환불 API 연동

    return NextResponse.json({
      success: true,
      refund,
      message: '환불이 완료되었습니다',
    })
  } catch (error: any) {
    console.error('Refund processing error:', error)
    return NextResponse.json({ error: '환불 처리 실패' }, { status: 500 })
  }
}

/**
 * 환불 내역 조회 (SUPER_ADMIN 전용)
 * GET /api/admin/settlements/refund?page=1&limit=20
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const start = searchParams.get('start') // 시작일 (YYYY-MM-DD)
  const end = searchParams.get('end') // 종료일 (YYYY-MM-DD)

  try {
    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1

    // refunds와 payments 테이블 JOIN
    let query = supabase
      .from('refunds')
      .select(`
        *,
        payment:payments(plan, description)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 날짜 필터 적용
    if (start) {
      query = query.gte('created_at', `${start}T00:00:00`)
    }
    if (end) {
      query = query.lte('created_at', `${end}T23:59:59`)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    // payment 정보를 refund 객체에 병합
    const refundsWithPayment = (data || []).map((refund: any) => ({
      ...refund,
      plan: refund.payment?.plan || null,
      description: refund.payment?.description || null,
    }))

    return NextResponse.json({
      refunds: refundsWithPayment,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error('Refunds fetch error:', error)
    return NextResponse.json({ error: '환불 내역 조회 실패' }, { status: 500 })
  }
}
