import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { sendPaymentNotification } from '@/lib/telegram'

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

    // ✅ 멱등성 체크: 같은 orderId로 이미 처리된 결제인지 확인
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('transaction_id, status, plan')
      .eq('user_email', session.user.email)
      .eq('transaction_id', paymentKey)
      .maybeSingle()

    if (existingPayment) {
      console.log('[결제 확인] 이미 처리된 결제:', existingPayment)
      return NextResponse.json({
        success: true,
        orderId,
        amount,
        plan: existingPayment.plan,
        duplicate: true, // 중복 요청
      })
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

    // 사용자 정보 조회 (user_type, 현재 플랜 확인)
    const { data: userData } = await supabase
      .from('users')
      .select('user_type, plan')
      .eq('email', session.user.email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'
    const currentPlan = userData?.plan || 'FREE'

    // 다운그레이드 차단
    const planHierarchy: Record<string, number> = { FREE: 0, PRO: 1, EXPERT: 2 }
    if (planHierarchy[currentPlan] > planHierarchy[plan]) {
      console.log('[결제 확인] 다운그레이드 차단:', { currentPlan, requestedPlan: plan })
      return NextResponse.json(
        { error: '다운그레이드는 설정 > 구독 관리에서 진행해주세요.' },
        { status: 400 }
      )
    }

    // 결제 성공 → Supabase에 사용자 플랜 업데이트
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후

    // ✅ 플랜 업데이트 with 재시도 로직 (보상 트랜잭션)
    let updateError = null
    let retryCount = 0
    const MAX_RETRY = 3

    while (retryCount < MAX_RETRY) {
      const { error } = await supabase
        .from('users')
        .update({ plan })
        .eq('email', session.user.email)

      if (!error) {
        console.log(`[결제 확인] 플랜 업데이트 성공 (시도 ${retryCount + 1}/${MAX_RETRY})`)
        updateError = null
        break
      }

      updateError = error
      retryCount++
      console.warn(`[결제 확인] 플랜 업데이트 실패 (시도 ${retryCount}/${MAX_RETRY}):`, error)

      if (retryCount < MAX_RETRY) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)))
      }
    }

    // ⚠️ 재시도 실패 시 보상 트랜잭션: 토스 결제 취소
    if (updateError) {
      console.error('[결제 확인] 플랜 업데이트 최종 실패. 토스 결제 취소 시도:', updateError)

      try {
        const cancelResponse = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${encodedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancelReason: 'DB 업데이트 실패로 인한 자동 취소',
          }),
        })

        const cancelData = await cancelResponse.json()

        if (cancelResponse.ok) {
          console.log('[결제 확인] 토스 결제 취소 성공:', cancelData)
          return NextResponse.json(
            {
              error: '플랜 업데이트에 실패하여 결제가 자동 취소되었습니다. 다시 시도해주세요.',
              cancelled: true,
            },
            { status: 500 }
          )
        } else {
          console.error('[결제 확인] 토스 결제 취소 실패:', cancelData)
          // 취소도 실패 → 수동 처리 필요
          return NextResponse.json(
            {
              error: '결제는 완료되었으나 플랜 업데이트에 실패했습니다. 고객센터(070-8095-5546)로 문의해주세요.',
              details: updateError.message,
              code: updateError.code,
              paymentKey, // 고객센터에서 수동 취소 위해 제공
            },
            { status: 500 }
          )
        }
      } catch (cancelError: any) {
        console.error('[결제 확인] 토스 결제 취소 요청 오류:', cancelError)
        return NextResponse.json(
          {
            error: '결제는 완료되었으나 플랜 업데이트에 실패했습니다. 고객센터(070-8095-5546)로 문의해주세요.',
            details: updateError.message,
            paymentKey,
          },
          { status: 500 }
        )
      }
    }

    // 2. 업데이트 확인
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('plan')
      .eq('email', session.user.email)
      .single()

    if (fetchError || !updatedUser || updatedUser.plan !== plan) {
      console.error('[결제 확인] 플랜 업데이트 검증 실패:', { fetchError, updatedUser, expectedPlan: plan })
      return NextResponse.json(
        {
          error: '플랜 업데이트 검증 실패. 고객센터로 문의해주세요.',
          details: fetchError?.message || `플랜 불일치: ${updatedUser?.plan} !== ${plan}`,
          updatedUser
        },
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
    const userTypeLabel = userType === 'HEADHUNTER' ? '헤드헌터' : '개인'
    const planNames: Record<string, string> = {
      PRO: `JOBIZIC PRO 플랜 (${userTypeLabel})`,
      EXPERT: `JOBIZIC EXPERT 플랜 (${userTypeLabel})`,
    }

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
        description: planNames[plan] || plan,
      })
    } catch (err) {
      console.error('결제 내역 저장 실패:', err)
      // 실패해도 계속 진행
    }

    // 텔레그램 알림 전송
    try {
      await sendPaymentNotification({
        type: 'plan',
        userEmail: session.user.email,
        productName: planNames[plan] || plan,
        amount: Number(amount),
        gateway: '토스페이먼츠 (TEST)',
      })
    } catch (err) {
      console.error('텔레그램 알림 전송 실패:', err)
      // 알림 실패해도 결제는 성공으로 처리
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
