import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/consents/headhunter
 * 헤드헌터 추천 동의 저장
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userEmail = session.user.email
    const now = new Date()

    // 이미 동의한 기록이 있는지 확인
    const { data: existingConsent } = await supabase
      .from('consents')
      .select('id')
      .eq('user_email', userEmail)
      .eq('consent_type', 'headhunter_sharing')
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .single()

    if (existingConsent) {
      return NextResponse.json({
        message: '이미 동의하셨습니다.',
        alreadyConsented: true
      })
    }

    // 헤드헌터 추천 동의 저장
    const { error: consentError } = await supabase
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

    if (consentError) {
      console.error('[consents/headhunter] Consent insert error:', consentError)
      return NextResponse.json({
        error: '동의 저장 실패'
      }, { status: 500 })
    }

    // users 테이블 업데이트
    await supabase
      .from('users')
      .update({
        headhunter_sharing_enabled: true,
        headhunter_sharing_consented_at: now,
        headhunter_sharing_consent_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      })
      .eq('email', userEmail)

    // 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'headhunter_consent',
      actor_email: userEmail,
      target_email: userEmail,
      details: {
        consent_type: 'headhunter_sharing',
        agreed: true
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: '헤드헌터 추천 동의가 완료되었습니다.'
    })

  } catch (e) {
    console.error('[consents/headhunter] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

/**
 * DELETE /api/consents/headhunter
 * 헤드헌터 추천 동의 철회
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userEmail = session.user.email
    const now = new Date()

    // 동의 철회 처리
    await supabase
      .from('consents')
      .update({
        withdrawn_at: now
      })
      .eq('user_email', userEmail)
      .eq('consent_type', 'headhunter_sharing')
      .is('withdrawn_at', null)

    // users 테이블 업데이트
    await supabase
      .from('users')
      .update({
        headhunter_sharing_enabled: false
      })
      .eq('email', userEmail)

    // 감사 로그
    await supabase.from('audit_logs').insert({
      action: 'headhunter_consent_withdrawn',
      actor_email: userEmail,
      target_email: userEmail,
      details: {
        consent_type: 'headhunter_sharing',
        withdrawn: true
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: '헤드헌터 추천 동의가 철회되었습니다.'
    })

  } catch (e) {
    console.error('[consents/headhunter DELETE] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
