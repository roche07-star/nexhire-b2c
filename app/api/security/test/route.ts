import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { logSecurityEvent } from '@/lib/security'

/**
 * POST /api/security/test
 *
 * 보안 알림 테스트 (MANAGER 전용)
 *
 * Slack Webhook이 제대로 작동하는지 테스트
 */
export async function POST(req: NextRequest) {
  const session = await auth()

  // MANAGER만 테스트 가능
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { type = 'suspicious_pattern' } = await req.json()

  // 테스트 보안 이벤트 발생
  await logSecurityEvent({
    type: type as any,
    severity: 'HIGH',
    actor: session.user.email || 'test@example.com',
    details: {
      test: true,
      message: 'Security alert test from admin',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  })

  return NextResponse.json({
    success: true,
    message: 'Security alert sent. Check your Slack channel.',
  })
}
