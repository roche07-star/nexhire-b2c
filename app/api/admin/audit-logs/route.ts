import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

/**
 * GET /api/admin/audit-logs
 * 관리자용 접근 로그 조회
 *
 * Query params:
 * - email: 후보자 이메일 (optional, 특정 후보자의 로그만 조회)
 * - limit: 조회 개수 (default: 100, max: 500)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const targetEmail = searchParams.get('email')
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '100'), 500)

    // audit_logs 조회
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'candidate_access')
      .order('created_at', { ascending: false })
      .limit(limit)

    // 특정 후보자의 로그만 조회
    if (targetEmail) {
      query = query.eq('target_email', targetEmail)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error('[admin/audit-logs] Query error:', logsError)
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })

  } catch (e: any) {
    console.error('[admin/audit-logs] Error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
