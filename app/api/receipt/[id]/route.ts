import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 영수증 조회 (토스페이먼츠 영수증으로 리다이렉트)
 * GET /api/receipt/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const { id: paymentId } = await params

    // 결제 정보 조회
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_email', session.user.email) // 본인 결제만 조회 가능
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: '결제 내역을 찾을 수 없습니다' }, { status: 404 })
    }

    if (!payment.transaction_id) {
      return NextResponse.json({ error: '영수증 정보가 없습니다' }, { status: 400 })
    }

    // 결제 게이트웨이에 따라 다른 처리
    const gateway = payment.payment_gateway || 'toss'

    // PortOne (REAL 모드) 결제는 영수증 미지원
    if (gateway === 'portone') {
      return NextResponse.json(
        { error: 'PortOne 결제는 영수증 기능을 지원하지 않습니다' },
        { status: 400 }
      )
    }

    // 토스페이먼츠 API로 영수증 URL 조회
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
    }

    const encodedKey = Buffer.from(secretKey + ':').toString('base64')

    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${payment.transaction_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!tossResponse.ok) {
      const errorText = await tossResponse.text()
      console.error('토스 영수증 조회 실패:', errorText)

      // TEST 모드 결제는 영수증이 없을 수 있음
      return NextResponse.json(
        {
          error: 'TEST 모드 결제는 영수증이 제공되지 않습니다',
          detail: '실제 결제 시에만 영수증 발급이 가능합니다'
        },
        { status: 400 }
      )
    }

    const tossData = await tossResponse.json()

    console.log('[Receipt] Toss data:', tossData)

    // 영수증 URL이 있으면 리다이렉트
    if (tossData.receipt?.url) {
      return NextResponse.redirect(tossData.receipt.url)
    }

    // 영수증 URL이 없으면 에러
    return NextResponse.json(
      {
        error: 'TEST 모드 결제는 영수증이 제공되지 않습니다',
        detail: '실제 결제 시에만 영수증 발급이 가능합니다'
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('영수증 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
