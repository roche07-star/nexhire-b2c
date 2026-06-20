'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import UserTypeSelectionModal from './UserTypeSelectionModal'
import type { UserType } from '@/types/user'

/**
 * 사용자 유형 선택 가드
 *
 * - 로그인한 사용자 중 user_type이 NULL인 경우 모달 표시
 * - 공개 페이지(/login, /, /privacy, /terms 등)에서는 표시 안 함
 * - 선택 완료 후 페이지 새로고침 (세션 갱신)
 *
 * 작성자: 디아 (MIR Team)
 * 작성일: 2026-06-13
 */

const PUBLIC_PATHS = ['/', '/login', '/privacy', '/terms', '/licenses', '/consent']

export default function UserTypeGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // 로딩 중이거나 비로그인 상태면 패스
    if (status === 'loading' || status === 'unauthenticated') {
      setShowModal(false)
      return
    }

    // 공개 페이지면 패스
    if (PUBLIC_PATHS.includes(pathname)) {
      setShowModal(false)
      return
    }

    // 로그인 상태이고, user_type이 NULL이면 모달 표시
    if (session?.user && !session.user.userType) {
      console.log('[UserTypeGuard] User type not set, showing modal')
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [session, status, pathname])

  async function handleSelectUserType(userType: UserType) {
    try {
      const res = await fetch('/api/user/set-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '설정 실패')
      }

      const data = await res.json()
      console.log('[UserTypeGuard] User type set:', data)

      // 모달 닫기
      setShowModal(false)

      // INDIVIDUAL 선택 시 → 개인정보 동의 페이지로 이동
      if (userType === 'INDIVIDUAL') {
        console.log('[UserTypeGuard] Redirecting to consent page')
        router.push(`/consent?callbackUrl=${encodeURIComponent(pathname)}`)
      } else {
        // HEADHUNTER 선택 시 → 현재 페이지 새로고침
        console.log('[UserTypeGuard] Refreshing page for headhunter')
        router.refresh()
      }
    } catch (err: any) {
      console.error('[UserTypeGuard] Error:', err)
      throw err // 모달에서 처리
    }
  }

  // 모달이 표시될 때는 children 숨기기
  if (showModal) {
    return <UserTypeSelectionModal onSelect={handleSelectUserType} />
  }

  return <>{children}</>
}
