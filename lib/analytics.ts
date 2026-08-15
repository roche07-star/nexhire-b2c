/**
 * 마케팅 이벤트 트래킹 유틸리티
 *
 * Vercel Analytics + Custom Events
 * 마린(Marketing)이 요청한 핵심 이벤트 추적
 */

import { track } from '@vercel/analytics'

export type AnalyticsEvent =
  | 'signup_started'
  | 'signup_completed'
  | 'resume_uploaded'
  | 'analysis_completed'
  | 'plan_viewed'
  | 'payment_started'
  | 'payment_completed'
  | 'page_exit'

export interface AnalyticsData {
  // UTM 파라미터
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string

  // 사용자 정보
  user_email?: string
  user_type?: string
  plan?: string

  // 이벤트 관련
  feature?: string
  value?: number

  // 기타
  [key: string]: string | number | boolean | undefined
}

/**
 * 이벤트 추적
 */
export function trackEvent(event: AnalyticsEvent, data?: AnalyticsData) {
  if (typeof window === 'undefined') return

  // UTM 파라미터 자동 수집
  const urlParams = new URLSearchParams(window.location.search)
  const utmData: AnalyticsData = {}

  if (urlParams.has('utm_source')) utmData.utm_source = urlParams.get('utm_source') || undefined
  if (urlParams.has('utm_medium')) utmData.utm_medium = urlParams.get('utm_medium') || undefined
  if (urlParams.has('utm_campaign')) utmData.utm_campaign = urlParams.get('utm_campaign') || undefined
  if (urlParams.has('utm_content')) utmData.utm_content = urlParams.get('utm_content') || undefined
  if (urlParams.has('utm_term')) utmData.utm_term = urlParams.get('utm_term') || undefined

  // Vercel Analytics 전송
  track(event, {
    ...utmData,
    ...data,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  })

  // 개발 환경에서 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, { ...utmData, ...data })
  }
}

/**
 * 페이지뷰 추적
 */
export function trackPageView(pageName: string) {
  trackEvent('page_exit', { page: pageName })
}

/**
 * 회원가입 시작
 */
export function trackSignupStarted(method: 'google' | 'email') {
  trackEvent('signup_started', { method })
}

/**
 * 회원가입 완료
 */
export function trackSignupCompleted(userEmail: string, method: 'google' | 'email') {
  trackEvent('signup_completed', {
    user_email: userEmail,
    method,
  })
}

/**
 * 이력서 업로드
 */
export function trackResumeUploaded() {
  trackEvent('resume_uploaded')
}

/**
 * 분석 완료
 */
export function trackAnalysisCompleted(plan: string) {
  trackEvent('analysis_completed', { plan })
}

/**
 * 플랜 페이지 조회
 */
export function trackPlanViewed(plan: string) {
  trackEvent('plan_viewed', { plan })
}

/**
 * 결제 시작
 */
export function trackPaymentStarted(plan: string, amount: number) {
  trackEvent('payment_started', {
    plan,
    value: amount,
  })
}

/**
 * 결제 완료
 */
export function trackPaymentCompleted(plan: string, amount: number, transactionId?: string) {
  trackEvent('payment_completed', {
    plan,
    value: amount,
    transaction_id: transactionId,
  })
}
