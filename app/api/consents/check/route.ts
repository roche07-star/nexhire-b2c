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

    console.log('[consents/check] Checking for:', userEmail)

    // user_type 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', userEmail)
      .single()

    const hasUserType = !userError && !!user?.user_type

    console.log('[consents/check] User type:', user?.user_type, 'Has user type:', hasUserType)

    // 필수 개인정보 동의 확인
    const { data: requiredConsent, error: requiredError } = await supabase
      .from('consents')
      .select('id, agreed_at')
      .eq('user_email', userEmail)
      .eq('consent_type', 'privacy_required')
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .maybeSingle()

    console.log('[consents/check] Required consent:', requiredConsent, 'Error:', requiredError)

    // 선택 개인정보 동의 확인
    const { data: optionalConsent, error: optionalError } = await supabase
      .from('consents')
      .select('id, agreed_at')
      .eq('user_email', userEmail)
      .eq('consent_type', 'privacy_optional')
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .maybeSingle()

    console.log('[consents/check] Optional consent:', optionalConsent, 'Error:', optionalError)

    // 에러가 발생한 경우에도 명확히 처리
    if (requiredError) {
      console.error('[consents/check] Required consent query error:', requiredError)
    }

    const hasConsent = !!requiredConsent && !requiredError

    console.log('[consents/check] Final result:', { hasConsent, hasUserType })

    return NextResponse.json({
      hasConsent,
      hasUserType,
      requiredConsent: requiredConsent ? {
        id: requiredConsent.id,
        agreedAt: requiredConsent.agreed_at
      } : null,
      optionalConsent: optionalConsent && !optionalError ? {
        id: optionalConsent.id,
        agreedAt: optionalConsent.agreed_at
      } : null
    })

  } catch (e) {
    console.error('[consents/check] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
