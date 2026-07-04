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

    // 쿠폰 소유 확인
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, claimed_by, used_at')
      .eq('id', couponId)
      .single()

    if (!coupon) {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (coupon.claimed_by !== session.user.email) {
      return NextResponse.json({ error: '본인의 쿠폰만 삭제할 수 있습니다.' }, { status: 403 })
    }

    // soft delete: deleted_at 설정
    const { error } = await supabase
      .from('coupons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', couponId)

    if (error) {
      console.error('[coupons/delete]', error)
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[coupons/delete]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
