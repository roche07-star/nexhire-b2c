/**
 * 안전한 로깅 유틸리티
 *
 * 프로덕션 환경에서 민감정보 로그 노출 방지
 */

const isDev = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * 민감정보 마스킹
 */
function maskSensitive(text: string): string {
  if (!text) return ''

  // 이메일 마스킹: user@example.com → u***@e***.com
  text = text.replace(
    /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/g,
    (_, user, domain) => {
      const maskedUser = user[0] + '***'
      const maskedDomain = domain[0] + '***.' + domain.split('.').pop()
      return `${maskedUser}@${maskedDomain}`
    }
  )

  // 전화번호 마스킹: 010-1234-5678 → 010-****-5678
  text = text.replace(
    /(\d{2,3})-?(\d{3,4})-?(\d{4})/g,
    (_, prefix, middle, last) => `${prefix}-****-${last}`
  )

  // API 키 마스킹: sk-ant-api03-xxxxx → sk-***
  text = text.replace(
    /(sk-[a-zA-Z0-9-]{8,})/g,
    'sk-***'
  )

  return text
}

/**
 * 개발 환경 전용 로그
 *
 * @example
 * ```typescript
 * logDev('[cache] HIT:', key)
 * // 개발: 출력됨
 * // 프로덕션: 출력 안 됨
 * ```
 */
export function logDev(...args: any[]) {
  if (isDev) {
    console.log(...args)
  }
}

/**
 * 민감정보 마스킹 후 로그
 *
 * @example
 * ```typescript
 * logSafe('[admin] User deleted:', 'user@example.com')
 * // → [admin] User deleted: u***@e***.com
 * ```
 */
export function logSafe(...args: any[]) {
  if (isProduction) {
    const masked = args.map(arg =>
      typeof arg === 'string' ? maskSensitive(arg) : arg
    )
    console.log(...masked)
  } else {
    console.log(...args)
  }
}

/**
 * 에러 로그 (항상 출력, 민감정보 마스킹)
 */
export function logError(...args: any[]) {
  if (isProduction) {
    const masked = args.map(arg =>
      typeof arg === 'string' ? maskSensitive(arg) : arg
    )
    console.error(...masked)
  } else {
    console.error(...args)
  }
}

/**
 * 보안 이벤트 로그 (항상 출력)
 */
export function logSecurity(event: string, details?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  console.log(`[SECURITY ${timestamp}] ${event}`, details || '')
}

/**
 * console.log 대체 권장 헬퍼
 */
export const logger = {
  /** 개발 전용 */
  dev: logDev,

  /** 민감정보 마스킹 */
  safe: logSafe,

  /** 에러 (항상 출력) */
  error: logError,

  /** 보안 이벤트 (항상 출력) */
  security: logSecurity,
}
