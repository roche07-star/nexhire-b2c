import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE:   { analyze: 1,  jd: 0,  rewrite: 0,  interview: 0 },
  PRO:    { analyze: 10, jd: 15, rewrite: 3,  interview: 0 },
  EXPERT: { analyze: 30, jd: 30, rewrite: 15, interview: 15 },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const email = session.user.email

  const [{ data: user }, { data: coupons }] = await Promise.all([
    supabase.from('users')
      .select('plan, analyze_count, jd_count, rewrite_count, interview_count, monthly_reset_at')
      .eq('email', email).single(),
    supabase.from('coupons')
      .select('id, code, feature, used_at, expires_at, claimed_at')
      .eq('claimed_by', email)
      .order('claimed_at', { ascending: false }),
  ])

  const plan = user?.plan ?? 'FREE'
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE
  const now = new Date()

  const usage = {
    analyze:   { used: user?.analyze_count ?? 0,   limit: limits.analyze },
    jd:        { used: user?.jd_count ?? 0,        limit: limits.jd },
    rewrite:   { used: user?.rewrite_count ?? 0,   limit: limits.rewrite },
    interview: { used: user?.interview_count ?? 0, limit: limits.interview },
  }

  const couponList = (coupons ?? []).map(c => ({
    ...c,
    status: c.used_at ? 'used'
      : c.expires_at && new Date(c.expires_at) < now ? 'expired'
      : 'active',
  }))

  const resetAt = user?.monthly_reset_at
    ? (() => { const d = new Date(user.monthly_reset_at); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('ko-KR') })()
    : null

  return NextResponse.json({ plan, usage, coupons: couponList, resetAt })
}
