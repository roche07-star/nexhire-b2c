/**
 * UTM 데이터 업데이트 API
 *
 * 회원가입/로그인 후 클라이언트에서 호출
 * localStorage의 UTM 데이터를 DB에 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { UTMData } from '@/lib/utm-tracker'

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // 2. UTM 데이터 수신
    const utmData: UTMData = await req.json()

    // 3. 이미 UTM 데이터가 있는지 확인 (최초 유입 채널 보존)
    const { data: existingUser } = await supabase
      .from('users')
      .select('utm_source, first_visit_at')
      .eq('email', userEmail)
      .single()

    // 이미 UTM 데이터가 있으면 덮어쓰지 않음
    if (existingUser?.utm_source || existingUser?.first_visit_at) {
      console.log('[UTM API] 이미 UTM 데이터 존재, 스킵:', userEmail)
      return NextResponse.json({
        success: true,
        message: 'UTM already exists (preserved)',
      })
    }

    // 4. DB에 UTM 데이터 저장
    const { error: updateError } = await supabase
      .from('users')
      .update({
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content,
        utm_term: utmData.utm_term,
        first_visit_at: utmData.first_visit_at,
        referrer: utmData.referrer,
      })
      .eq('email', userEmail)

    if (updateError) {
      console.error('[UTM API] Update failed:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    console.log('[UTM API] UTM 저장 완료:', userEmail, utmData)

    return NextResponse.json({
      success: true,
      message: 'UTM saved successfully',
    })
  } catch (error) {
    console.error('[UTM API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
