import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

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

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()

    if (error) throw error
    if (!coupon) {
      return NextResponse.json({ error: '유효하지 않은 쿠폰 코드입니다.' }, { status: 404 })
    }
    if (coupon.claimed_by) {
      return NextResponse.json({ error: '이미 등록된 쿠폰입니다.' }, { status: 409 })
    }
    if (coupon.issued_to && coupon.issued_to !== email) {
      return NextResponse.json({ error: '이 쿠폰은 다른 계정에 발급된 쿠폰입니다.' }, { status: 403 })
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 쿠폰입니다.' }, { status: 410 })
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
