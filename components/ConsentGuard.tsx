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

        try {
          const res = await fetch('/api/consents/check')

          if (res.ok) {
            const data = await res.json()

            // hasConsent: 필수 동의 완료 여부
            // hasUserType: user_type 설정 여부
            if (data.hasConsent && data.hasUserType) {
              setHasConsent(true)
              setChecking(false)
            } else {
              // 동의하지 않았거나 user_type이 없는 경우 /consent로 리다이렉트
              router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
            }
          } else {
            // 에러 발생 시 안전하게 리다이렉트
            router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
          }
        } catch (err) {
          console.error('[ConsentGuard] Error:', err)
          router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
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
