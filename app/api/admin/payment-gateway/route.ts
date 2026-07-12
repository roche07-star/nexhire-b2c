import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { setPaymentGatewayMode, getPaymentMode, type PaymentMode } from '@/lib/payment-gateway'

/**
 * GET /api/admin/payment-gateway
 * 현재 결제 게이트웨이 모드 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // SUPER_ADMIN 체크
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (user?.user_type !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const mode = await getPaymentMode()

    return NextResponse.json({
      mode,
      gateway: mode === 'REAL' ? 'PortOne' : '토스페이먼츠',
    })
  } catch (error) {
    console.error('[payment-gateway] GET error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * POST /api/admin/payment-gateway
 * 결제 게이트웨이 모드 변경
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // SUPER_ADMIN 체크
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (user?.user_type !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { mode } = await req.json()

    if (!mode || (mode !== 'TEST' && mode !== 'REAL')) {
      return NextResponse.json(
        { error: '유효하지 않은 모드입니다. TEST 또는 REAL만 가능합니다.' },
        { status: 400 }
      )
    }

    const result = await setPaymentGatewayMode(mode as PaymentMode, session.user.email)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '모드 변경 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mode,
      gateway: mode === 'REAL' ? 'PortOne' : '토스페이먼츠',
      message: `결제 게이트웨이가 ${mode === 'REAL' ? 'PortOne (실결제)' : '토스페이먼츠 (테스트)'}로 변경되었습니다.`,
    })
  } catch (error) {
    console.error('[payment-gateway] POST error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
