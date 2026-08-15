import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 성능 모니터링 샘플링 (10%)
  tracesSampleRate: 0.1,

  // 에러 샘플링 (100%)
  sampleRate: 1.0,

  // 🔒 보안 강화: beforeSend 훅 (서버용)
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
        message.includes('GOOGLE_CLIENT_SECRET') ||
        message.includes('API_KEY') ||
        message.includes('SECRET') ||
        message.includes('TOKEN')
      ) {
        console.warn('[Sentry] API 키 포함 에러 차단 (서버):', message.slice(0, 100))
        return null // 전송 차단
      }
    }

    // ========================================
    // 2. 서버 환경변수 완전 제거
    // ========================================
    if (event.contexts) {
      delete event.contexts.runtime
      delete event.contexts.device
      delete event.contexts.os
    }

    // 서버 이름/호스트 제거
    delete event.server_name

    // ========================================
    // 3. Request 데이터에서 민감 정보 제거
    // ========================================
    if (event.request) {
      // 헤더 제거
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['x-api-key']
        delete event.request.headers['x-auth-token']
      }

      // Query 파라미터에서 민감 정보 제거
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        const sensitiveParams = ['token', 'api_key', 'apiKey', 'secret', 'password']
        const hasSecret = sensitiveParams.some(param => event.request.query_string.toString().includes(param))
        if (hasSecret) {
          event.request.query_string = '[FILTERED]'
        }
      }

      // Body 데이터 제거 (민감 정보 포함 가능)
      delete event.request.data
    }

    // ========================================
    // 4. Exception 값에서 민감 정보 마스킹
    // ========================================
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(exception => {
        if (exception.value) {
          // 이메일 마스킹
          exception.value = exception.value.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[이메일]'
          )

          // 전화번호 마스킹
          exception.value = exception.value.replace(
            /(?:010|011|016|017|018|019|02|0[3-9]\d)[\s.-]?\d{3,4}[\s.-]?\d{4}/g,
            '[연락처]'
          )

          // API 키 패턴 마스킹
          exception.value = exception.value.replace(
            /sk-[a-zA-Z0-9]{32,}/g,
            '[API_KEY]'
          )
        }
        return exception
      })
    }

    // ========================================
    // 5. 사용자 정보 유지 (Slack 알림에 포함)
    // ========================================
    if (event.user) {
      // IP 주소만 제거 (개인정보 보호)
      delete event.user.ip_address

      // Email, Username은 Slack 알림을 위해 유지
    }

    return event
  },

  // 무시할 에러
  ignoreErrors: [
    // Next.js 내부 에러 (노이즈)
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',

    // 네트워크 에러 (일시적)
    'NetworkError',
    'Failed to fetch',
    'AbortError',

    // Rate limiting (정상 동작)
    'Too many requests',
    'Rate limit exceeded',
  ],
})
