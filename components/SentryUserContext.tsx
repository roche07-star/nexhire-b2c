'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'

/**
 * Sentry User Context + Tags + Context 설정
 * SessionProvider 내부에서만 사용 가능
 */
export default function SentryUserContext() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [userInfo, setUserInfo] = useState<any>(null)

  // 사용자 상세 정보 가져오기 (플랜, 사용량 등)
  useEffect(() => {
    if (!session?.user?.email) return

    fetch('/api/my-info')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserInfo(data.user)
        }
      })
      .catch(err => console.error('[Sentry] Failed to fetch user info:', err))
  }, [session?.user?.email])

  // User Context + Tags + Context 설정
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (session?.user) {
      // 1. User 정보
      Sentry.setUser({
        id: session.user.email || 'unknown',
        email: session.user.email || undefined,
        username: session.user.name || undefined,
      })

      // 2. Tags (검색/필터 가능)
      const tags: Record<string, string> = {
        page: pathname || 'unknown',
      }

      if (userInfo) {
        tags.plan = userInfo.plan || 'FREE'
        tags.user_type = userInfo.user_type || 'JOBSEEKER'
        tags.status = userInfo.status || 'active'
      }

      Sentry.setTags(tags)

      // 3. Context (구조화된 데이터)
      if (userInfo) {
        Sentry.setContext('subscription', {
          plan: userInfo.plan,
          plan_end_date: userInfo.plan_end_date,
          user_type: userInfo.user_type,
          status: userInfo.status,
        })

        Sentry.setContext('usage', {
          analyze_count: userInfo.analyze_count || 0,
          jd_count: userInfo.jd_count || 0,
          rewrite_count: userInfo.rewrite_count || 0,
          interview_count: userInfo.interview_count || 0,
        })
      }

      console.log('[Sentry] ✅ User context set:', session.user.email, {
        plan: userInfo?.plan,
        user_type: userInfo?.user_type,
        page: pathname,
      })
    } else {
      Sentry.setUser(null)
      Sentry.setTags({})
      console.log('[Sentry] User context cleared')
    }
  }, [session, userInfo, pathname])

  return null
}
