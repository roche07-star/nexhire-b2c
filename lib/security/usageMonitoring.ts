/**
 * 이상 사용 패턴 모니터링 시스템
 *
 * 담당: 테스 (S/W 테스터) + 코난 (보안 전문가)
 * 목적: Chargeback Fraud 예방, 크롤링 차단, 남용 탐지
 */

import { supabase } from '@/lib/supabase'
import { PLAN_LIMITS } from '@/lib/constants/planLimits'

export interface SuspiciousPattern {
  /** 의심스러운가? */
  suspicious: boolean
  /** 의심 사유 */
  reason?: string
  /** 심각도 (1-5, 5가 가장 심각) */
  severity?: 1 | 2 | 3 | 4 | 5
  /** 권장 조치 */
  action?: string
}

/**
 * 24시간 내 사용량 조회
 */
async function get24hUsage(email: string): Promise<{
  analyze: number
  jd: number
  rewrite: number
  interview: number
  proposal: number
}> {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('action')
    .eq('user_email', email)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error || !logs) {
    console.error('[usageMonitoring] Failed to get 24h usage:', error)
    return { analyze: 0, jd: 0, rewrite: 0, interview: 0, proposal: 0 }
  }

  // 액션별 카운트
  const usage = {
    analyze: logs.filter(l => l.action === 'analyze').length,
    jd: logs.filter(l => l.action === 'jd_analyze').length,
    rewrite: logs.filter(l => l.action === 'resume_generate').length,
    interview: logs.filter(l => l.action === 'interview_guide').length,
    proposal: logs.filter(l => l.action === 'proposal_generate').length,
  }

  return usage
}

/**
 * 결제 시점 조회
 */
async function getLastPaymentTime(email: string): Promise<Date | null> {
  // 실제 구현 시 payments 테이블 조회
  // 현재는 plan_end_date 또는 monthly_reset_at 기준
  const { data } = await supabase
    .from('users')
    .select('monthly_reset_at')
    .eq('email', email)
    .single()

  if (!data?.monthly_reset_at) return null
  return new Date(data.monthly_reset_at)
}

/**
 * 패턴 1: 전체 한도 24시간 내 급격히 소진
 */
export async function detectRapidExhaustion(
  email: string,
  userType: 'JOBSEEKER' | 'HEADHUNTER',
  plan: 'FREE' | 'PRO' | 'EXPERT'
): Promise<SuspiciousPattern> {
  const usage24h = await get24hUsage(email)
  const total24h = Object.values(usage24h).reduce((sum, v) => sum + v, 0)

  // 플랜별 월 한도 조회
  const limits = PLAN_LIMITS[userType]?.[plan]
  if (!limits) return { suspicious: false }

  const totalLimit = limits.analyze + limits.jd_analysis + limits.jd_match + limits.rewrite + limits.interview + limits.proposal

  // 80% 이상을 24시간 내 소진
  const exhaustionRate = total24h / totalLimit
  if (exhaustionRate >= 0.8) {
    return {
      suspicious: true,
      reason: `24시간 내 전체 한도의 ${Math.round(exhaustionRate * 100)}% 소진 (${total24h}/${totalLimit}회)`,
      severity: 4,
      action: '계정 플래깅 + Chargeback 가능성 모니터링'
    }
  }

  return { suspicious: false }
}

/**
 * 패턴 2: 면접 가이드 집중 사용 (고원가 기능)
 */
export async function detectInterviewAbuse(email: string): Promise<SuspiciousPattern> {
  const usage24h = await get24hUsage(email)

  // 면접 가이드 1회 = API 원가 ₩105
  // 1일 10회 이상 = ₩1,050 원가 (의심)
  if (usage24h.interview >= 10) {
    return {
      suspicious: true,
      reason: `면접 가이드 24시간 내 ${usage24h.interview}회 사용 (예상 원가 ₩${usage24h.interview * 105})`,
      severity: 3,
      action: '고원가 기능 집중 사용 모니터링'
    }
  }

  return { suspicious: false }
}

/**
 * 패턴 3: 결제 후 즉시 전부 사용 (Chargeback 예비 징후)
 */
