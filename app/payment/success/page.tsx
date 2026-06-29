'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId')
  const paymentKey = searchParams.get('paymentKey')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    if (!orderId || !paymentKey || !amount) {
      setError('결제 정보가 올바르지 않습니다.')
      setIsProcessing(false)
      return
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentKey, amount }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || '결제 승인 실패')
        }

        setIsProcessing(false)
      } catch (err: any) {
        console.error('결제 승인 오류:', err)
        setError(err.message || '결제 승인 중 오류가 발생했습니다.')
        setIsProcessing(false)
      }
    }

    confirmPayment()
  }, [session, orderId, paymentKey, amount, router])

  if (isProcessing) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            animation: 'spin 1s linear infinite',
          }}>
            ⏳
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            결제를 처리하고 있습니다...
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8 }}>
            잠시만 기다려주세요
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{
          maxWidth: 500,
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            결제 실패
          </h1>
          <p style={{ color: 'var(--muted2)', marginBottom: 24 }}>
            {error}
          </p>
          <Link href="/payment">
            <button style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              다시 시도하기
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 500,
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          결제 완료!
        </h1>
        <p style={{ color: 'var(--muted2)', marginBottom: 32 }}>
          PRO 플랜이 활성화되었습니다
        </p>

        <div style={{
          background: 'var(--surface2)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{ color: 'var(--muted2)' }}>주문번호</span>
            <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{orderId}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: 'var(--muted2)' }}>결제금액</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
              {Number(amount).toLocaleString()}원
            </span>
          </div>
        </div>

        <Link href="/dashboard">
          <button style={{
            width: '100%',
            padding: 16,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            marginBottom: 12,
          }}>
            대시보드로 이동 →
          </button>
        </Link>

        <Link href="/">
          <button style={{
            width: '100%',
            padding: 12,
            background: 'transparent',
            color: 'var(--muted2)',
            fontSize: 14,
            borderRadius: 8,
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}>
            홈으로 이동
          </button>
        </Link>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>결제 처리 중...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
