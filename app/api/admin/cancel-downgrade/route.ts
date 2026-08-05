import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

/**
 * 플랜 다운그레이드 예약 취소 API (관리자 전용)
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Super Admin 권한이 필요합니다.' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: 'email 필수' }, { status: 400 })
  }

  // downgrade_to, downgrade_requested_at, next_plan 초기화
  const { error } = await supabase.from('users').update({
    downgrade_to: null,
    downgrade_requested_at: null,
    next_plan: null,
    next_plan_starts_at: null,
    next_plan_end_date: null,
  }).eq('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
