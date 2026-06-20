import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

/**
 * POST /api/consents/user
 * 개인 사용자의 개인정보 수집·이용 동의 저장
 * Adam (B2C) 회원가입 시 사용
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const {
      privacyRequired,
      privacyOptional,
      address
    } = await req.json()

    if (!privacyRequired) {
      return NextResponse.json({
        error: '필수 개인정보 수집·이용 동의가 필요합니다.'
      }, { status: 400 })
    }

    const userEmail = session.user.email
    const now = new Date()

    // 1. 이미 동의한 기록이 있는지 확인
    const { data: existingConsent } = await supabase
      .from('consents')
      .select('id')
      .eq('user_email', userEmail)
      .eq('consent_type', 'privacy_required')
      .single()

    if (existingConsent) {
      return NextResponse.json({
        message: '이미 동의하셨습니다.',
        alreadyConsented: true
      })
    }

    // 2. 필수 동의 저장
    const { error: requiredError } = await supabase
      .from('consents')
      .insert({
        user_email: userEmail,
        consent_type: 'privacy_required',
        consent_version: 'v1.0.0',
        is_agreed: true,
        agreed_at: now,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })

    if (requiredError) {
      console.error('[consents/user] Required consent insert error:', requiredError)
      return NextResponse.json({ error: '필수 동의 저장 실패' }, { status: 500 })
    }

    // 3. 선택 동의 저장 (있는 경우)
    if (privacyOptional) {
      const { error: optionalError } = await supabase
        .from('consents')
        .insert({
          user_email: userEmail,
          consent_type: 'privacy_optional',
          consent_version: 'v1.0.0',
          is_agreed: true,
          agreed_at: now,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })

      if (optionalError) {
        console.error('[consents/user] Optional consent insert error:', optionalError)
        // 선택 동의 실패는 치명적이지 않으므로 계속 진행
      }

      // 주소 정보 업데이트
      if (address) {
        await supabase
          .from('users')
          .update({ address: address.trim() })
          .eq('email', userEmail)
      }
    }

    // 4. service_type 설정 (B2C)
    await supabase
      .from('users')
      .update({
        service_type: 'B2C',
        last_service_use_at: now
      })
      .eq('email', userEmail)

    // 5. 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'user_consent',
      actor_email: userEmail,
      target_email: userEmail,
      details: {
        privacy_required: true,
        privacy_optional: privacyOptional || false,
        has_address: !!address
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: '개인정보 수집·이용 동의가 완료되었습니다.'
    })

  } catch (e) {
    console.error('[consents/user] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
