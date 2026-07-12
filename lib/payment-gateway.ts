import { supabase } from './supabase'

export type PaymentGateway = 'TOSS' | 'PORTONE'
export type PaymentMode = 'TEST' | 'REAL'

/**
 * 현재 결제 게이트웨이 모드 조회
 */
export async function getPaymentGatewayMode(): Promise<PaymentGateway> {
  const { data, error } = await supabase
    .from('payment_gateway_settings')
    .select('mode')
    .single()

  if (error) {
    console.error('[payment-gateway] Failed to get mode:', error)
    // 기본값: TEST 모드 (토스페이먼츠)
    return 'TOSS'
  }

  return data?.mode === 'REAL' ? 'PORTONE' : 'TOSS'
}

/**
 * 결제 게이트웨이 모드 변경 (SUPER_ADMIN 전용)
 */
export async function setPaymentGatewayMode(
  mode: PaymentMode,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('payment_gateway_settings')
    .update({
      mode,
      updated_by: adminEmail,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    console.error('[payment-gateway] Failed to set mode:', error)
    return { success: false, error: error.message }
  }

  // 감사 로그 기록
  await supabase.from('audit_logs').insert({
    action: 'payment_gateway_mode_change',
    actor_email: adminEmail,
    details: { mode, timestamp: new Date().toISOString() },
  })

  return { success: true }
}

/**
 * 결제 게이트웨이 모드 조회 (현재 모드 문자열)
 */
export async function getPaymentMode(): Promise<PaymentMode> {
  const { data } = await supabase
    .from('payment_gateway_settings')
    .select('mode')
    .single()

  return (data?.mode as PaymentMode) || 'TEST'
}
