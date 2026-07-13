import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getProductById } from '@/lib/products'
import { sendPaymentNotification } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { paymentId, orderId } = await req.json()

    if (!paymentId || !orderId) {
      return NextResponse.json({ error: 'paymentId와 orderId가 필요합니다' }, { status: 400 })
    }

    // Step 1: PortOne API로 결제 정보 조회
    const portoneApiSecret = process.env.PORTONE_API_SECRET
    if (!portoneApiSecret) {
      console.error('PORTONE_API_SECRET not configured')
      return NextResponse.json({ error: '결제 시스템 설정 오류' }, { status: 500 })
    }

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${paymentId}`,
      {
        headers: {
          Authorization: `PortOne ${portoneApiSecret}`,
        },
      }
    )

    if (!paymentResponse.ok) {
      console.error('PortOne API error:', await paymentResponse.text())
      return NextResponse.json({ error: '결제 정보 조회 실패' }, { status: 500 })
    }

    const paymentData = await paymentResponse.json()

    // Step 2: 결제 상태 확인
    if (paymentData.status !== 'PAID') {
      return NextResponse.json({ error: '결제가 완료되지 않았습니다' }, { status: 400 })
    }

    // Step 3: DB에서 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_email', session.user.email)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return NextResponse.json({ error: '주문 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // Step 4: 금액 검증
    if (paymentData.amount.total !== order.amount) {
      console.error('Amount mismatch:', { paid: paymentData.amount.total, expected: order.amount })
      return NextResponse.json({ error: '결제 금액이 일치하지 않습니다' }, { status: 400 })
    }

    // Step 5: 이미 처리된 결제인지 확인
    if (order.status === 'paid') {
      return NextResponse.json({ error: '이미 처리된 결제입니다' }, { status: 400 })
    }

    // Step 6: 상품 정보 조회
    const product = getProductById(order.product_id)
    if (!product) {
      return NextResponse.json({ error: '상품 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // Step 7: 사용자 플랜 업데이트
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + product.duration)

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        plan: product.plan,
        plan_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('email', session.user.email)
      .select()

    if (updateError) {
      console.error('User plan update error:', updateError)
      console.error('Update details:', {
        email: session.user.email,
        plan: product.plan,
        expiresAt: expiresAt.toISOString()
      })
      return NextResponse.json({
        error: '플랜 업데이트 실패',
        details: updateError.message
      }, { status: 500 })
    }

    if (!updateData || updateData.length === 0) {
      console.error('No user found with email:', session.user.email)
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    // Step 8: 주문 상태 업데이트
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: now.toISOString(),
        portone_transaction_id: paymentData.id,
        portone_response: paymentData,
      })
      .eq('id', orderId)

    if (orderUpdateError) {
      console.error('Order update error:', orderUpdateError)
      // 플랜은 업데이트되었으므로 에러는 로그만 남기고 성공 반환
    }

    // 텔레그램 알림 전송
    try {
      await sendPaymentNotification({
        type: 'plan',
        userEmail: session.user.email,
        productName: product.name,
        amount: product.price,
        gateway: 'PortOne (REAL)',
      })
    } catch (err) {
      console.error('텔레그램 알림 전송 실패:', err)
      // 알림 실패해도 결제는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      orderId,
      plan: product.plan,
      expiresAt: expiresAt.toISOString(),
    })

  } catch (error: any) {
    console.error('Payment verify error:', error)
    return NextResponse.json(
      { error: error.message || '결제 검증 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
