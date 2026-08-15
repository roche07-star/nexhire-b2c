import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as Sentry from '@sentry/nextjs'

// 공개 API 라우트 (인증 불필요)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/share',
  '/api/audit', // Eve → Adam 접근 로그 (API Key 인증)
  '/api/telegram', // 텔레그램 Webhook (Secret Token 검증)
]

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  // 🔑 Sentry User Context + Tags + Context 설정 (서버 사이드)
  if (req.auth?.user) {
    const userEmail = req.auth.user.email

    // User 정보
    Sentry.setUser({
      id: userEmail || 'unknown',
      email: userEmail || undefined,
      username: req.auth.user.name || undefined,
    })

    // Tags (검색/필터 가능)
    Sentry.setTags({
      page: pathname,
      environment: process.env.NODE_ENV || 'production',
    })

    // DB에서 추가 정보 가져오기 (비동기, 에러 무시)
    if (userEmail) {
      supabase
        .from('users')
        .select('plan, user_type, status')
        .eq('email', userEmail)
        .single()
        .then(({ data }) => {
          if (data) {
            Sentry.setTags({
              plan: data.plan || 'FREE',
              user_type: data.user_type || 'JOBSEEKER',
              status: data.status || 'active',
            })

            Sentry.setContext('subscription', {
              plan: data.plan,
              user_type: data.user_type,
              status: data.status,
            })
          }
        })
    }
  } else {
    Sentry.setUser(null)
    Sentry.setTags({})
  }

  // IP 차단 체크
  if (ip !== 'unknown') {
    const { data: blocked } = await supabase
      .from('blocked_ips')
      .select('id, reason')
      .eq('ip_address', ip)
      .is('unblocked_at', null)
      .limit(1)
      .maybeSingle()

    if (blocked) {
      console.log(`[middleware] Blocked IP detected: ${ip} (${blocked.reason})`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // API 라우트 보안 체크
  if (pathname.startsWith('/api/')) {
    // 공개 API는 통과
    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // 나머지 API는 인증 필수
    if (!req.auth) {
      return NextResponse.json(
        { error: '로그인 하시기 바랍니다.' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
