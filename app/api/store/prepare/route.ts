import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // Manager/Super Admin 체크
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (userData?.user_type === 'SUPER_ADMIN' || userData?.user_type === 'MANAGER') {
      return NextResponse.json({ error: '관리자 계정은 결제할 수 없습니다' }, { status: 403 })
    }

    const { productId, productName, feature, amount } = await req.json()

    if (!productId || !productName || !feature || !amount) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
    }

    // 주문 ID 생성 (store_feature_timestamp_random)
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const orderId = `store_${feature}_${timestamp}_${randomStr}`

    // PortOne paymentId
    const paymentId = `payment_store_${timestamp}_${randomStr}`

    // orders 테이블에 주문 정보 저장
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_email: session.user.email,
        product_id: productId,
        product_name: productName,
        amount: amount,
        status: 'pending',
        payment_id: paymentId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
    }

    return NextResponse.json({
      orderId,
      paymentId,
      amount,
      productName,
    })

  } catch (error: any) {
    console.error('Store payment prepare error:', error)
    return NextResponse.json(
      { error: error.message || '결제 준비 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
