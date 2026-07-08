import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin
  try {
    const session = await auth()
    if (session?.user?.email) {
      // DB에서 최신 user_type과 plan 조회 (세션 캐싱 문제 방지)
      const { data, error } = await supabase
        .from('users')
        .select('plan, user_type')
        .eq('email', session.user.email as string)
        .maybeSingle()

      console.log('[after-login] DB user data:', data, 'Error:', error)

      // user_type이 없으면 consent 페이지로
      if (!data?.user_type) {
        console.log('[after-login] No user_type, redirecting to consent')
        return NextResponse.redirect(`${base}/consent`)
      }

      // ✅ 개인정보 동의 확인 (탈퇴 취소 후 재로그인 시 필수)
      const { data: consentData } = await supabase
        .from('consents')
        .select('consent_type, is_agreed')
        .eq('user_email', session.user.email)
        .eq('consent_type', 'privacy_required')
        .eq('is_agreed', true)
        .is('withdrawn_at', null)
        .maybeSingle()

      if (!consentData) {
        console.log('[after-login] No privacy consent, redirecting to consent')
        return NextResponse.redirect(`${base}/consent`)
      }

      console.log('[after-login] User type:', data.user_type, 'Plan:', data.plan)

      // user_type에 따라 리다이렉트
      if (data.user_type === 'SUPER_ADMIN') {
        return NextResponse.redirect(`${base}/admin`)
      } else if (data.user_type === 'HEADHUNTER' || data.user_type === 'MANAGER') {
        return NextResponse.redirect(`${base}/dashboard`)
      } else if (data.user_type === 'JOBSEEKER') {
        // 구직자: PRO 이상은 job-seeker, FREE는 analyze
        const plan = data.plan ?? 'FREE'
        if (plan === 'PRO' || plan === 'EXPERT') {
          return NextResponse.redirect(`${base}/job-seeker`)
        } else {
          return NextResponse.redirect(`${base}/analyze`)
        }
      }
    }
  } catch (e) {
    console.error('[after-login] Error:', e)
    // auth/DB 에러 시 홈으로
  }
  return NextResponse.redirect(`${base}/`)
}
