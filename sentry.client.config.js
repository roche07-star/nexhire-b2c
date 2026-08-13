import * as Sentry from '@sentry/nextjs'

console.log('[Sentry Client] Initializing...', { dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 성능 모니터링 샘플링 (10%)
  tracesSampleRate: 0.1,

  // 에러 샘플링 (100% - 모든 에러 수집)
  sampleRate: 1.0,

  // 🔒 보안 강화: beforeSend 훅
  beforeSend(event, hint) {
    // ========================================
    // 1. API 키 포함 에러 차단
    // ========================================
    const error = hint.originalException
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message)

      // API 키가 포함된 에러는 전송하지 않음
      if (
        message.includes('ANTHROPIC_API_KEY') ||
        message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        message.includes('AUTH_SECRET') ||
        message.includes('GOOGLE_CLIENT_SECRET')
      ) {
        console.warn('[Sentry] API 키 포함 에러 차단:', message.slice(0, 100))
        return null // 전송 차단
      }
    }

    // ========================================
    // 2. 환경변수 제거
    // ========================================
    if (event.contexts?.runtime?.name) {
      delete event.contexts.runtime
    }

    // ========================================
    // 3. Request 헤더에서 민감 정보 제거
    // ========================================
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['x-api-key']
    }

    // ========================================
    // 4. 사용자 PII 제거 (이메일만 해시 처리)
    // ========================================
    if (event.user?.email) {
      // 이메일을 해시로 변환 (간단한 해시)
      const email = event.user.email
      const hash = email.split('@')[0].slice(0, 3) + '***'
      event.user.email = hash + '@***'
    }

    // ========================================
    // 5. Breadcrumbs에서 민감 데이터 제거
    // ========================================
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          // API 응답 데이터 제거
          delete breadcrumb.data.response
          delete breadcrumb.data.request
        }
        return breadcrumb
      })
    }

    return event
  },

  // Replay 비활성화 (무료 플랜에서 사용 안 함)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // 무시할 에러 (노이즈 제거)
  ignoreErrors: [
    // 브라우저 확장 프로그램 에러
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',

    // 네트워크 에러 (일시적)
    'NetworkError',
    'Non-Error promise rejection captured',

    // 봇/크롤러
    'BotDetected',
  ],

  // 무시할 URL 패턴
  denyUrls: [
    // 크롬 확장 프로그램
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
})

console.log('[Sentry Client] Initialized successfully')

if (typeof window !== 'undefined') {
  window.Sentry = Sentry
}
