/**
 * 이메일 보안 검증 (코난 - 보안 전문가)
 *
 * FREE 플랜 남용 방지:
 * - Gmail/Outlook +태그 차단
 * - 일회용 이메일 차단
 */

/**
 * Gmail/Outlook +태그 정규화
 * 예: roche07he+test@gmail.com → roche07he@gmail.com
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()

  // Gmail/Google Workspace: +태그 제거 및 . 제거
  if (trimmed.endsWith('@gmail.com') || trimmed.includes('@googlemail.com')) {
    const [localPart, domain] = trimmed.split('@')
    // +태그 제거
    const withoutPlus = localPart.split('+')[0]
    // . 제거 (Gmail은 . 무시)
    const withoutDots = withoutPlus.replace(/\./g, '')
    return `${withoutDots}@gmail.com`
  }

  // Outlook/Hotmail/Live: +태그 제거
  if (
    trimmed.endsWith('@outlook.com') ||
    trimmed.endsWith('@hotmail.com') ||
    trimmed.endsWith('@live.com')
  ) {
    const [localPart, domain] = trimmed.split('@')
    const withoutPlus = localPart.split('+')[0]
    return `${withoutPlus}@${domain}`
  }

  // 기타 이메일: +태그만 제거
  const [localPart, domain] = trimmed.split('@')
  const withoutPlus = localPart.split('+')[0]
  return `${withoutPlus}@${domain}`
}

/**
 * 일회용 이메일 도메인 차단
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'sharklasers.com',
  'yopmail.com',
  'maildrop.cc',
]

export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain)
}

/**
 * 이메일 보안 검증 (통합)
 *
 * @returns { valid: boolean, normalized: string, reason?: string }
 */
export function validateEmailSecurity(email: string): {
  valid: boolean
  normalized: string
  reason?: string
} {
  // 1. 일회용 이메일 차단
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      normalized: email.toLowerCase(),
      reason: '일회용 이메일은 사용할 수 없습니다. 정식 이메일 주소를 사용해주세요.'
    }
  }

  // 2. 정규화
  const normalized = normalizeEmail(email)

  // 3. +태그 사용 감지 (경고용)
  const hasPlus = email.includes('+')
  if (hasPlus && email !== normalized) {
    console.warn('[Security] Email +tag detected:', email, '→', normalized)
  }

  return {
    valid: true,
    normalized
  }
}
