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

      // 헤드헌터는 대시보드, 구직자는 이력서 분석으로
      if (data.user_type === 'HEADHUNTER') {
        return NextResponse.redirect(`${base}/dashboard`)
      } else {
        // JOBSEEKER 또는 기타
        const plan = data?.plan ?? 'FREE'
        if (plan === 'PRO' || plan === 'EXPERT' || role === 'MANAGER') {
          return NextResponse.redirect(`${base}/analyze`)
        }
      }
    }
  } catch {
    // auth/DB 에러 시 홈으로
  }
  return NextResponse.redirect(`${base}/`)
}
