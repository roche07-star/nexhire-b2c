import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // Step 6: orderId에서 feature 추출
    const featureMatch = orderId.match(/store_([a-z]+)_/)
    const feature = featureMatch ? featureMatch[1] : null

    if (!feature) {
      return NextResponse.json({ error: '잘못된 주문 정보' }, { status: 400 })
    }

    // Step 7: 사용자 정보 조회 (user_type 필요)
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'

    // Step 8: 쿠폰 생성
    const now = new Date()
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // 상품별 쿠폰 생성 개수
    const couponCounts: Record<string, { resume?: number; jd?: number; rewrite?: number; interview?: number; proposal?: number }> = {
      resume: { resume: 1 },
      jd: { jd: 1 },
      rewrite: { rewrite: 1 },
      interview: { interview: 1 },
      proposal: { proposal: 1 },
      storage: {},
      package: {
        resume: 50,
        jd: 50,
        rewrite: 50,
        interview: userType === 'HEADHUNTER' ? 25 : 15,
        proposal: userType === 'HEADHUNTER' ? 50 : 0,
      },
    }

    const counts = couponCounts[feature]
    if (counts === undefined) {
      return NextResponse.json({ error: '지원하지 않는 상품입니다' }, { status: 400 })
    }

    const coupons = []

    // 스토리지 쿠폰 생성
    if (feature === 'storage') {
      const { data: coupon, error: storageError } = await supabase
        .from('coupons')
        .insert({
          code: null,
          feature: 'storage',
          issued_to: session.user.email,
          claimed_by: session.user.email,
          claimed_at: now.toISOString(),
          expires_at: threeMonthsLater.toISOString(),
          credits: 1,
          used: 0,
          issued_by: 'STORE',
        })
        .select()
        .single()

      if (storageError) {
        console.error('스토리지 쿠폰 생성 오류:', storageError)
        return NextResponse.json({ error: '쿠폰 생성 실패' }, { status: 500 })
      }

      coupons.push(coupon)
    } else {
      // 일반 쿠폰 생성
      for (const [type, count] of Object.entries(counts)) {
        if (count > 0) {
          const { data: coupon, error } = await supabase
            .from('coupons')
            .insert({
              code: null,
              feature: type,
              issued_to: session.user.email,
              claimed_by: session.user.email,
              claimed_at: now.toISOString(),
              expires_at: threeMonthsLater.toISOString(),
              credits: count,
              used: 0,
              issued_by: 'STORE',
            })
            .select()
            .single()

          if (error) {
            console.error('쿠폰 생성 오류:', error)
            continue
          }

          coupons.push(coupon)
        }
      }
    }

    // Step 9: 주문 상태 업데이트
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
      // 쿠폰은 발급되었으므로 에러는 로그만 남기고 성공 반환
    }

    // Step 10: 결제 내역 저장
    try {
      await supabase.from('payments').insert({
        user_email: session.user.email,
        plan: 'STORE',
        amount: order.amount,
        currency: 'KRW',
        status: 'success',
        payment_method: 'CARD',
        payment_gateway: 'portone',
        transaction_id: paymentData.id,
        paid_at: paymentData.paidAt || now.toISOString(),
        description: order.product_name,
      })
    } catch (err) {
      console.error('결제 내역 저장 실패:', err)
      // 로그만 남기고 계속 진행
    }

    // 텔레그램 알림 전송
    try {
      await sendPaymentNotification({
        type: 'coupon',
        userEmail: session.user.email,
        productName: order.product_name,
        amount: order.amount,
        gateway: 'PortOne (REAL)',
      })
    } catch (err) {
      console.error('텔레그램 알림 전송 실패:', err)
      // 알림 실패해도 결제는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      orderId,
      coupons,
    })

  } catch (error: any) {
    console.error('Store payment verify error:', error)
    return NextResponse.json(
      { error: error.message || '결제 검증 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
