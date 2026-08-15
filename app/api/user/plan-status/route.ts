import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/user/plan-status
 * 현재 사용자의 플랜 및 초기화 정보 조회
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('plan, monthly_reset_at, plan_end_date')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('[plan-status] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      plan: data?.plan ?? 'FREE',
      monthly_reset_at: data?.monthly_reset_at ?? null,
      plan_end_date: data?.plan_end_date ?? null,
    })
  } catch (e: any) {
    console.error('[plan-status] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
