'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import * as Sentry from '@sentry/nextjs'

/**
 * Sentry User Context 설정
 * SessionProvider 내부에서만 사용 가능
 */
export default function SentryUserContext() {
  const { data: session } = useSession()

  useEffect(() => {
    if (typeof window === 'undefined') return

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
