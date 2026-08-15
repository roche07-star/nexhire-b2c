'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function PlanResetWarning() {
  const { data: session } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    if (!session?.user?.email) return

    checkPlanReset()
  }, [session])

  async function checkPlanReset() {
    try {
      const res = await fetch('/api/user/plan-status')
      if (!res.ok) return

      const data = await res.json()

      // PRO/EXPERT 플랜이 아니면 체크 안 함
      if (!['PRO', 'EXPERT'].includes(data.plan)) return
      if (!data.monthly_reset_at) return

      const resetDate = new Date(data.monthly_reset_at)
      const now = new Date()
      const diffMs = resetDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      // 3일 이내인지 체크
      if (diffDays > 0 && diffDays <= 3) {
        // 오늘 이미 표시했는지 체크
        const today = new Date().toISOString().split('T')[0]
        const lastShown = localStorage.getItem('plan_warning_shown')

        if (lastShown !== today) {
          setDaysLeft(diffDays)
          setShowWarning(true)
          localStorage.setItem('plan_warning_shown', today)
        }
      }
    } catch (error) {
      console.error('[PlanResetWarning] Error:', error)
    }
  }

  if (!showWarning) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      maxWidth: 380,
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      border: '2px solid #d97706',
      borderRadius: 12,
      padding: '16px 20px',
      boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12
      }}>
        <span style={{ fontSize: 24 }}>⏰</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#78350f',
            marginBottom: 6
          }}>
            플랜 초기화 {daysLeft}일 남음
          </div>
          <div style={{
            fontSize: 13,
            color: '#92400e',
            lineHeight: 1.5,
            marginBottom: 12
          }}>
            사용 기간이 곧 종료됩니다. 계속 이용하시려면 플랜을 갱신해 주세요.
          </div>
          <div style={{
            display: 'flex',
            gap: 8
          }}>
            <Link
              href="/store"
              style={{
                padding: '8px 16px',
                background: '#78350f',
                color: '#fef3c7',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#92400e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#78350f'
              }}
            >
              플랜 갱신하기
            </Link>
            <button
              onClick={() => setShowWarning(false)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #92400e',
                color: '#92400e',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(146, 64, 14, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          div[style*="position: fixed"] {
            bottom: 10px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  )
}
