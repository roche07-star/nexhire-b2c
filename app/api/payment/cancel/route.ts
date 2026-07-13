import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 결제 취소 처리
 * POST /api/payment/cancel
 *
 * 토스페이먼츠 취소 Webhook 또는 수동 취소 처리
 */
export async function POST(req: NextRequest) {
  try {
    const { transaction_id, reason } = await req.json()

    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id 필요' }, { status: 400 })
    }

    console.log('[Payment Cancel] Transaction ID:', transaction_id)
    console.log('[Payment Cancel] Reason:', reason)

    // 1. 결제 내역 조회
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single()

    if (fetchError || !payment) {
      console.error('[Payment Cancel] Payment not found:', fetchError)
      return NextResponse.json({ error: '결제 내역을 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 취소된 결제
    if (payment.status === 'cancelled') {
      console.log('[Payment Cancel] Already cancelled')
      return NextResponse.json({ message: '이미 취소된 결제입니다' })
    }

    // 2. Payments 테이블 상태 업데이트
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || '사용자 취소',
      })
      .eq('transaction_id', transaction_id)

    if (updateError) {
      console.error('[Payment Cancel] Update failed:', updateError)
      return NextResponse.json({ error: 'DB 업데이트 실패' }, { status: 500 })
    }

    // 3. 플랜 결제인 경우: 플랜 다운그레이드 (선택사항)
    if (payment.plan && payment.plan !== 'STORE') {
      console.log('[Payment Cancel] Plan payment - consider downgrading:', payment.user_email)
      // TODO: 플랜 다운그레이드 로직 (자동 또는 수동 결정 필요)
    }

    // 4. 쿠폰 결제인 경우: 쿠폰 비활성화
    if (payment.plan === 'STORE') {
      // 해당 결제로 발급된 쿠폰 찾기 (created_at 기준)
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('claimed_by', payment.user_email)
        .gte('created_at', payment.created_at)
        .lte('created_at', new Date(new Date(payment.created_at).getTime() + 60000).toISOString()) // 결제 후 1분 이내 발급

      if (coupons && coupons.length > 0) {
        // 사용하지 않은 쿠폰만 삭제
        for (const coupon of coupons) {
          if (coupon.used === 0) {
            await supabase
              .from('coupons')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', coupon.id)
          }
        }
        console.log('[Payment Cancel] Coupons deactivated:', coupons.length)
      }
    }

    console.log('[Payment Cancel] Success:', transaction_id)

    return NextResponse.json({
      success: true,
      message: '결제 취소 처리 완료',
      transaction_id,
    })

  } catch (error: any) {
    console.error('[Payment Cancel] Error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
