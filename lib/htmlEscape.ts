/**
 * HTML Escape 유틸리티
 *
 * XSS(Cross-Site Scripting) 공격 방어
 */

/**
 * HTML 특수 문자 이스케이프
 *
 * @param text - 이스케이프할 텍스트
 * @returns 이스케이프된 안전한 텍스트
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>')
 * // → '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 배열의 모든 요소를 이스케이프
 *
 * @param arr - 문자열 배열
 * @returns 이스케이프된 배열
 */
export function escapeHtmlArray(arr: string[]): string[] {
  return arr.map(escapeHtml)
}

/**
 * 객체의 모든 문자열 값을 이스케이프
 *
 * @param obj - 이스케이프할 객체
 * @returns 이스케이프된 객체
 */
export function escapeHtmlObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = escapeHtml(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map(v => typeof v === 'string' ? escapeHtml(v) : v)
    } else if (value && typeof value === 'object') {
      result[key] = escapeHtmlObject(value)
    } else {
      result[key] = value
    }
  }

  return result as T
}

/**
 * URL을 안전하게 이스케이프
 *
 * @param url - 이스케이프할 URL
 * @returns 안전한 URL 또는 #
 */
export function escapeUrl(url: string | null | undefined): string {
  if (!url) return '#'

  // javascript:, data:, vbscript: 등 위험한 프로토콜 차단
  const dangerousProtocols = /^(javascript|data|vbscript):/i
  if (dangerousProtocols.test(url)) {
    console.warn('[htmlEscape] Dangerous URL protocol detected:', url)
    return '#'
  }

  return encodeURI(url)
}
