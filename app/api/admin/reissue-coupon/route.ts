import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth-helpers'
import { sendPaymentNotification } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 체크 (SUPER_ADMIN만)
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId가 필요합니다' }, { status: 400 })
    }

    // Step 1: 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[Reissue Coupon] Order not found:', orderError)
      return NextResponse.json({ error: '주문 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // Step 2: 결제 완료 확인
    if (order.status !== 'paid') {
      return NextResponse.json({
        error: `결제가 완료되지 않은 주문입니다 (현재 상태: ${order.status})`
      }, { status: 400 })
    }

    // Step 3: orderId에서 feature 추출
    const featureMatch = orderId.match(/store_([a-z_]+)_/)
    const feature = featureMatch ? featureMatch[1] : null

    if (!feature) {
      return NextResponse.json({ error: '잘못된 주문 ID 형식입니다' }, { status: 400 })
    }

    // Step 4: 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', order.user_email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'

    // Step 5: 이미 발급된 쿠폰 확인
    const { data: existingCoupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('claimed_by', order.user_email)
      .eq('issued_by', 'STORE')
      .gte('claimed_at', order.paid_at || order.created_at)
      .lte('claimed_at', new Date(Date.parse(order.paid_at || order.created_at) + 60 * 60 * 1000).toISOString()) // 결제 후 1시간 이내

    console.log('[Reissue Coupon] 기존 쿠폰 확인:', {
      orderId,
      userEmail: order.user_email,
      feature,
      existingCount: existingCoupons?.length || 0,
    })

    if (existingCoupons && existingCoupons.length > 0) {
      return NextResponse.json({
        error: '이미 발급된 쿠폰이 있습니다',
        existingCoupons: existingCoupons.map(c => ({
          id: c.id,
          feature: c.feature,
          credits: c.credits,
          used: c.used,
          claimed_at: c.claimed_at,
          expires_at: c.expires_at,
        })),
      }, { status: 400 })
    }

    // Step 6: 쿠폰 생성
    const now = new Date()
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // 상품별 쿠폰 생성 개수
    const couponCounts: Record<string, { analyze?: number; jd?: number; jd_analysis?: number; jd_match?: number; rewrite?: number; interview?: number; proposal?: number }> = {
      analyze: { analyze: 1 },
      jd: { jd: 1 },
      jd_analysis: { jd_analysis: 1 },
      jd_match: { jd_match: 1 },
      rewrite: { rewrite: 1 },
      interview: { interview: 1 },
      proposal: { proposal: 1 },
      storage: {},
      package: {
        analyze: 50,
        jd: 50,
        rewrite: userType === 'HEADHUNTER' ? 25 : 30,
        interview: userType === 'HEADHUNTER' ? 25 : 20,
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
          issued_to: order.user_email,
          claimed_by: order.user_email,
          claimed_at: now.toISOString(),
          expires_at: threeMonthsLater.toISOString(),
          credits: 1,
          used: 0,
          issued_by: 'STORE',
        })
        .select()
        .single()

      if (storageError) {
        console.error('[Reissue Coupon] 스토리지 쿠폰 생성 오류:', storageError)
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
              issued_to: order.user_email,
              claimed_by: order.user_email,
              claimed_at: now.toISOString(),
              expires_at: threeMonthsLater.toISOString(),
              credits: count,
              used: 0,
              issued_by: 'STORE',
            })
            .select()
            .single()

          if (error) {
            console.error(`[Reissue Coupon] ${type} 쿠폰 생성 실패:`, error)
            return NextResponse.json({
              error: `쿠폰 생성 실패 (${type}): ${error.message}`,
            }, { status: 500 })
          }

          coupons.push(coupon)
        }
      }
    }

    if (coupons.length === 0) {
      console.error('[Reissue Coupon] 쿠폰이 하나도 생성되지 않음!', { feature, counts })
      return NextResponse.json({
        error: '쿠폰 발급에 실패했습니다',
      }, { status: 500 })
    }

    // Step 7: 텔레그램 알림 전송
    try {
      await sendPaymentNotification({
        type: 'coupon',
        userEmail: order.user_email,
        productName: `${order.product_name} (재발급)`,
        amount: order.amount,
        gateway: '관리자 재발급',
      })
    } catch (err) {
      console.error('[Reissue Coupon] 텔레그램 알림 전송 실패:', err)
    }

    console.log('[Reissue Coupon] 쿠폰 재발급 성공:', {
      orderId,
      userEmail: order.user_email,
      couponCount: coupons.length,
      adminEmail: session.user.email,
    })

    return NextResponse.json({
      success: true,
      orderId,
      userEmail: order.user_email,
      productName: order.product_name,
      coupons: coupons.map(c => ({
        id: c.id,
        feature: c.feature,
        credits: c.credits,
        expires_at: c.expires_at,
      })),
    })

  } catch (error: any) {
    console.error('[Reissue Coupon] Error:', error)
    return NextResponse.json(
      { error: error.message || '쿠폰 재발급 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
