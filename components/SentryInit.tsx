'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function SentryInit() {
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

  return null
}
