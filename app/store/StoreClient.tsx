'use client'

import { useState, useEffect } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import * as PortOne from "@portone/browser-sdk/v2"
import type { PaymentGateway } from '@/lib/payment-gateway'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  originalPrice?: number
  feature: 'storage' | 'analyze' | 'resume' | 'jd' | 'jd_analysis' | 'jd_match' | 'rewrite' | 'proposal' | 'interview' | 'package'
  icon: string
  gradient: string
  description: string[]
  badge?: string
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: '이력서 분석',
    nameEn: 'Resume Analysis',
    price: 1900,
    originalPrice: 2900,
    feature: 'analyze',  // ✅ 플랜 사용량 키와 일치
    icon: '📄',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    description: [
      '✅ AI 기반 이력서 종합 분석',
      '✅ 직무 적합도/경쟁력/성장성 점수',
      '✅ 커리어 경로 3가지 제안',
      '✅ 강점/개선점 상세 피드백',
    ],
    badge: '🔥 할인',
  },
  {
    id: '1-1',
    name: '📁 추가 저장 Slot',
    nameEn: 'Extra Resume Storage',
    price: 12900,
    feature: 'storage',
    icon: '📁',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    description: [
      '✅ 이력서 1개 추가 저장 Slot',
      '✅ 여러 버전 관리로 전략적 지원',
      '✅ JD별 맞춤 이력서 생성 활용',
      '✅ 영구 사용 (1회 구매로 계속)',
    ],
    badge: 'NEW',
  },
  {
    id: '2',
    name: 'JD 적합도 분석',
    nameEn: 'Job Description Match',
    price: 2900,
    feature: 'jd_match',
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    description: [
      '✅ JD 매칭 점수 (0-100점)',
      '✅ 회사 정보 자동 검색 & 분석',
      '✅ 매칭 강점/부족한 점/어필 전략',
      '✅ 지원 추천 등급 (APPLY/CONSIDER/SKIP)',
    ],
  },
  {
    id: '2-1',
    name: 'JD 분석',
    nameEn: 'Job Description Analysis',
    price: 1900,
    originalPrice: 2900,
    feature: 'jd_analysis',
    icon: '📋',
    gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
    description: [
      '✅ AI 기반 JD 종합 분석',
      '✅ 직무/요구사항/우대사항 정리',
      '✅ 핵심 키워드 & 필수 역량 추출',
      '✅ 예상 연봉/복지/성장성 분석',
    ],
    badge: '🔥 할인',
  },
  {
    id: '3',
    name: '이력서 생성',
    nameEn: 'Resume Rewrite',
    price: 4900,
    feature: 'rewrite',
    icon: '✏️',
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    description: [
      '✅ AI 기반 이력서 자동 생성',
      '✅ 매칭 강점 부각 & 약점 보완',
      '✅ 전문적인 레이아웃 디자인',
      '✅ 이력서 파일 다운로드',
    ],
  },
  {
    id: '4',
    name: '면접 가이드',
    nameEn: 'Interview Guide',
    price: 11900,
    feature: 'interview',
    icon: '💬',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    description: [
      '✅ 예상 질문 15개 이상 + 모범 답변',
      '✅ 역질문 3-5가지 제시',
      '✅ 회사/JD 적합도 분석 & 핵심 포인트',
      '✅ 면접 준비 체크리스트',
    ],
  },
  {
    id: '5',
    name: '클라이언트 제안서',
    nameEn: 'Client Proposal',
    price: 4900,
    feature: 'proposal',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    description: [
      '✅ AI 자동 생성 후보자 제안서',
      '✅ 후보자 강점/JD 적합도 분석',
      '✅ 채용 추천도 및 다음 단계 제안',
      '✅ 제안서 다운로드',
    ],
    badge: '헤드헌터 전용',
  },
  {
    id: '6',
    name: '🎁 올인원 패키지',
    nameEn: 'All-in-One Package',
    price: 39900,
    originalPrice: 49600,
    feature: 'package',
    icon: '🎁',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #fbbf24 25%, #60a5fa 50%, #f472b6 75%, #8b5cf6 100%)',
    description: [
      '✅ 전체 기능 최대 50회 제공',
      '✅ 이력서 분석 50회',
      '✅ JD 적합도 분석 50회',
      '✅ 이력서 생성 30회 (구직자) / 25회 (헤드헌터)',
      '✅ 면접 가이드 20회 (구직자) / 25회 (헤드헌터)',
      '✅ 제안서 생성 50회 (헤드헌터)',
    ],
    badge: '최대 40% 할인',
  },
]

interface Props {
  isManager: boolean
  userEmail: string | null
  userName: string | null
  userType: string | null
  paymentGateway: PaymentGateway
}

