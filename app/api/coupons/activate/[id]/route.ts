import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 쿠폰 활성화 (즉시 사용량 증가)
 * POST /api/coupons/activate/:id
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const couponId = params.id

    // 1. 쿠폰 조회
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .eq('claimed_by', session.user.email)
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다' }, { status: 404 })
    }

    // 2. 이미 사용된 쿠폰인지 확인
    if (coupon.used >= coupon.credits) {
      return NextResponse.json({ error: '이미 모두 사용된 쿠폰입니다' }, { status: 400 })
    }

    // 3. 만료 확인
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 쿠폰입니다' }, { status: 400 })
    }

    // 4. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('extra_credits')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    const extraCredits = user.extra_credits || {}
    const feature = coupon.feature
    const remainingCredits = coupon.credits - coupon.used

    // 5. extra_credits 업데이트
    const newExtraCredits = {
      ...extraCredits,
      [feature]: (extraCredits[feature] || 0) + remainingCredits
    }

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ extra_credits: newExtraCredits })
      .eq('email', session.user.email)

    if (updateUserError) {
      console.error('[Coupon Activate] Update user error:', updateUserError)
      return NextResponse.json({ error: 'extra_credits 업데이트 실패' }, { status: 500 })
    }

    // 6. 쿠폰 사용 완료 처리
    const { error: updateCouponError } = await supabase
      .from('coupons')
      .update({
        used: coupon.credits, // 모두 사용으로 처리
        used_at: new Date().toISOString()
      })
      .eq('id', couponId)

    if (updateCouponError) {
      console.error('[Coupon Activate] Update coupon error:', updateCouponError)
      return NextResponse.json({ error: '쿠폰 업데이트 실패' }, { status: 500 })
    }

    console.log('[Coupon Activate] Success:', {
      user: session.user.email,
      coupon: couponId,
      feature,
      credits: remainingCredits
    })

    return NextResponse.json({
      success: true,
      feature,
      credits: remainingCredits,
      message: `${feature} 사용 횟수 +${remainingCredits}`
    })

  } catch (error: any) {
    console.error('[Coupon Activate] Error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
