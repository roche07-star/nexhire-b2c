'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type PaymentMode = 'TEST' | 'REAL'

interface PaymentGatewayInfo {
  mode: PaymentMode
  gateway: string
}

export default function PaymentGatewayClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [info, setInfo] = useState<PaymentGatewayInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchInfo()
    }
  }, [status, router])

  async function fetchInfo() {
    try {
      const res = await fetch('/api/admin/payment-gateway')
      if (res.status === 403) {
        alert('권한이 없습니다. SUPER_ADMIN 계정이 필요합니다.')
        router.push('/')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setInfo(data)
    } catch (error) {
      console.error('Failed to fetch payment gateway info:', error)
      alert('정보를 가져오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(newMode: PaymentMode) {
    if (!confirm(`정말 ${newMode === 'REAL' ? 'PortOne (실결제)' : '토스페이먼츠 (테스트)'}로 전환하시겠습니까?`)) {
      return
    }

    setSwitching(true)
    try {
      const res = await fetch('/api/admin/payment-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to switch mode')
      }

      const data = await res.json()
      alert(data.message)
      await fetchInfo()
    } catch (error: any) {
      console.error('Failed to switch mode:', error)
      alert(`전환 실패: ${error.message}`)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#e8e8de'
      }}>
        <div>로딩 중...</div>
      </div>
    )
  }

  if (!info) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e8e8de',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#e8ff47'
          }}>
            결제 게이트웨이 설정
          </h1>
          <p style={{ color: '#a8a29e', fontSize: '14px' }}>
            SUPER_ADMIN 전용 · 실시간 결제 시스템 전환
          </p>
        </div>

        {/* 현재 상태 */}
        <div style={{
          background: info.mode === 'REAL' ? '#10b981' : '#f59e0b',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px',
          border: '2px solid',
          borderColor: info.mode === 'REAL' ? '#34d399' : '#fbbf24'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1a1a14',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            현재 모드
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1a1a14',
            marginBottom: '12px'
          }}>
            {info.mode === 'REAL' ? '🟢 REAL (실결제)' : '🟡 TEST (테스트)'}
          </div>
          <div style={{
            fontSize: '16px',
            color: '#292524',
            fontWeight: 500
          }}>
            {info.gateway}
          </div>
        </div>

        {/* 상세 정보 */}
        <div style={{
          background: '#1a1a14',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #292524'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#e8ff47'
          }}>
            모드별 설정
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* TEST 모드 */}
            <div style={{
              padding: '16px',
              background: info.mode === 'TEST' ? '#292524' : '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: info.mode === 'TEST' ? '#fbbf24' : '#292524'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: info.mode === 'TEST' ? '#fbbf24' : '#78716c'
              }}>
                🟡 TEST 모드 (토스페이먼츠)
              </div>
              <div style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.6 }}>
                • 테스트 결제 전용 (실제 결제 X)<br />
                • 개발 및 QA 테스트용<br />
                • NHN KCP 심사 불가
              </div>
            </div>

            {/* REAL 모드 */}
            <div style={{
              padding: '16px',
              background: info.mode === 'REAL' ? '#292524' : '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: info.mode === 'REAL' ? '#34d399' : '#292524'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: info.mode === 'REAL' ? '#34d399' : '#78716c'
              }}>
                🟢 REAL 모드 (PortOne - NHN KCP)
              </div>
              <div style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.6 }}>
                • 실제 결제 처리 (실제 카드 결제됨)<br />
                • NHN KCP 카드사 연동<br />
                • NHN KCP 심사 가능
              </div>
            </div>
          </div>
        </div>

        {/* 전환 버튼 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {info.mode === 'TEST' && (
            <button
              onClick={() => handleSwitch('REAL')}
              disabled={switching}
              style={{
                flex: 1,
                padding: '16px',
                background: switching ? '#44403c' : '#10b981',
                color: '#1a1a14',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: switching ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {switching ? '전환 중...' : '🟢 REAL 모드로 전환 (PortOne)'}
            </button>
          )}

          {info.mode === 'REAL' && (
            <button
              onClick={() => handleSwitch('TEST')}
              disabled={switching}
              style={{
                flex: 1,
                padding: '16px',
                background: switching ? '#44403c' : '#f59e0b',
                color: '#1a1a14',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: switching ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {switching ? '전환 중...' : '🟡 TEST 모드로 전환 (토스페이먼츠)'}
            </button>
          )}

          <button
            onClick={() => router.push('/')}
            style={{
              padding: '16px 24px',
              background: '#292524',
              color: '#e8e8de',
              border: '1px solid #44403c',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            메인으로
          </button>
        </div>

        {/* 경고 메시지 */}
        <div style={{
          background: '#7c2d12',
          border: '1px solid #ea580c',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          color: '#fed7aa',
          lineHeight: 1.6
        }}>
          ⚠️ <strong>주의사항</strong><br />
          • REAL 모드에서는 실제 결제가 처리됩니다<br />
          • NHN KCP 카드사 심사 중에는 모드를 변경하지 마세요<br />
          • 모든 모드 전환은 감사 로그에 기록됩니다
        </div>
      </div>
    </div>
  )
}
