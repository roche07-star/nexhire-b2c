import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data: users } = await supabase
    .from('users')
    .select('plan, user_type, headhunter_sharing_enabled')
    .neq('email', session.user.email)

  if (!users) {
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }

  const stats = {
    total: users.length,
    free: users.filter(u => u.plan === 'FREE').length,
    pro: users.filter(u => u.plan === 'PRO').length,
    expert: users.filter(u => u.plan === 'EXPERT').length,
    jobseeker: users.filter(u => u.user_type === 'JOBSEEKER').length,
    headhunter: users.filter(u => u.user_type === 'HEADHUNTER').length,
    headhunterSharing: users.filter(u => u.headhunter_sharing_enabled).length,
  }

  return NextResponse.json(stats)
}
