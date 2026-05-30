import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== 'MANAGER') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email 필요' }, { status: 400 })

  const [{ data: user }, { data: analyses }, { data: jdAnalyses }, { data: coupons }] =
    await Promise.all([
      supabase.from('users').select('email, name, plan, analyze_count, jd_count, rewrite_count, interview_count, created_at').eq('email', email).single(),
      supabase.from('analyses').select('id, result, created_at').eq('user_email', email).order('created_at', { ascending: false }).limit(5),
      supabase.from('jd_analyses').select('id, result, created_at').eq('user_email', email).order('created_at', { ascending: false }).limit(5),
      supabase.from('coupons').select('code, feature, claimed_at, used_at').eq('claimed_by', email).order('claimed_at', { ascending: false }),
    ])

  return NextResponse.json({ user, analyses: analyses ?? [], jdAnalyses: jdAnalyses ?? [], coupons: coupons ?? [] })
}
