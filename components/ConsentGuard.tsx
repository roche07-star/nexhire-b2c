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
        try {
          // user_type 확인 (헤드헌터는 동의 체크 스킵)
          const userType = (session.user as any).userType

          // user_type이 없거나 INDIVIDUAL인 경우만 동의 체크
          if (!userType) {
            // user_type이 아직 설정되지 않음 - UserTypeGuard가 먼저 처리하도록 통과
            setHasConsent(true)
            setChecking(false)
            return
          }

          if (userType === 'HEADHUNTER') {
            // 헤드헌터는 개인정보 동의 불필요
            setHasConsent(true)
            setChecking(false)
            return
          }

          // INDIVIDUAL인 경우 동의 체크
          const res = await fetch('/api/consents/check')

          if (res.ok) {
            const data = await res.json()

            if (data.hasConsent) {
              setHasConsent(true)
              setChecking(false)
            } else {
              // 동의하지 않은 경우 /consent로 리다이렉트
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