export async function detectPostPaymentBinge(
  email: string,
  userType: 'JOBSEEKER' | 'HEADHUNTER',
  plan: 'FREE' | 'PRO' | 'EXPERT'
): Promise<SuspiciousPattern> {
  const lastPayment = await getLastPaymentTime(email)
  if (!lastPayment) return { suspicious: false }

  const hoursSincePayment = (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60)

  // 결제 후 6시간 이내
  if (hoursSincePayment <= 6) {
    const usage24h = await get24hUsage(email)
    const total = Object.values(usage24h).reduce((sum, v) => sum + v, 0)

    const limits = PLAN_LIMITS[userType]?.[plan]
    if (!limits) return { suspicious: false }

    const totalLimit = limits.analyze + limits.jd_analysis + limits.jd_match + limits.rewrite + limits.interview + limits.proposal

    // 결제 후 6시간 내 80% 이상 사용
    if (total / totalLimit >= 0.8) {
      return {
        suspicious: true,
        reason: `결제 후 ${Math.round(hoursSincePayment)}시간 내 한도의 ${Math.round(total / totalLimit * 100)}% 사용`,
        severity: 5, // 최고 심각도
        action: '⚠️ Chargeback 가능성 높음 - 즉시 알림 필요'
      }
    }
  }

  return { suspicious: false }
}

/**
 * 패턴 4: 다운로드만 반복 (크롤링 의심)
 */
export async function detectDownloadCrawling(email: string): Promise<SuspiciousPattern> {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('action')
    .eq('user_email', email)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error || !logs) return { suspicious: false }

  const downloads = logs.filter(l => l.action === 'download_html').length
  const generations = logs.filter(l => l.action === 'resume_generate').length

  // 생성 없이 다운로드만 20회 이상
  if (downloads >= 20 && downloads > generations * 3) {
    return {
      suspicious: true,
      reason: `24시간 내 다운로드 ${downloads}회 (생성 ${generations}회) - 크롤링 의심`,
      severity: 3,
      action: '크롤링 봇 가능성 - IP 차단 고려'
    }
  }

  return { suspicious: false }
}

/**
 * 통합 이상 패턴 감지
 */
export async function detectAllPatterns(
  email: string,
  userType: 'JOBSEEKER' | 'HEADHUNTER',
  plan: 'FREE' | 'PRO' | 'EXPERT'
): Promise<SuspiciousPattern[]> {
  const [
    pattern1,
    pattern2,
    pattern3,
    pattern4,
  ] = await Promise.all([
    detectRapidExhaustion(email, userType, plan),
    detectInterviewAbuse(email),
    detectPostPaymentBinge(email, userType, plan),
    detectDownloadCrawling(email),
  ])

  return [pattern1, pattern2, pattern3, pattern4].filter(p => p.suspicious)
}

/**
 * Slack 알림 전송 (옵션)
 *
 * 사용법:
 * 1. Slack Webhook URL을 환경변수에 추가: SLACK_SECURITY_WEBHOOK
 * 2. Slack에서 Incoming Webhook 생성: https://api.slack.com/messaging/webhooks
 */
export async function sendSlackAlert(pattern: SuspiciousPattern, email: string) {
  const webhookUrl = process.env.SLACK_SECURITY_WEBHOOK

  if (!webhookUrl) {
    console.warn('[usageMonitoring] SLACK_SECURITY_WEBHOOK not configured')
    return
  }

  const severityEmoji = {
    1: '🟢',
    2: '🟡',
    3: '🟠',
    4: '🔴',
    5: '🚨',
  }

  const message = {
    text: `${severityEmoji[pattern.severity || 3]} 의심 사용자 탐지`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji[pattern.severity || 3]} 이상 사용 패턴 탐지`,
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*사용자:*\n${email}`
          },
          {
            type: 'mrkdwn',
            text: `*심각도:*\n${pattern.severity}/5`
          },
          {
            type: 'mrkdwn',
            text: `*사유:*\n${pattern.reason}`
          },
          {
            type: 'mrkdwn',
            text: `*권장 조치:*\n${pattern.action}`
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `탐지 시각: ${new Date().toLocaleString('ko-KR')} | <https://admin8.kcp.co.kr|KCP 관리자> | <https://jobizic.vercel.app/admin|Admin 대시보드>`
          }
        ]
      }
    ]
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      console.error('[usageMonitoring] Slack alert failed:', response.statusText)
    }
  } catch (error) {
    console.error('[usageMonitoring] Slack alert error:', error)
  }
}

/**
 * 이메일 알림 전송 (대안)
 */
export async function sendEmailAlert(pattern: SuspiciousPattern, email: string) {
  // TODO: 이메일 전송 로직 (SendGrid, AWS SES 등)
  console.log('[usageMonitoring] Email alert:', {
    to: 'roche07he@gmail.com',
    subject: `⚠️ 의심 사용자: ${email}`,
    body: `사유: ${pattern.reason}\n조치: ${pattern.action}`
  })
}