export default function StoreClient({ isManager, userEmail, userName, userType, paymentGateway }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 클라이언트에서만 모바일 감지
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  console.log('[StoreClient] Payment Gateway:', paymentGateway)

  async function handlePurchase(product: Product) {
    if (isProcessing) return

    if (!userEmail) {
      alert('로그인이 필요합니다.')
      window.location.href = '/login'
      return
    }

    setIsProcessing(true)
    setSelectedProduct(null)

    try {
      if (paymentGateway === 'TOSS') {
        // 토스페이먼츠 결제 흐름
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 없습니다.')
        }

        const tossPayments = await loadTossPayments(clientKey)

        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const orderId = `store_${product.feature}_${timestamp}_${randomStr}`

        await tossPayments.requestPayment('카드', {
          amount: product.price,
          orderId,
          orderName: product.name,
          successUrl: `${window.location.origin}/store/success`,
          failUrl: `${window.location.origin}/store/fail`,
          customerEmail: userEmail,
          customerName: userName || '고객',
        })
      } else {
        // PortOne V2 결제 흐름
        // Step 1: 서버에 결제 준비 요청
        const prepareRes = await fetch('/api/store/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            feature: product.feature,
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

        console.log('[Store PortOne V2 Payment] 결제 요청:', {
          storeId,
          channelKey,
          paymentId,
          orderName: product.name,
          totalAmount: product.price
        })

        // Step 3: PortOne 결제창 호출
        const paymentOptions: any = {
          storeId,
          channelKey,
          paymentId,
          orderName: product.name,
          totalAmount: product.price,
          currency: "CURRENCY_KRW",
          payMethod: "CARD",
          customer: {
            email: userEmail,
          },
        }

        // 모바일: 리다이렉트 모드
        if (isMobile) {
          paymentOptions.redirectUrl = `${window.location.origin}/store/success?paymentId=${encodeURIComponent(paymentId)}&orderId=${encodeURIComponent(orderId)}`
        }

        const response = await PortOne.requestPayment(paymentOptions)

        // 모바일 리다이렉트 모드: response 없음
        if (isMobile) {
          return
        }

        // 데스크톱 팝업 모드: response 처리
        console.log('[Store PortOne] 결제 응답:', response)

        // 결제 취소/실패
        if (response?.code) {
          throw new Error(response.message || '결제가 취소되었습니다')
        }

        // Step 4: 결제 성공 - 즉시 verify 호출
        console.log('[Store PortOne] 결제 성공, verify 호출')

        const verifyRes = await fetch('/api/store/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, orderId }),
        })

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json()
          throw new Error(errorData.error || '쿠폰 발급 실패')
        }

        const verifyData = await verifyRes.json()
        console.log('[Store PortOne] verify 성공:', verifyData)

        // Step 5: 성공 - /my-info로 이동
        alert('✅ 구매가 완료되었습니다!\n쿠폰이 발급되었습니다.')
        window.location.href = '/my-info'
      }

    } catch (err: any) {
      console.error('Payment error:', err)
      alert(err.message || '결제 처리 중 오류가 발생했습니다')
      setIsProcessing(false)
    }
  }

  // user_type 확인
  const isHeadhunter = userType === 'HEADHUNTER' || userType === 'MANAGER' || userType === 'SUPER_ADMIN'

  return (
    <main className="store-page zero-nav-spacing">
      <div className="store-container">
        <div className="store-header">
          <div className="store-header-content">
            <h1 className="store-title">STORE</h1>
            <p className="store-subtitle">
              {isHeadhunter ? (
                <>헤드헌터 전용 커리어 부스터 팩 <br className="mobile-only" />
                (쿠폰 유효기간: 3개월)</>
              ) : (
                <>JOBIZIC 프리미엄 분석 서비스</>
              )}
            </p>
            <p className="store-description">
              {isHeadhunter ? (
                <>헤드헌터의 업무 효율을 극대화할 <br className="mobile-only" />
                프리미엄 JOBIZIC 분석 서비스</>
              ) : (
                <>나에게 필요한 분석 기능만 선택하여 구매하세요</>
              )}
            </p>
          </div>
        </div>

        <div className="products-grid">
          {PRODUCTS
            .filter(product => {
              // 헤드헌터는 모든 상품, 구직자는 헤드헌터 전용 배지 없는 것만
              if (isHeadhunter) return true
              return !product.badge || product.badge !== '헤드헌터 전용'
            })
            .map(product => (
            <div key={product.id} className="product-card">
              <div
                className="product-image"
                style={{ background: product.gradient }}
              >
                <span className="product-icon">{product.icon}</span>
                {product.badge && (
                  <span className="product-badge">{product.badge}</span>
                )}
              </div>

              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-name-en">{product.nameEn}</p>

                <div className="product-price">
                  {product.originalPrice && (
                    <span className="price-original">₩{product.originalPrice.toLocaleString()}</span>
                  )}
                  <span className="price-current">₩{product.price.toLocaleString()}</span>
                </div>

                <ul className="product-features">
                  {product.description.map((desc, i) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ul>

                <button
                  className="btn-purchase"
                  onClick={() => setSelectedProduct(product)}
                  disabled={isManager || isProcessing}
                >
                  {isManager ? '관리자 계정은 구매 불가' : (isProcessing ? '처리 중...' : '구매하기')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 구매 확인 모달 */}
        {selectedProduct && (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedProduct.name}</h2>
                <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
              </div>

              <div
                className="modal-product-preview"
                style={{ background: selectedProduct.gradient }}
              >
                <span className="modal-product-icon">{selectedProduct.icon}</span>
              </div>

              <div className="modal-body">
                <div className="modal-price">
                  {selectedProduct.originalPrice && (
                    <span className="modal-price-original">₩{selectedProduct.originalPrice.toLocaleString()}</span>
                  )}
                  <span className="modal-price-current">₩{selectedProduct.price.toLocaleString()}</span>
                </div>

                <ul className="modal-features">
                  {selectedProduct.description.map((desc, i) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ul>

                <div className="modal-notice">
                  <p>
                    {paymentGateway === 'TOSS' ? '💳 토스페이먼츠 안전 결제' : '💳 NHN KCP 안전 결제'}
                  </p>
                  <p>결제 완료 후 즉시 쿠폰이 발급됩니다 (유효기간 3개월)</p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-modal-cancel"
                  onClick={() => setSelectedProduct(null)}
                >
                  취소
                </button>
                <button
                  className="btn-modal-confirm"
                  onClick={() => handlePurchase(selectedProduct)}
                  disabled={isProcessing}
                >
                  {isProcessing ? '처리 중...' : '결제하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
