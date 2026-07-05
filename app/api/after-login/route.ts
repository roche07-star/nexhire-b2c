import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin
  try {
    const session = await auth()
    if (session?.user?.email) {
      const role = (session.user as { role?: string }).role ?? 'USER'
      const { data } = await supabase
        .from('users')
        .select('plan, user_type')
        .eq('email', session.user.email as string)
        .maybeSingle()

      // user_type이 없으면 consent 페이지로
      if (!data?.user_type) {
        return NextResponse.redirect(`${base}/consent?callbackUrl=/analyze`)
      }

      // 헤드헌터와 Manager는 대시보드로
      if (data.user_type === 'HEADHUNTER' || data.user_type === 'MANAGER') {
        return NextResponse.redirect(`${base}/dashboard`)
      } else if (data.user_type === 'SUPER_ADMIN') {
        return NextResponse.redirect(`${base}/admin`)
      } else if (data.user_type === 'JOBSEEKER') {
        // 구직자: PRO 이상은 대시보드, FREE는 홈
        const plan = data?.plan ?? 'FREE'
        if (plan === 'PRO' || plan === 'EXPERT' || role === 'MANAGER') {
          return NextResponse.redirect(`${base}/job-seeker`)
        }
      }
    }
  } catch {
    // auth/DB 에러 시 홈으로
  }
  return NextResponse.redirect(`${base}/`)
}
