'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function ResetWarningPopup() {
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)
  const [days, setDays] = useState(0)
  const [plan, setPlan] = useState<'PRO' | 'EXPERT'>('PRO')

  useEffect(() => {
    if (!session?.user?.email) return

    fetch('/api/my-info')
      .then((r) => r.json())
      .then((data) => {
        // PRO/EXPERT 플랜만 체크
        if (data.plan !== 'PRO' && data.plan !== 'EXPERT') return

        const resetAt = data.resetAt // "2026. 9. 10." 형식
        if (!resetAt) return

        // 한국어 날짜 파싱
        const parts = resetAt.replace(/\./g, '').trim().split(' ')
        if (parts.length !== 3) return

        const resetDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`)
        const now = new Date()
        const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays <= 3) {
          setDays(diffDays)
          setPlan(data.plan)
          setShowModal(true)
        }
      })
      .catch(() => {})
  }, [session?.user?.email])

  if (!showModal) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={() => setShowModal(false)}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>
            플랜 초기화가 {days}일 남았습니다!
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6' }}>
            {plan} 플랜의 사용 기간이 종료되면 FREE 플랜으로 자동 다운그레이드됩니다.<br />
            계속 이용하시려면 플랜을 갱신해 주세요.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setShowModal(false)
              window.location.href = '/plans'
            }}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            플랜 갱신하기
          </button>
          <button
            onClick={() => setShowModal(false)}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
