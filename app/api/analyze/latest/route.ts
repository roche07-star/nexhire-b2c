import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ analysis: null, isPro: false })
  }

  const email = session.user.email as string
  const role = (session.user as { role?: string }).role ?? 'USER'

  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('email', email)
    .maybeSingle()

  const plan = userData?.plan ?? 'FREE'
  const isPro = plan === 'PRO' || plan === 'EXPERT' || role === 'MANAGER'

  const { data, error } = await supabase
    .from('analyses')
    .select('id, result, created_at')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) console.error('[analyze/latest] query error:', error)

  return NextResponse.json({ analysis: data ?? null, isPro })
}
