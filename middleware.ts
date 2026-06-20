import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export default auth(async (req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  console.log('[middleware] Path:', pathname, 'Email:', session?.user?.email)

  // 로그인하지 않은 경우 또는 public 경로는 통과
  if (!session?.user?.email) {
    console.log('[middleware] No session, pass')
    return NextResponse.next()
  }

  // 동의 페이지, 로그인 페이지, API 경로는 체크 제외
  const publicPaths = ['/consent', '/login', '/api']
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('[middleware] Public path, pass')
    return NextResponse.next()
  }

  // 개인정보 동의 여부 확인
  try {
    console.log('[middleware] Checking consent for:', session.user.email)
    const { data: consent, error: queryError } = await supabase
      .from('consents')
      .select('id')
      .eq('user_email', session.user.email)
      .eq('consent_type', 'privacy_required')
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .single()

    console.log('[middleware] Consent result:', consent, 'Error:', queryError)

    // 동의하지 않은 경우 동의 페이지로 리다이렉트
    if (!consent) {
      console.log('[middleware] No consent, redirecting to /consent')
      const consentUrl = new URL('/consent', req.url)
      consentUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(consentUrl)
    }

    console.log('[middleware] Consent found, pass')
  } catch (error) {
    console.error('[middleware] Consent check error:', error)
    // 에러 발생 시 안전하게 동의 페이지로 리다이렉트
    const consentUrl = new URL('/consent', req.url)
    consentUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(consentUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
