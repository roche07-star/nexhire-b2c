import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getProductById, type ProductId } from '@/lib/products'

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

    const { productId, amount } = await req.json()

    if (!productId || !amount) {
      return NextResponse.json({ error: '상품 ID와 금액이 필요합니다' }, { status: 400 })
    }

    // 상품 정보 확인
    const product = getProductById(productId as ProductId)
    if (!product) {
      return NextResponse.json({ error: '존재하지 않는 상품입니다' }, { status: 404 })
    }

    // 금액 검증
    if (product.price !== amount) {
      return NextResponse.json({ error: '금액이 일치하지 않습니다' }, { status: 400 })
    }

    // 주문 ID 생성 (영문, 숫자, -, _ 만 허용)
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const orderId = `order_${productId}_${timestamp}_${randomStr}`

    // PortOne paymentId (고유 결제 ID)
    const paymentId = `payment_${timestamp}_${randomStr}`

    // orders 테이블에 주문 정보 저장
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_email: session.user.email,
        product_id: productId,
        product_name: product.name,
        amount: product.price,
        status: 'pending', // pending, paid, failed, cancelled
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
      amount: product.price,
      productName: product.name,
    })

  } catch (error: any) {
    console.error('Payment prepare error:', error)
    return NextResponse.json(
      { error: error.message || '결제 준비 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
