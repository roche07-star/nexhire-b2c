import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { toCoupon, toCouponWithStatus, type DatabaseCoupon } from '@/lib/types/coupon'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('claimed_by', session.user.email)
      .is('deleted_at', null)
      .order('claimed_at', { ascending: false })

    // ✅ 타입 검증 및 변환
    const rawCoupons = (data ?? []) as DatabaseCoupon[]
    const coupons = rawCoupons
      .map(toCoupon)
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map(toCouponWithStatus)

    return NextResponse.json({ coupons })
  } catch (e) {
    console.error('[coupons/mine]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
