import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { email, plan } = await req.json()
  if (!email || !['FREE', 'PRO', 'EXPERT'].includes(plan)) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  // 플랜 변경 시 모든 사용량 초기화 + 새 월 기준 시작
  const { error } = await supabase.from('users').update({
    plan,
    analyze_count: 0,
    jd_count: 0,
    rewrite_count: 0,
    interview_count: 0,
    monthly_reset_at: new Date().toISOString(),
  }).eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
