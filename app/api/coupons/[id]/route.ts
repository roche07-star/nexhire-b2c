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

    // 🔒 관리자만 쿠폰 삭제 가능
    const userType = session.user.userType
    if (userType !== 'SUPER_ADMIN' && userType !== 'MANAGER') {
      return NextResponse.json({ error: '쿠폰 삭제 권한이 없습니다. 관리자에게 문의하세요.' }, { status: 403 })
    }

    const { id: couponId } = await params

    // ✅ 타입 명시: 쿠폰 확인
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, claimed_by, used_at')
      .eq('id', couponId)
      .single<{ id: string; claimed_by: string | null; used_at: string | null }>()

    if (!coupon) {
      return NextResponse.json({ error: '쿠폰을 찾을 수 없습니다.' }, { status: 404 })
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
