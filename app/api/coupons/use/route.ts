import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { couponId } = await req.json()

    if (!couponId) {
      return NextResponse.json({ error: '쿠폰 ID가 필요합니다.' }, { status: 400 })
    }

    // 쿠폰 조회
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .eq('claimed_by', session.user.email)
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 사용 완료된 쿠폰인지 확인
    if (coupon.used_at) {
      return NextResponse.json({ error: '이미 사용된 쿠폰입니다.' }, { status: 400 })
    }

    // 만료 확인
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 쿠폰입니다.' }, { status: 400 })
    }

    // 쿠폰 사용 처리
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ used_at: new Date().toISOString() })
      .eq('id', couponId)

    if (updateError) {
      console.error('[coupons/use] 사용 처리 실패:', updateError)
      return NextResponse.json({ error: '쿠폰 사용 처리에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '쿠폰이 사용되었습니다.' })

  } catch (error) {
    console.error('[coupons/use]', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
