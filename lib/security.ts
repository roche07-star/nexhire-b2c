/**
 * 침입 탐지 시스템 (Intrusion Detection System)
 *
 * 이상 행동 패턴 감지 및 실시간 알림
 */

import { supabase } from './supabase'

export type SecurityEventType =
  | 'rapid_requests'        // 단기간 대량 요청
  | 'failed_auth'           // 인증 실패 반복
  | 'privilege_escalation'  // 권한 상승 시도
  | 'data_exfiltration'     // 대량 데이터 조회
  | 'honeypot_trigger'      // Honeypot 접근
  | 'suspicious_pattern'    // 의심스러운 패턴
  | 'rate_limit_exceeded'   // Rate limit 초과

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEvent {
  type: SecurityEventType
  severity: SeverityLevel
  actor: string // IP or email
  target?: string
  details: Record<string, unknown>
  timestamp: Date
}

/**
 * 보안 이벤트 기록
 */
export async function logSecurityEvent(event: SecurityEvent) {
  // audit_logs에 기록
  await supabase.from('audit_logs').insert({
    action: `security_${event.type}`,
    actor_email: event.actor.includes('@') ? event.actor : null,
    target_email: event.target || null,
    details: {
      ...event.details,
      severity: event.severity,
      event_type: event.type,
    },
    ip_address: event.actor.includes('@') ? null : event.actor,
  })

  // 심각도에 따라 알림
  if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
    await sendSecurityAlert(event)
  }
}

/**
 * Slack 보안 알림 전송
 */
async function sendSecurityAlert(event: SecurityEvent) {
  const webhookUrl = process.env.SLACK_SECURITY_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[security] Slack webhook not configured, skipping alert')
    return
  }

  const color = {
    LOW: '#3b82f6',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    CRITICAL: '#7f1d1d',
  }[event.severity]

  const emoji = {
    rapid_requests: '⚡',
    failed_auth: '🔒',
    privilege_escalation: '🚨',
    data_exfiltration: '📤',
    honeypot_trigger: '🍯',
    suspicious_pattern: '🔍',
    rate_limit_exceeded: '🛑',
  }[event.type]

  const message = {
    username: 'Security Monitor',
    icon_emoji: ':shield:',
    attachments: [
      {
        color,
        title: `${emoji} Security Alert: ${event.type.replace(/_/g, ' ').toUpperCase()}`,
        fields: [
          {
            title: 'Severity',
            value: event.severity,
            short: true,
          },
          {
            title: 'Actor',
            value: event.actor,
            short: true,
          },
          ...(event.target ? [{
            title: 'Target',
            value: event.target,
            short: true,
          }] : []),
          {
            title: 'Timestamp',
            value: new Date(event.timestamp).toLocaleString('ko-KR'),
            short: true,
          },
          {
            title: 'Details',
            value: '```' + JSON.stringify(event.details, null, 2) + '```',
            short: false,
          },
        ],
        footer: 'Adam Security Monitor',
        ts: Math.floor(event.timestamp.getTime() / 1000),
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error('[security] Slack alert failed:', response.status)
    }
  } catch (e) {
    console.error('[security] Slack alert error:', e)
  }
}

/**
 * 이상 행동 패턴 감지
 */
export async function detectAnomalies(
  identifier: string,
  eventType: string,
  threshold: number,
  windowSeconds: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()

  // 최근 이벤트 조회
  const { data: events } = await supabase
    .from('audit_logs')
    .select('id')
    .eq('action', eventType)
    .or(`actor_email.eq.${identifier},ip_address.eq.${identifier}`)
    .gte('created_at', since)

  return (events?.length || 0) >= threshold
}

/**
 * IP 주소 차단 (Vercel Edge Config)
 *
 * 실제 차단은 middleware.ts에서 처리
 * 여기서는 차단 목록에 추가만 함
 */
export async function blockIP(ip: string, reason: string) {
  // Supabase에 차단 목록 저장
  await supabase.from('blocked_ips').insert({
    ip_address: ip,
    reason,
    blocked_at: new Date().toISOString(),
  })

  // 보안 이벤트 기록
  await logSecurityEvent({
    type: 'suspicious_pattern',
    severity: 'CRITICAL',
    actor: ip,
    details: { action: 'ip_blocked', reason },
    timestamp: new Date(),
  })

  console.log(`[security] IP blocked: ${ip} (${reason})`)
}

/**
 * 실시간 위협 분석
 *
 * @example
 * ```typescript
 * await analyzeThreat({
 *   actor: req.headers.get('x-forwarded-for'),
 *   action: 'analyze_request',
 *   metadata: { count: 10 }
 * })
 * ```
 */
export async function analyzeThreat(params: {
  actor: string
  action: string
  metadata?: Record<string, unknown>
}): Promise<{ threat: boolean; reason?: string }> {
  const { actor, action, metadata } = params

  // 1. Rate limit 초과 체크
  if (action === 'analyze_request') {
    const isRapid = await detectAnomalies(actor, 'resume_analysis', 20, 60)
    if (isRapid) {
      await logSecurityEvent({
        type: 'rapid_requests',
        severity: 'HIGH',
        actor,
        details: { action, ...metadata },
        timestamp: new Date(),
      })
      return { threat: true, reason: 'Too many requests in short time' }
    }
  }

  // 2. 인증 실패 반복
  if (action === 'auth_failed') {
    const isAttack = await detectAnomalies(actor, 'auth_failed', 5, 300)
    if (isAttack) {
      await blockIP(actor, 'Brute force attack detected')
      return { threat: true, reason: 'Repeated authentication failures' }
    }
  }

  // 3. 권한 상승 시도
  if (action === 'privilege_escalation') {
    await logSecurityEvent({
      type: 'privilege_escalation',
      severity: 'CRITICAL',
      actor,
      details: { ...metadata },
      timestamp: new Date(),
    })
    await blockIP(actor, 'Privilege escalation attempt')
    return { threat: true, reason: 'Unauthorized privilege escalation' }
  }

  return { threat: false }
}
