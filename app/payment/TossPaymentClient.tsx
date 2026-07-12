'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import { type Product } from '@/lib/products'

interface TossPaymentClientProps {
  product: Product
  userEmail: string
}

function PaymentPageContent({ product, userEmail }: TossPaymentClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const tossPaymentsRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<string>('FREE')

  const userType = session?.user?.userType
  const plan = product.id // 'PRO' 또는 'EXPERT'

  // 플랜 비교
  const planHierarchy: Record<string, number> = { FREE: 0, PRO: 1, EXPERT: 2 }
  const isDowngrade = planHierarchy[currentPlan] > planHierarchy[product.plan]
  const isSamePlan = currentPlan === product.plan

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

    // 로그인되어 있으면 동의 여부 체크 후 결제 위젯 초기화
    if (status === 'authenticated' && session) {
      const checkConsentAndInitialize = async () => {
        try {
          // 1. 현재 플랜 조회
          const myInfoRes = await fetch('/api/my-info')
          const myInfoData = await myInfoRes.json()
          setCurrentPlan(myInfoData.plan || 'FREE')

          // 2. 동의 여부 확인
          const consentRes = await fetch('/api/consents/check')
          const consentData = await consentRes.json()

          // 동의 안 되어 있으면 동의 페이지로
          if (!consentData.hasConsent || !consentData.hasUserType) {
            router.push('/consent?callbackUrl=/payment')
            return
          }

          // 2. 동의 완료 → 결제 위젯 초기화
          const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
          if (!clientKey) {
            throw new Error('토스페이먼츠 클라이언트 키가 없습니다.')
          }

          const tossPayments = await loadTossPayments(clientKey)
          tossPaymentsRef.current = tossPayments
          setIsLoading(false)
        } catch (error) {
          console.error('초기화 실패:', error)
          alert('결제 시스템을 불러오는데 실패했습니다.')
        }
      }

      checkConsentAndInitialize()
    }
  }, [status, session, router])

  const handlePayment = async () => {
    if (!tossPaymentsRef.current) return

    try {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const orderId = `order_${product.id}_${timestamp}_${randomStr}`

      await tossPaymentsRef.current.requestPayment('카드', {
        amount: product.price,
        orderId,
        orderName: product.name,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: userEmail,
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
            <span style={{ fontWeight: 600 }}>{product.name}</span>
          </div>
          {product.originalPrice && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <span style={{ color: 'var(--muted2)' }}>정가</span>
              <span style={{ textDecoration: 'line-through', color: 'var(--muted2)' }}>
                {product.originalPrice.toLocaleString()}원
              </span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>결제 금액</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
              {product.price.toLocaleString()}원
            </span>
          </div>
          {product.discount && (
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
              🎉 {product.discount}% 할인 적용
            </div>
          )}
        </div>

        {/* 결제 위젯 */}
        <div id="payment-widget" style={{ marginBottom: 24 }} />

        {/* 현재 플랜 표시 */}
        {currentPlan !== 'FREE' && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: 'var(--surface2)',
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--muted2)',
          }}>
            현재 플랜: <strong style={{ color: 'var(--text)' }}>{currentPlan}</strong>
            {isSamePlan && ` → ${product.duration}개월 연장`}
            {isDowngrade && ' (다운그레이드는 설정에서 가능합니다)'}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={isLoading || isDowngrade}
          style={{
            width: '100%',
            padding: 16,
            background: (isLoading || isDowngrade) ? '#ccc' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 10,
            border: 'none',
            cursor: (isLoading || isDowngrade) ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '로딩 중...' :
           isDowngrade ? '다운그레이드 불가' :
           isSamePlan ? `${product.price.toLocaleString()}원 결제하기 (연장)` :
           `${product.price.toLocaleString()}원 결제하기`}
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
          • 환불은 결제 후 7일 이내 전액 가능합니다 (이유 불문)<br />
          • 환불 요청: <a href="/support" style={{ color: '#3b82f6', textDecoration: 'underline' }}>고객센터</a> (주문번호, 결제 이메일 필수)<br />
          • 처리 기간: 접수 후 1-2 영업일, 환불 완료까지 3-5 영업일<br />
          • 문의사항은 <a href="/support" style={{ color: '#3b82f6', textDecoration: 'underline' }}>고객센터</a>
        </div>
      </div>
    </div>
  )
}

export default function TossPaymentClient({ product, userEmail }: TossPaymentClientProps) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
      <PaymentPageContent product={product} userEmail={userEmail} />
    </Suspense>
  )
}
