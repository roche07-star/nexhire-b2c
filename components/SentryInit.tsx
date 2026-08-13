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

      beforeSend(event) {
        console.log('[Sentry] Capturing event:', event.exception?.values?.[0]?.type)
        return event
      },

      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    })

    console.log('[Sentry] Initialized successfully')
    if (typeof window !== 'undefined') {
      ;(window as any).Sentry = Sentry
    }
  }, [])

  return null
}
