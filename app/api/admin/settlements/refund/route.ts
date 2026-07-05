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

  try {
    let query = supabase
      .from('refunds')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      refunds: data || [],
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
