import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * STORE 상품 결제 확인 및 쿠폰 발급
 * POST /api/store/confirm
 */
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

    // orderId에서 feature 추출 (store_feature_timestamp_random 형식)
    const featureMatch = orderId.match(/store_([a-z]+)_/)
    const feature = featureMatch ? featureMatch[1] : null

    if (!feature) {
      return NextResponse.json({ error: '잘못된 주문 정보' }, { status: 400 })
    }

    // 상품명 매핑
    const productNames: Record<string, string> = {
      resume: '이력서 분석',
      jd: 'JD 적합도 분석',
      rewrite: '이력서 생성',
      interview: '면접 가이드',
      proposal: '클라이언트 제안서',
      storage: '스토리지 슬롯',
      package: '올인원 패키지',
    }

    const productName = productNames[feature] || feature

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

    console.log('토스 결제 승인 응답:', JSON.stringify(tossData, null, 2))

    if (!tossResponse.ok) {
      console.error('토스 결제 승인 실패:', tossData)
      return NextResponse.json(
        { error: tossData.message || '결제 승인 실패' },
        { status: tossResponse.status }
      )
    }

    // 사용자 정보 조회 (user_type 필요)
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'

    // 결제 내역 저장 (STORE 상품 구매)
    const paymentData = {
      user_email: session.user.email,
      plan: 'STORE',
      amount: Number(amount),
      currency: 'KRW',
      status: 'success',
      payment_method: tossData.method || 'CARD',
      payment_gateway: 'tosspayments',
      transaction_id: paymentKey,
      paid_at: tossData.approvedAt || new Date().toISOString(),
      description: productName,
    }

    console.log('저장할 결제 데이터:', paymentData)

    try {
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (paymentError) {
        console.error('결제 내역 저장 오류:', paymentError)
      } else {
        console.log('결제 내역 저장 성공:', paymentRecord)
      }
    } catch (err) {
      console.error('결제 내역 저장 실패:', err)
    }

    // 상품별 쿠폰 생성 개수
    const couponCounts: Record<string, { resume?: number; jd?: number; rewrite?: number; interview?: number; proposal?: number }> = {
      resume: { resume: 1 },
      jd: { jd: 1 },
      rewrite: { rewrite: 1 },
      interview: { interview: 1 },
      proposal: { proposal: 1 },
      storage: {}, // 스토리지는 별도 처리 필요
      package: {
        resume: 50,
        jd: 50,
        rewrite: 50,
        interview: userType === 'HEADHUNTER' ? 25 : 15,
        proposal: userType === 'HEADHUNTER' ? 50 : 0,
      },
    }

    const counts = couponCounts[feature]
    if (!counts) {
      return NextResponse.json({ error: '지원하지 않는 상품입니다' }, { status: 400 })
    }

    // 스토리지는 별도 처리
    if (feature === 'storage') {
      // TODO: 스토리지 슬롯 추가 로직 구현
      return NextResponse.json({
        success: true,
        message: '스토리지 슬롯이 추가되었습니다',
      })
    }

    // 쿠폰 생성 (확장된 스키마 사용)
    const now = new Date().toISOString()
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const coupons = []
    for (const [type, count] of Object.entries(counts)) {
      if (count > 0) {
        const { data: coupon, error } = await supabase
          .from('coupons')
          .insert({
            code: null, // STORE 구매는 코드 불필요
            feature: type,
            issued_to: session.user.email,
            claimed_by: session.user.email,
            claimed_at: now,
            expires_at: threeMonthsLater,
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

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      coupons,
    })
  } catch (error: any) {
    console.error('결제 승인 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
