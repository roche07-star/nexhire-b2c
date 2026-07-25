'use client'

import { useState, useEffect } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import type { PaymentGateway } from '@/lib/payment-gateway'

// PortOne V1 (아임포트) 타입 선언
declare global {
  interface Window {
    IMP: any
  }
}

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  originalPrice?: number
  feature: 'storage' | 'analyze' | 'resume' | 'jd' | 'rewrite' | 'proposal' | 'interview' | 'package'
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
    feature: 'analyze',  // 수정: 'resume' → 'analyze'
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
    name: '📁 이력서 추가 저장',
    nameEn: 'Extra Resume Storage',
    price: 12900,
    feature: 'storage',
    icon: '📁',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    description: [
      '✅ 이력서 1개 추가 저장 슬롯',
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
    feature: 'jd',
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
      '✅ HTML/PDF 다운로드',
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
      '✅ 회사/JD 분석 & 핵심 포인트',
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
      '✅ HTML/PDF 다운로드',
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
      '✅ JD 분석 50회',
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
  paymentGateway: PaymentGateway
}

export default function StoreClient({ isManager, userEmail, userName, paymentGateway }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [impLoaded, setImpLoaded] = useState(false)

  console.log('[StoreClient] Payment Gateway:', paymentGateway)

  // PortOne V1 (아임포트) 스크립트 로드
  useEffect(() => {
    const impCode = process.env.NEXT_PUBLIC_PORTONE_V1_IMP_CODE || 'imp54224231'

    // 이미 로드되었는지 확인
    if (window.IMP) {
      window.IMP.init(impCode)
      setImpLoaded(true)
      return
    }

    // 스크립트 로드
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

    return () => {
      // 클린업은 하지 않음 (다른 컴포넌트에서도 사용 가능)
    }
  }, [])

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
        // PortOne V1 결제 흐름
        // Step 0: IMP 로드 확인
        if (!window.IMP) {
          throw new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침해주세요.')
        }

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

        // Step 2: PortOne V1 결제창 호출 (Promise로 래핑)
        const siteCode = process.env.NEXT_PUBLIC_PORTONE_V1_SITE_CODE || 'AO09C'
        const response = await new Promise<any>((resolve, reject) => {
          window.IMP.request_pay(
            {
              pg: `kcp.${siteCode}`,
              pay_method: 'card',
              merchant_uid: orderId,
              name: product.name,
              amount: product.price,
              buyer_email: userEmail || '',
              buyer_name: userName || '고객',
              m_redirect_url: `${window.location.origin}/store/mobile-redirect`,
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

        // Step 3: 서버에 결제 검증 요청
        const verifyRes = await fetch('/api/store/verify', {
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
        window.location.href = `/store/success?orderId=${orderId}`
      }

    } catch (err: any) {
      console.error('Payment error:', err)
      alert(err.message || '결제 처리 중 오류가 발생했습니다')
      setIsProcessing(false)
    }
  }

  return (
    <main className="store-page">
      <div className="store-container">
        <div className="store-header">
          <div className="store-header-content">
            <h1 className="store-title">STORE</h1>
            <p className="store-subtitle">JOBIZIC 커리어 부스터 팩 (쿠폰 유효기간: 3개월)</p>
            <p className="store-description">
              당신의 커리어를 한 단계 업그레이드할 프리미엄 JOBIZIC 분석 서비스
            </p>
          </div>
        </div>

        <div className="products-grid">
          {PRODUCTS.map(product => (
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
