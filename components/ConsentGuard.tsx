'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * 개인정보 동의 체크 Guard
 *
 * - 로그인한 사용자가 동의하지 않은 경우 /consent로 리다이렉트
 * - /analyze 페이지에서 사용
 */

const PUBLIC_PATHS = ['/', '/login', '/consent', '/privacy', '/terms']

export default function ConsentGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    async function checkConsent() {
      // 방금 동의 완료한 경우 체크 건너뛰기 (무한 루프 방지)
      const justConsented = localStorage.getItem('just_consented')
      if (justConsented === 'true') {
        console.log('[ConsentGuard] Just consented, skipping check')
        localStorage.removeItem('just_consented') // 플래그 제거
        setHasConsent(true)
        setChecking(false)
        return
      }

      // 로딩 중이거나 비로그인 상태면 패스
      if (status === 'loading' || status === 'unauthenticated') {
        setChecking(false)
        return
      }

      // 공개 페이지면 패스
      if (PUBLIC_PATHS.includes(pathname)) {
        setChecking(false)
        setHasConsent(true)
        return
      }

      // 로그인 상태에서 동의 여부 확인
      if (session?.user?.email) {
        // MANAGER는 동의 절차 건너뛰기
        if (session.user.role === 'MANAGER') {
          setHasConsent(true)
          setChecking(false)
          return
        }

        // 세션에 hasConsent가 있으면 세션 사용 (신규 로그인)
        if (session.user.hasConsent !== undefined) {
          const hasUserType = !!session.user.userType
          const hasConsentFromSession = session.user.hasConsent

          if (hasConsentFromSession && hasUserType) {
            setHasConsent(true)
            setChecking(false)
          } else {
            router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
          }
        } else {
          // 세션에 hasConsent가 없으면 API 호출 (기존 로그인 유저 - fallback)
          try {
            const res = await fetch('/api/consents/check')

            if (res.ok) {
              const data = await res.json()

              if (data.hasConsent && data.hasUserType) {
                setHasConsent(true)
                setChecking(false)
              } else {
                router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
              }
            } else {
              router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
            }
          } catch (err) {
            console.error('[ConsentGuard] Error:', err)
            router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
          }
        }
      } else {
        setChecking(false)
      }
    }

    checkConsent()
  }, [session, status, pathname, router])

  // 체크 중이거나 동의하지 않은 경우 로딩 표시
  if (checking || (status === 'authenticated' && !hasConsent)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', fontSize: '48px' }}>⏳</div>
          <div>확인 중...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
