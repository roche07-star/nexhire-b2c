import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

// CORS 헤더
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://jobizic-biz.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Max-Age': '86400',
}

/**
 * OPTIONS /api/audit/candidate-access
 * CORS Preflight 요청 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}

/**
 * POST /api/audit/candidate-access
 * 헤드헌터의 후보자 정보 접근 로그 기록
 *
 * Eve에서 헤드헌터가 후보자 정보를 조회할 때 호출
 * Adam의 audit_logs 테이블에 기록
 */
export async function POST(req: NextRequest) {
  try {
    // API Key 검증 (Eve → Adam 호출)
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.EVE_TO_ADAM_API_KEY) {
      return NextResponse.json({ error: '권한 없음' }, {
        status: 403,
        headers: CORS_HEADERS
      })
    }

    const {
      headhunter_email,
      candidate_email,
      action,
      details
    } = await req.json()

    // 필수 파라미터 검증
    if (!headhunter_email || !candidate_email || !action) {
      return NextResponse.json({
        error: 'headhunter_email, candidate_email, action 필수'
      }, {
        status: 400,
        headers: CORS_HEADERS
      })
    }

    // 유효한 액션 타입 검증
    const validActions = ['view', 'export', 'share', 'contact']
    if (!validActions.includes(action)) {
      return NextResponse.json({
        error: `action은 ${validActions.join(', ')} 중 하나여야 합니다`
      }, {
        status: 400,
        headers: CORS_HEADERS
      })
    }

    // audit_logs에 기록
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'candidate_access',
        actor_email: headhunter_email,
        target_email: candidate_email,
        details: {
          access_type: action,
          source: 'eve',
          ...details
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })

    if (auditError) {
      console.error('[audit/candidate-access] Insert error:', auditError)
      return NextResponse.json({ error: '로그 기록 실패' }, {
        status: 500,
        headers: CORS_HEADERS
      })
    }

    console.log(`[audit/candidate-access] ${headhunter_email} → ${candidate_email} (${action})`)

    return NextResponse.json({ success: true }, {
      headers: CORS_HEADERS
    })

  } catch (e) {
    console.error('[audit/candidate-access] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, {
      status: 500,
      headers: CORS_HEADERS
    })
  }
}
