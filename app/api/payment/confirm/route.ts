import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const { orderId, paymentKey, amount } = await req.json()

    if (!orderId || !paymentKey || !amount) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
    }

    // 토스페이먼츠 결제 승인 요청
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
    }

    const encodedKey = Buffer.from(secretKey + ':').toString('base64')

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        paymentKey,
        amount: Number(amount),
      }),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error('토스 결제 승인 실패:', tossData)
      return NextResponse.json(
        { error: tossData.message || '결제 승인 실패' },
        { status: tossResponse.status }
      )
    }

    // 결제 성공 → Supabase에 사용자 플랜 업데이트
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후

    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: 'PRO',
        plan_started_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('플랜 업데이트 실패:', updateError)
      // 결제는 성공했지만 DB 업데이트 실패 → 로그 남기고 성공 처리
    }

    // 결제 내역 저장 (payments 테이블이 있다면)
    try {
      await supabase.from('payments').insert({
        user_email: session.user.email,
        order_id: orderId,
        payment_key: paymentKey,
        amount: Number(amount),
        status: 'DONE',
        method: tossData.method || 'UNKNOWN',
        approved_at: tossData.approvedAt,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('결제 내역 저장 실패 (테이블 없을 수 있음):', err)
      // 실패해도 계속 진행
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      plan: 'PRO',
    })
  } catch (error: any) {
    console.error('결제 승인 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
