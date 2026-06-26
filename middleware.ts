import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 공개 API 라우트 (인증 불필요)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/share',
]

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

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
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
