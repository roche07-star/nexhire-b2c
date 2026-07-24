'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { type Product } from '@/lib/products'

// PortOne V1 (아임포트) 타입 선언
declare global {
  interface Window {
    IMP: any
  }
}

interface PaymentClientProps {
  product: Product
  userEmail: string
}

export default function PaymentClient({ product, userEmail }: PaymentClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [impLoaded, setImpLoaded] = useState(false)

  // PortOne V1 스크립트 로드
  useEffect(() => {
    const impCode = process.env.NEXT_PUBLIC_PORTONE_V1_IMP_CODE || 'imp54224231'

    if (window.IMP) {
      window.IMP.init(impCode)
      setImpLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/v1/iamport.js'
    script.async = true

    script.onload = () => {
      if (window.IMP) {
        window.IMP.init(impCode)
        setImpLoaded(true)
      }
    }

    document.body.appendChild(script)
  }, [])

  const handlePayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Step 1: 서버에 결제 준비 요청
      const prepareRes = await fetch('/api/payment/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          amount: product.price,
        })
      })

      if (!prepareRes.ok) {
        const errorData = await prepareRes.json()
        throw new Error(errorData.error || '결제 준비 실패')
      }

      const { paymentId, orderId } = await prepareRes.json()

      // Step 2: IMP 로드 확인
      if (!window.IMP) {
        throw new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침해주세요.')
      }

      // Step 3: PortOne V1 결제창 호출
      const siteCode = process.env.NEXT_PUBLIC_PORTONE_V1_SITE_CODE || 'AO09C'

      console.log('[Payment] IMP 결제 요청:', {
        pg: `kcp.${siteCode}`,
        merchant_uid: orderId,
        name: product.name,
        amount: product.price,
        buyer_email: userEmail
      })

      const response = await new Promise<any>((resolve, reject) => {
        window.IMP.request_pay(
          {
            pg: `kcp.${siteCode}`,
            pay_method: 'card',
            merchant_uid: orderId,
            name: product.name,
            amount: product.price,
            buyer_email: userEmail,
            m_redirect_url: `${window.location.origin}/payment/mobile-redirect`,
          },
          (response: any) => {
            if (response.success || response.imp_success) {
              resolve(response)
            } else {
              reject(new Error(response.error_msg || '결제가 취소되었습니다'))
            }
          }
        )
      })

      // Step 4: 서버에 결제 검증 요청
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: response.imp_uid || paymentId,
          orderId: response.merchant_uid || orderId,
        })
      })

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json()
        throw new Error(errorData.error || '결제 검증 실패')
      }

      // 결제 성공 → 완료 페이지로 이동
      window.location.href = `/payment/complete?orderId=${orderId}`

    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || '결제 처리 중 오류가 발생했습니다')
      setIsProcessing(false)
    }
  }

  return (
    <main style={{
      background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Content */}
      <section style={{
        padding: '140px 24px 80px',
        maxWidth: 600,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Back Link */}
        <Link
          href="/plans"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            marginBottom: 32,
            textDecoration: 'none',
            transition: 'color 0.3s'
          }}
        >
          ← 플랜 선택으로 돌아가기
        </Link>

        {/* Title */}
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: 8,
          letterSpacing: '-0.02em'
        }}>
          결제하기
        </h1>
        <p style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 48
        }}>
          안전한 결제 시스템으로 보호됩니다
        </p>

        {/* Product Summary Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 32
        }}>
          <div style={{
            fontSize: 12,
            color: '#22d3ee',
            fontWeight: 700,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            {product.userType === 'JOBSEEKER' ? '개인 구직자' : '헤드헌터'}
          </div>

          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 16
          }}>
            {product.plan} {product.duration}개월 이용권
          </div>

          {/* Features */}
          <div style={{
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            {product.features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 8,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.8)'
                }}
              >
                <span style={{ color: '#22d3ee' }}>✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8
          }}>
            <span style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.7)'
            }}>
              이용 기간
            </span>
            <span style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#ffffff'
            }}>
              {product.duration}개월
            </span>
          </div>

          {product.originalPrice && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 8
            }}>
              <span style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.7)'
              }}>
                정가
              </span>
              <span style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'line-through'
              }}>
                ₩{product.originalPrice.toLocaleString()}
              </span>
            </div>
          )}

          {product.discount && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 16
            }}>
              <span style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.7)'
              }}>
                할인
              </span>
              <span style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#fbbf24'
              }}>
                -{product.discount}%
              </span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#ffffff'
            }}>
              최종 결제 금액
            </span>
            <span style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#22d3ee'
            }}>
              ₩{product.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: 16,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            color: '#ef4444',
            fontSize: 14,
            marginBottom: 24
          }}>
            {error}
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '18px 32px',
            background: isProcessing
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 700,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: 24,
            opacity: isProcessing ? 0.6 : 1
          }}
        >
          {isProcessing ? '결제 처리 중...' : '결제하기'}
        </button>

        {/* Info */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 24
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 12
          }}>
            결제 안내
          </div>
          <ul style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.8,
            paddingLeft: 20,
            margin: 0
          }}>
            <li>결제는 NHN KCP를 통해 안전하게 처리됩니다</li>
            <li>결제 완료 후 즉시 이용권이 활성화됩니다</li>
            <li>이용권은 결제 시점부터 {product.duration}개월간 유효합니다</li>
            <li>구매 후 7일 이내, 5회 미만 사용 시 전액 환불 가능합니다</li>
          </ul>
        </div>

        {/* Security Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginTop: 32,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)'
        }}>
          <span>🔒</span>
          <span>SSL 보안 결제</span>
          <span>•</span>
          <span>서울보증보험 가입</span>
        </div>
      </section>
    </main>
  )
}
