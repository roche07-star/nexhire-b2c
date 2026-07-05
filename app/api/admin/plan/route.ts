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

  // 현재 플랜 확인
  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('email', email)
    .single()

  const currentPlan = userData?.plan ?? 'FREE'

  // 플랜 변경 시 사용량 처리
  let updateData: Record<string, unknown> = {
    plan,
    monthly_reset_at: new Date().toISOString(),
  }

  // 다운그레이드 to FREE: Max (이미 소진)
  if (plan === 'FREE' && (currentPlan === 'PRO' || currentPlan === 'EXPERT')) {
    updateData = {
      ...updateData,
      analyze_count: 3,    // FREE 한도
      jd_count: 3,
      rewrite_count: 3,
      interview_count: 0,
    }
  }
  // 업그레이드 or 다운그레이드 to PRO: 리셋
  else {
    updateData = {
      ...updateData,
      analyze_count: 0,
      jd_count: 0,
      rewrite_count: 0,
      interview_count: 0,
    }
  }

  const { error } = await supabase.from('users').update(updateData).eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
