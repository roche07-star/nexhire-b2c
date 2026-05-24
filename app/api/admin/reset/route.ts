import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const { error } = await supabase
    .from('users')
    .update({ analyze_count: 0 })
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
