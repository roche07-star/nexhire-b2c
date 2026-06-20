import { auth } from '@/auth'

// Middleware 비활성화 - 이력서 분석 페이지에서 체크하도록 변경
export default auth(() => {})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
