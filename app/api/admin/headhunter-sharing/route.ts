import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { email, enabled } = await req.json()

  if (!email || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  try {
    // users 테이블 업데이트
    const updateData: any = {
      headhunter_sharing_enabled: enabled
    }

    if (enabled) {
      // 활성화: 동의 일시 기록
      updateData.headhunter_sharing_consented_at = new Date().toISOString()
    } else {
      // 비활성화: 동의 일시 제거
      updateData.headhunter_sharing_consented_at = null
    }

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email)
      .select('eve_candidate_id')
      .single()

    if (updateError) {
      console.error('[admin/headhunter-sharing] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 비활성화 시 Eve에서 후보자 삭제
    if (!enabled && user?.eve_candidate_id) {
      try {
        const eveUrl = process.env.EVE_API_URL
        const apiKey = process.env.ADAM_TO_EVE_API_KEY

        if (eveUrl && apiKey) {
          await fetch(`${eveUrl}/api/super-admin/candidates/${user.eve_candidate_id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': apiKey }
          })
          console.log(`[admin/headhunter-sharing] Eve 후보자 삭제: ${user.eve_candidate_id}`)
        }
      } catch (eveError) {
        console.error('[admin/headhunter-sharing] Eve 삭제 실패:', eveError)
        // Eve 삭제 실패해도 Adam 업데이트는 성공으로 처리
      }
    }

    return NextResponse.json({ success: true })

  } catch (e: any) {
    console.error('[admin/headhunter-sharing] Error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
