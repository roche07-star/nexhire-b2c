import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth-helpers'

export async function GET() {
  const session = await auth()
  if (!session?.user || !isAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data: users } = await supabase
    .from('users')
    .select('plan, user_type, headhunter_sharing_enabled')
    .neq('email', session.user.email)

  if (!users) {
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }

  // 일반 사용자만 필터링 (Manager, Super Admin 제외)
  const regularUsers = users.filter(u => u.user_type !== 'MANAGER' && u.user_type !== 'SUPER_ADMIN')

  const stats = {
    total: regularUsers.length,
    free: regularUsers.filter(u => u.plan === 'FREE').length,
    pro: regularUsers.filter(u => u.plan === 'PRO').length,
    expert: regularUsers.filter(u => u.plan === 'EXPERT').length,
    superAdmin: users.filter(u => u.user_type === 'SUPER_ADMIN').length,
    manager: users.filter(u => u.user_type === 'MANAGER').length,
    jobseeker: users.filter(u => u.user_type === 'JOBSEEKER').length,
    headhunter: users.filter(u => u.user_type === 'HEADHUNTER').length,
    headhunterSharing: regularUsers.filter(u => u.headhunter_sharing_enabled).length,
  }

  return NextResponse.json(stats)
}
