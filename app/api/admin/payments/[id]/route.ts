import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth-helpers'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 체크
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const paymentId = params.id

    // 결제 삭제
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (error) {
      console.error('[Delete Payment] Error:', error)
      return NextResponse.json({ error: '결제 내역 삭제 실패' }, { status: 500 })
    }

    console.log('[Delete Payment] Success:', { paymentId, adminEmail: session.user.email })

    return NextResponse.json({
      success: true,
      message: '결제 내역이 삭제되었습니다',
    })

  } catch (error: any) {
    console.error('[Delete Payment] Error:', error)
    return NextResponse.json(
      { error: error.message || '결제 내역 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
