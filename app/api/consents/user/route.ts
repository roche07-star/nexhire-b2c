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
      userType,
      privacyRequired,
      privacyOptional,
      address,
      headhunterSharing,
      headhunterResponsibility,
      phone
    } = await req.json()

    if (!userType || (userType !== 'JOBSEEKER' && userType !== 'HEADHUNTER')) {
      return NextResponse.json({
        error: '사용자 유형을 선택해주세요.'
      }, { status: 400 })
    }

    if (!privacyRequired) {
      return NextResponse.json({
        error: '필수 개인정보 수집·이용 동의가 필요합니다.'
      }, { status: 400 })
    }

    if (userType === 'HEADHUNTER' && !headhunterResponsibility) {
      return NextResponse.json({
        error: '후보자 개인정보 처리 책임 동의가 필요합니다.'
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
      return NextResponse.json({
        error: '필수 동의 저장 실패',
        details: requiredError.message,
        code: requiredError.code,
        hint: requiredError.hint
      }, { status: 500 })
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

    // 4. 헤드헌터 책임 동의 처리 (헤드헌터 전용, 필수)
    if (userType === 'HEADHUNTER' && headhunterResponsibility) {
      const { error: responsibilityError } = await supabase
        .from('consents')
        .insert({
          user_email: userEmail,
          consent_type: 'headhunter_responsibility',
          consent_version: 'v1.0.0',
          is_agreed: true,
          agreed_at: now,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })

      if (responsibilityError) {
        console.error('[consents/user] Headhunter responsibility consent insert error:', responsibilityError)
        return NextResponse.json({ error: '헤드헌터 책임 동의 저장 실패' }, { status: 500 })
      }
    }

    // 5. 헤드헌터 추천 서비스 동의 처리 (개인 구직자 전용, 선택)
    if (userType === 'JOBSEEKER' && headhunterSharing) {
      // consents 테이블에 저장
      const { error: headhunterError } = await supabase
        .from('consents')
        .insert({
          user_email: userEmail,
          consent_type: 'headhunter_sharing',
          consent_version: 'v1.0.0',
          is_agreed: true,
          agreed_at: now,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })

      if (headhunterError) {
        console.error('[consents/user] Headhunter sharing consent insert error:', headhunterError)
        // 선택 동의 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 6. users 테이블 업데이트
    const isHeadhunterSharing = userType === 'JOBSEEKER' && headhunterSharing

    await supabase
      .from('users')
      .update({
        user_type: userType,
        service_type: 'B2C',
        last_service_use_at: now,
        headhunter_sharing_enabled: isHeadhunterSharing,
        headhunter_sharing_consented_at: isHeadhunterSharing ? now : null,
        headhunter_sharing_consent_ip: isHeadhunterSharing
          ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'))
          : null,
        phone: phone || null,
        address: address || null
      })
      .eq('email', userEmail)

    // 7. Eve Super Admin에 기본 정보 전송 (개인 구직자 + headhunterSharing = true + phone 있는 경우)
    if (userType === 'JOBSEEKER' && headhunterSharing && phone) {
      try {
        console.log('[consents/user] Eve 전송 시작:', {
          name: session.user.name,
          email: session.user.email,
          phone
        })

        const eveResponse = await fetch(`${process.env.EVE_API_URL}/api/super-admin/candidates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.ADAM_TO_EVE_API_KEY || ''
          },
          body: JSON.stringify({
            name: session.user.name,
            email: session.user.email,
            phone,
            source: 'adam_signup',
            adam_user_email: session.user.email
          })
        })

        if (eveResponse.ok) {
          const { candidate_id } = await eveResponse.json()

          // eve_candidate_id 저장
          await supabase.from('users').update({
            eve_candidate_id: candidate_id
          }).eq('email', userEmail)

          console.log('[consents/user] Eve 전송 성공:', candidate_id)
        } else {
          const errorText = await eveResponse.text()
          console.error('[consents/user] Eve 전송 실패:', eveResponse.status, errorText)
        }
      } catch (err) {
        console.error('[consents/user] Eve 전송 실패 (non-fatal):', err)
        // Eve 전송 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 8. 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'user_consent',
      actor_email: userEmail,
      target_email: userEmail,
      details: {
        user_type: userType,
        privacy_required: true,
        privacy_optional: privacyOptional || false,
        has_address: !!address,
        headhunter_sharing: userType === 'JOBSEEKER' ? (headhunterSharing || false) : false,
        headhunter_responsibility: userType === 'HEADHUNTER' ? (headhunterResponsibility || false) : false
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
