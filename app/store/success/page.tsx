'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const confirmPayment = async () => {
      const orderId = searchParams.get('orderId')
      const paymentKey = searchParams.get('paymentKey')
      const amount = searchParams.get('amount')

      console.log('[Store Success] 결제 확인 시작:', { orderId, paymentKey, amount })

      if (!orderId) {
        console.error('[Store Success] orderId 누락')
        setError('결제 정보가 올바르지 않습니다.')
        setIsProcessing(false)
        return
      }

      // PortOne 결제 (이미 verify에서 쿠폰 발급 완료)
      if (!paymentKey) {
        console.log('[Store Success] PortOne 결제 - 이미 처리 완료')
        setIsProcessing(false)
        return
      }

      // 토스페이먼츠 결제 - confirm 호출 필요
      if (!amount) {
        console.error('[Store Success] 토스페이먼츠인데 amount 누락:', { orderId, paymentKey, amount })
        setError('결제 정보가 올바르지 않습니다.')
        setIsProcessing(false)
        return
      }

      try {
        console.log('[Store Success] 토스페이먼츠 API 호출: /api/store/confirm')
        const res = await fetch('/api/store/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentKey, amount }),
        })

        console.log('[Store Success] API 응답 상태:', res.status)
        const data = await res.json()
        console.log('[Store Success] API 응답 데이터:', data)

        if (!res.ok) {
          console.error('[Store Success] API 오류:', data)
          setError(data.error || '결제 처리 중 오류가 발생했습니다.')
          setIsProcessing(false)
          return
        }

        console.log('[Store Success] 결제 확인 완료')
        setIsProcessing(false)
      } catch (err) {
        console.error('[Store Success] 결제 확인 오류:', err)
        setError('결제 처리 중 오류가 발생했습니다.')
        setIsProcessing(false)
      }
    }

    confirmPayment()
  }, [searchParams])

  if (isProcessing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60,
            height: 60,
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            결제를 처리하고 있습니다...
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8 }}>
            잠시만 기다려 주세요.
          </p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: 500,
          width: '100%',
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
        }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <span style={{ fontSize: 40 }}>❌</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            결제 처리 실패
          </h1>
          <p style={{ color: 'var(--muted2)', marginBottom: 32 }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/store" style={{ flex: 1 }}>
              <button style={{
                width: '100%',
                padding: 14,
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                스토어로 돌아가기
              </button>
            </Link>
            <Link href="/support" style={{ flex: 1 }}>
              <button style={{
                width: '100%',
                padding: 14,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                고객센터
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <span style={{ fontSize: 40 }}>✅</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          구매가 완료되었습니다!
        </h1>
        <p style={{ color: 'var(--muted2)', marginBottom: 32 }}>
          쿠폰이 발급되었습니다. 내 정보 페이지에서 확인하세요.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/my-info" style={{ flex: 1 }}>
            <button style={{
              width: '100%',
              padding: 14,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              내 정보 보기
            </button>
          </Link>
          <Link href="/analyze" style={{ flex: 1 }}>
            <button style={{
              width: '100%',
              padding: 14,
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              분석 시작하기
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function StoreSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        로딩 중...
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
