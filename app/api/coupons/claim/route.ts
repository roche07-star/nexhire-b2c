import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { toCoupon, canClaimCoupon, type DatabaseCoupon } from '@/lib/types/coupon'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const email = session.user.email

    const { code } = await req.json()
    if (!code?.trim()) {
      return NextResponse.json({ error: '쿠폰 코드를 입력해 주세요.' }, { status: 400 })
    }

    const { data: rawCoupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle<DatabaseCoupon>()

    if (error) throw error
    if (!rawCoupon) {
      return NextResponse.json({ error: '유효하지 않은 쿠폰 코드입니다.' }, { status: 404 })
    }

    // ✅ 타입 검증 및 변환
    const coupon = toCoupon(rawCoupon)
    if (!coupon) {
      return NextResponse.json({ error: '잘못된 쿠폰 데이터입니다.' }, { status: 500 })
    }

    // ✅ 등록 가능 여부 검증 (타입 안전)
    const validation = canClaimCoupon(coupon, email)
    if (!validation.ok) {
      const statusMap: Record<string, number> = {
        '이미 등록된 쿠폰입니다.': 409,
        '이 쿠폰은 다른 계정에 발급된 쿠폰입니다.': 403,
        '만료된 쿠폰입니다.': 410,
        '유효하지 않은 쿠폰입니다.': 404,
      }
      const status = statusMap[validation.error!] ?? 400
      return NextResponse.json({ error: validation.error }, { status })
    }

    const { error: updateError } = await supabase
      .from('coupons')
      .update({ claimed_by: email, claimed_at: new Date().toISOString() })
      .eq('id', coupon.id)
      .is('claimed_by', null)

    if (updateError) throw updateError

    return NextResponse.json({
      ok: true,
      feature: coupon.feature,
      code: coupon.code,
    })
  } catch (e) {
    console.error('[coupons/claim]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
