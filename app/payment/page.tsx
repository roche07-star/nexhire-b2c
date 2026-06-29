'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loadTossPayments } from '@tosspayments/payment-sdk'

export default function PaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const tossPaymentsRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const userType = session?.user?.userType

  // 가격 계산
  const getPriceInfo = () => {
    if (userType === 'HEADHUNTER') {
      return {
        original: 19900,
        discounted: 13930,
        name: 'NexHire PRO (헤드헌터)',
      }
    }
    return {
      original: 9900,
      discounted: 6930,
      name: 'NexHire PRO (구직자)',
    }
  }

  const priceInfo = getPriceInfo()

  useEffect(() => {
    // 세션 로딩 중이면 대기
    if (status === 'loading') {
      return
    }

    // 로그인 안 되어 있으면 로그인 페이지로
    if (status === 'unauthenticated') {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    // 로그인되어 있으면 결제 위젯 초기화
    if (status === 'authenticated' && session) {
      const initializePayment = async () => {
        try {
          const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
          if (!clientKey) {
            throw new Error('토스페이먼츠 클라이언트 키가 없습니다.')
          }

          const tossPayments = await loadTossPayments(clientKey)

          tossPaymentsRef.current = tossPayments

          setIsLoading(false)
        } catch (error) {
          console.error('토스페이먼츠 초기화 실패:', error)
          alert('결제 시스템을 불러오는데 실패했습니다.')
        }
      }

      initializePayment()
    }
  }, [status, session, router])

  const handlePayment = async () => {
    if (!tossPaymentsRef.current) return

    try {
      // orderId: 영문, 숫자, -, _ 만 허용 (6-64자)
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const orderId = `order_${timestamp}_${randomStr}`
      const orderName = priceInfo.name

      await tossPaymentsRef.current.requestPayment('카드', {
        amount: priceInfo.discounted,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: session?.user?.email,
        customerName: session?.user?.name || '고객',
      })
    } catch (error) {
      console.error('결제 요청 실패:', error)
      alert('결제 요청에 실패했습니다.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 32,
      }}>
        {/* 헤더 */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 8,
        }}>
          결제하기
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
          안전한 결제를 위해 토스페이먼츠를 사용합니다
        </p>

        {/* 주문 정보 */}
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{ color: 'var(--muted2)' }}>상품</span>
            <span style={{ fontWeight: 600 }}>{priceInfo.name}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{ color: 'var(--muted2)' }}>정가</span>
            <span style={{ textDecoration: 'line-through', color: 'var(--muted2)' }}>
              {priceInfo.original.toLocaleString()}원
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>결제 금액</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
              {priceInfo.discounted.toLocaleString()}원
            </span>
          </div>
          <div style={{
            marginTop: 8,
            padding: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: 13,
            color: '#ef4444',
            fontWeight: 600,
          }}>
            🎉 7월 한정 30% 할인 적용
          </div>
        </div>

        {/* 결제 위젯 */}
        <div id="payment-widget" style={{ marginBottom: 24 }} />

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 16,
            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 10,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '로딩 중...' : `${priceInfo.discounted.toLocaleString()}원 결제하기`}
        </button>

        {/* 안내 문구 */}
        <div style={{
          marginTop: 16,
          padding: 16,
          background: 'rgba(167, 139, 250, 0.1)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--muted2)',
          lineHeight: 1.6,
        }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text)' }}>
            📌 안내사항
          </div>
          • 결제 후 즉시 PRO 플랜이 활성화됩니다<br />
          • 환불은 결제 후 7일 이내 가능합니다<br />
          • 문의사항은 support@nexhire.com
        </div>
      </div>
    </div>
  )
}
