import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id: couponId } = await params

    // ✅ 타입 명시: 쿠폰 확인
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, claimed_by, used_at, expires_at, credits, used, feature')
      .eq('id', couponId)
      .single<{
        id: string
        claimed_by: string | null
        used_at: string | null
        expires_at: string | null
        credits: number | null
        used: number | null
        feature: string | null
      }>()

    if (!coupon) {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인
    if (coupon.claimed_by !== session.user.email) {
      return NextResponse.json({ error: '본인의 쿠폰만 삭제할 수 있습니다.' }, { status: 403 })
    }

    // 🔒 삭제 권한 체크
    const userType = session.user.userType
    const isAdmin = userType === 'SUPER_ADMIN' || userType === 'MANAGER'
    const isUsedOrExpired = coupon.used_at || (coupon.expires_at && new Date(coupon.expires_at) < new Date())

    if (!isAdmin && !isUsedOrExpired) {
      return NextResponse.json({ error: '사용 가능한 쿠폰은 삭제할 수 없습니다. 사용 완료 후 삭제 가능합니다.' }, { status: 403 })
    }

    // 남은 크레딧 계산
    const remainingCredits = Math.max(0, (coupon.credits || 0) - (coupon.used || 0))

    // soft delete: deleted_at 설정
    const { error } = await supabase
      .from('coupons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', couponId)

    if (error) {
      console.error('[coupons/delete]', error)
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
    }

    // ✅ extra_credits에서 남은 크레딧 감소 (동기화)
    if (remainingCredits > 0 && coupon.feature && coupon.claimed_by) {
      const { data: user } = await supabase
        .from('users')
        .select('extra_credits')
        .eq('email', coupon.claimed_by)
        .single()

      if (user) {
        const extraCredits = user.extra_credits || {}
        const currentExtra = extraCredits[coupon.feature] || 0
        const newExtra = Math.max(0, currentExtra - remainingCredits)

        await supabase
          .from('users')
          .update({
            extra_credits: {
              ...extraCredits,
              [coupon.feature]: newExtra
            }
          })
          .eq('email', coupon.claimed_by)

        console.log(`[coupons/delete] extra_credits 감소: ${coupon.feature} -${remainingCredits}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[coupons/delete]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
