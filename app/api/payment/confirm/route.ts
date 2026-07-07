import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      console.error('[결제 확인] 인증 실패')
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const { orderId, paymentKey, amount } = await req.json()
    console.log('[결제 확인] 요청 파라미터:', { orderId, paymentKey, amount, email: session.user.email })

    if (!orderId || !paymentKey || !amount) {
      console.error('[결제 확인] 필수 파라미터 누락:', { orderId, paymentKey, amount })
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
    console.log('[결제 확인] 토스 응답:', { ok: tossResponse.ok, status: tossResponse.status, data: tossData })

    if (!tossResponse.ok) {
      console.error('[결제 확인] 토스 결제 승인 실패:', tossData)
      return NextResponse.json(
        { error: tossData.message || '결제 승인 실패' },
        { status: tossResponse.status }
      )
    }

    // orderId에서 플랜 정보 추출 (order_PRO_timestamp_random 형식)
    const planMatch = orderId.match(/order_([A-Z]+)_/)
    const plan = planMatch ? planMatch[1] : 'PRO' // 기본값 PRO
    console.log('[결제 확인] 플랜 추출:', { orderId, planMatch, plan })

    // 사용자 정보 조회 (user_type 필요)
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'

    // 결제 성공 → Supabase에 사용자 플랜 업데이트
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후

    // 1. 플랜 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan,
        plan_started_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('플랜 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '결제는 완료되었으나 플랜 업데이트에 실패했습니다. 고객센터로 문의해주세요.' },
        { status: 500 }
      )
    }

    // 2. 업데이트 확인
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('plan, plan_started_at, plan_expires_at')
      .eq('email', session.user.email)
      .single()

    if (fetchError || !updatedUser || updatedUser.plan !== plan) {
      console.error('플랜 업데이트 검증 실패:', { fetchError, updatedUser, expectedPlan: plan })
      return NextResponse.json(
        { error: '플랜 업데이트 검증 실패. 고객센터로 문의해주세요.' },
        { status: 500 }
      )
    }

    console.log('플랜 업데이트 성공 및 검증 완료:', updatedUser)

    // 1. subscriptions 테이블에 구독 생성
    let subscriptionId: string | null = null
    try {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_email: session.user.email,
          plan,
          user_type: userType,
          status: 'active',
          amount: Number(amount),
          currency: 'KRW',
          billing_cycle: 'monthly',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select('id')
        .single()

      if (subError) {
        console.error('구독 생성 실패:', subError)
      } else {
        subscriptionId = subscription?.id
      }
    } catch (err) {
      console.error('구독 생성 오류:', err)
    }

    // 2. payments 테이블에 결제 내역 저장 (정산 시스템 스키마)
    try {
      await supabase.from('payments').insert({
        subscription_id: subscriptionId,
        user_email: session.user.email,
        plan,
        amount: Number(amount),
        currency: 'KRW',
        status: 'success',
        payment_method: tossData.method || 'card',
        payment_gateway: 'tosspayments',
        transaction_id: paymentKey,
        paid_at: tossData.approvedAt || now.toISOString(),
      })
    } catch (err) {
      console.error('결제 내역 저장 실패:', err)
      // 실패해도 계속 진행
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      plan,
    })
  } catch (error: any) {
    console.error('[결제 확인] 서버 오류:', {
      message: error.message,
      stack: error.stack,
      error
    })
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
