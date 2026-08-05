'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type Product } from '@/lib/products'
import * as PortOne from "@portone/browser-sdk/v2"

interface PaymentClientProps {
  product: Product
  userEmail: string
}

export default function PaymentClient({ product, userEmail }: PaymentClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAgreed, setTermsAgreed] = useState(false)

  // 디버깅: 모바일 감지 (userAgent 우선 - 가로 모드 대응)
  const isMobile = typeof window !== 'undefined'
    ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : false

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

      // Step 2: PortOne V2 결제창 호출
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID!
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!

      // 모바일 감지
      const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      console.log('[PortOne V2 Payment] 결제 요청:', {
        storeId,
        channelKey,
        paymentId,
        orderName: product.name,
        totalAmount: product.price,
        mode: isMobile ? 'redirect' : 'popup'
      })

      const paymentOptions: any = {
        storeId,
        channelKey,
        paymentId,  // 서버에서 생성된 paymentId 사용 (28자)
        orderName: product.name,
        totalAmount: product.price,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          email: userEmail,
        },
      }

      // 모바일: 리다이렉트 모드 (전체 페이지 이동, 팝업 없음)
      // 데스크톱: 팝업 모드 (작은 팝업)
      if (isMobile) {
        paymentOptions.redirectUrl = `${window.location.origin}/payment/success?paymentId=${encodeURIComponent(paymentId)}&orderId=${encodeURIComponent(orderId)}`
      }

      console.log('[Payment] 결제 옵션:', { isMobile, hasRedirectUrl: !!paymentOptions.redirectUrl })

      // 모바일 디버깅용 (테스트 후 제거)
      if (isMobile) {
        alert(`모바일 감지됨\nredirectUrl: ${paymentOptions.redirectUrl ? 'O' : 'X'}`)
      }

      const response = await PortOne.requestPayment(paymentOptions)

      // 모바일 리다이렉트 모드: response 없음, success 페이지에서 처리
      if (isMobile) {
        // redirectUrl로 자동 이동됨
        return
      }

      // 데스크톱 팝업 모드: response 처리
      console.log('[PortOne V2 Payment] 결제 응답:', response)

      // 결제 취소/실패
      if (response?.code) {
        throw new Error(response.message || '결제가 취소되었습니다')
      }

      // Step 3: 결제 성공 - verify API 호출
      console.log('[PortOne V2 Payment] 결제 성공, verify 호출')

      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderId }),
      })

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json()
        throw new Error(errorData.error || '플랜 활성화 실패')
      }

      const verifyData = await verifyRes.json()
      console.log('[PortOne V2 Payment] verify 성공:', verifyData)

      // Step 4: 성공 - 대시보드로 이동
      alert(`✅ ${product.plan} 플랜이 활성화되었습니다!`)
      window.location.href = '/dashboard'

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
      {/* 디버그 정보 (모바일 감지 확인용 - 테스트 후 제거) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#ff0000',
        color: '#fff',
        padding: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 9999,
        textAlign: 'center'
      }}>
        🔍 디버그: 모바일={isMobile ? 'YES' : 'NO'} | 화면너비={typeof window !== 'undefined' ? window.innerWidth : 0}px
      </div>

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

        {/* Terms Agreement */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              style={{
                width: 20,
                height: 20,
                marginTop: 2,
                cursor: 'pointer',
                accentColor: '#22d3ee'
              }}
            />
            <div style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)'
            }}>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>
                서비스 이용약관 및 환불 정책에 동의합니다
              </span>
              <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
              <div style={{
                marginTop: 8,
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.7
              }}>
                • 구매 후 7일 이내, 서비스 사용 5회 미만 시 전액 환불 가능합니다.
                <br />
                • 디지털 콘텐츠 특성상, 서비스를 5회 이상 사용하신 경우 전자상거래법 제17조 제2항에 따라 환불이 제한됩니다.
                <br />
                • 자세한 내용은{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  style={{
                    color: '#22d3ee',
                    textDecoration: 'underline'
                  }}
                >
                  이용약관
                </Link>
                에서 확인하실 수 있습니다.
              </div>
            </div>
          </label>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing || !termsAgreed}
          style={{
            width: '100%',
            padding: '18px 32px',
            background: (isProcessing || !termsAgreed)
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 700,
            cursor: (isProcessing || !termsAgreed) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: 24,
            opacity: (isProcessing || !termsAgreed) ? 0.6 : 1
          }}
        >
          {isProcessing ? '결제 처리 중...' : !termsAgreed ? '약관에 동의해주세요' : `결제하기 ${isMobile ? '📱' : '💻'}`}
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
            <li>환불은 결제 후 7일 이내, 서비스 사용 5회 미만 시 전액 가능합니다</li>
            <li>문의사항은 roche@jobizic.com</li>
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
