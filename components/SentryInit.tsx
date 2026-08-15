'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import * as Sentry from '@sentry/nextjs'

export default function SentryInit() {
  const { data: session } = useSession()

  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('[Sentry] Initializing from component...')

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sampleRate: 1.0,

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      beforeSend(event) {
        console.log('[Sentry] Capturing event:', event.exception?.values?.[0]?.type)
        return event
      },

      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    })

    console.log('[Sentry] Initialized successfully')

    // 전역 에러 핸들러 등록
    window.addEventListener('error', (event) => {
      console.log('[Sentry] Global error caught:', event.error)
      Sentry.captureException(event.error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.log('[Sentry] Unhandled rejection:', event.reason)
      Sentry.captureException(event.reason)
    })

    if (typeof window !== 'undefined') {
      ;(window as any).Sentry = Sentry
    }
  }, [])

  // 🔑 User Context 설정 (로그인 시 Sentry에 user 정보 전송)
  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.email || 'unknown',
        email: session.user.email || undefined,
        username: session.user.name || undefined,
      })
      console.log('[Sentry] ✅ User context set:', session.user.email)
    } else {
      Sentry.setUser(null)
      console.log('[Sentry] User context cleared')
    }
  }, [session])

  return null
}
