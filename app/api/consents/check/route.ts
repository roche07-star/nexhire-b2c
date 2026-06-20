import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

/**
 * GET /api/consents/check
 * 현재 로그인한 사용자의 개인정보 동의 여부 확인
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userEmail = session.user.email

    // 필수 개인정보 동의 확인
    const { data: requiredConsent } = await supabase
      .from('consents')
      .select('id, agreed_at')
      .eq('user_email', userEmail)
      .eq('consent_type', 'privacy_required')
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .single()

    // 선택 개인정보 동의 확인
    const { data: optionalConsent } = await supabase
      .from('consents')
      .select('id, agreed_at')
      .eq('user_email', userEmail)
      .eq('consent_type', 'privacy_optional')
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .single()

    return NextResponse.json({
      hasConsent: !!requiredConsent,
      requiredConsent: requiredConsent ? {
        id: requiredConsent.id,
        agreedAt: requiredConsent.agreed_at
      } : null,
      optionalConsent: optionalConsent ? {
        id: optionalConsent.id,
        agreedAt: optionalConsent.agreed_at
      } : null
    })

  } catch (e) {
    console.error('[consents/check] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
