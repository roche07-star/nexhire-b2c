import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

/**
 * PUT /api/settings/headhunter-sharing
 * 헤드헌터 추천 서비스 ON/OFF 토글
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { enabled } = await req.json()

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled 값이 올바르지 않습니다.' }, { status: 400 })
    }

    const userEmail = session.user.email
    const now = new Date()

    // 1. users 테이블 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        headhunter_sharing_enabled: enabled,
        headhunter_sharing_consented_at: enabled ? now : null,
        headhunter_sharing_consent_ip: enabled
          ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'))
          : null
      })
      .eq('email', userEmail)

    if (updateError) {
      console.error('[settings/headhunter-sharing] Update error:', updateError)
      return NextResponse.json({ error: '설정 변경에 실패했습니다.' }, { status: 500 })
    }

    // 2. consents 테이블 처리
    if (enabled) {
      // 활성화 시: 동의 레코드 추가 (이미 있으면 무시)
      const { data: existing } = await supabase
        .from('consents')
        .select('id')
        .eq('user_email', userEmail)
        .eq('consent_type', 'headhunter_sharing')
        .single()

      if (!existing) {
        await supabase.from('consents').insert({
          user_email: userEmail,
          consent_type: 'headhunter_sharing',
          consent_version: 'v1.0.0',
          is_agreed: true,
          agreed_at: now,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })
      }
    } else {
      // 비활성화 시: 동의 철회 (withdrawn_at 설정)
      await supabase
        .from('consents')
        .update({ withdrawn_at: now })
        .eq('user_email', userEmail)
        .eq('consent_type', 'headhunter_sharing')
        .is('withdrawn_at', null)
    }

    // 3. 비활성화 시 Eve 데이터 삭제
    if (!enabled) {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('eve_candidate_id')
          .eq('email', userEmail)
          .single()

        if (user?.eve_candidate_id) {
          console.log('[settings/headhunter-sharing] Eve 데이터 삭제 시작:', user.eve_candidate_id)

          const eveResponse = await fetch(`${process.env.EVE_API_URL}/api/super-admin/candidates/${user.eve_candidate_id}`, {
            method: 'DELETE',
            headers: {
              'X-API-Key': process.env.ADAM_TO_EVE_API_KEY || ''
            }
          })

          if (eveResponse.ok) {
            // eve_candidate_id 제거
            await supabase.from('users').update({
              eve_candidate_id: null
            }).eq('email', userEmail)

            console.log('[settings/headhunter-sharing] Eve 데이터 삭제 성공')
          } else {
            console.error('[settings/headhunter-sharing] Eve 삭제 실패:', eveResponse.status)
          }
        }
      } catch (err) {
        console.error('[settings/headhunter-sharing] Eve 삭제 실패 (non-fatal):', err)
        // Eve 삭제 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 4. 감사 로그
    await supabase.from('audit_logs').insert({
      action: enabled ? 'headhunter_sharing_enabled' : 'headhunter_sharing_disabled',
      actor_email: userEmail,
      target_email: userEmail,
      details: { enabled },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: enabled
        ? '헤드헌터 추천 서비스가 활성화되었습니다.'
        : '헤드헌터 추천 서비스가 비활성화되었습니다.'
    })

  } catch (e) {
    console.error('[settings/headhunter-sharing] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
