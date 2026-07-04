'use client'

import { useState } from 'react'

interface Product {
  id: string
  name: string
  nameEn: string
  price: number
  originalPrice?: number
  feature: 'storage' | 'resume' | 'jd' | 'rewrite' | 'proposal' | 'interview' | 'package'
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
    price: 9900,
    feature: 'resume',
    icon: '📄',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    description: [
      '✅ JOBIZIC 기반 이력서 종합 분석',
      '✅ 직무 적합도 점수 (3개 항목)',
      '✅ 커리어 경로 제안',
      '✅ 핵심 강점 & 개선점',
    ],
  },
  {
    id: '1-1',
    name: '💾 이력서 추가 저장',
    nameEn: 'Extra Resume Storage',
    price: 10000,
    feature: 'storage',
    icon: '💾',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
    price: 4900,
    feature: 'jd',
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    description: [
      '✅ JD와 이력서 매칭 점수',
      '✅ 어필 전략 & 제안 포인트',
      '✅ 핵심 리스크 분석',
      '✅ 지원 추천 등급',
    ],
  },
  {
    id: '3',
    name: '면접 가이드',
    nameEn: 'Interview Guide',
    price: 14900,
    feature: 'interview',
    icon: '💬',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    description: [
      '✅ 맞춤형 답변 스크립트 (7개)',
      '✅ 회사/산업 분석',
      '✅ 핵심 리스크 & 대응 전략',
      '✅ 역질문 리스트 & 체크리스트',
    ],
  },
  {
    id: '4',
    name: '클라이언트 제안서',
    nameEn: 'Client Proposal',
    price: 19900,
    feature: 'proposal',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    description: [
      '✅ JOBIZIC 생성 후보자 제안서',
      '✅ 전문적인 HTML 리포트',
      '✅ 회사 맞춤형 어필 포인트',
      '✅ 즉시 클라이언트 전송 가능',
    ],
    badge: '헤드헌터 전용',
  },
  {
    id: '5',
    name: '🎁 올인원 패키지',
    nameEn: 'All-in-One Package',
    price: 39900,
    originalPrice: 49600,
    feature: 'package',
    icon: '🎁',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #fbbf24 25%, #60a5fa 50%, #f472b6 75%, #8b5cf6 100%)',
    description: [
      '✅ 전체 기능 1개월 무제한',
      '✅ 이력서 분석 무제한',
      '✅ JD 분석 무제한',
      '✅ 면접 가이드 무제한',
      '✅ 제안서 생성 무제한',
    ],
    badge: '40% 할인',
  },
]

interface Props {
  isManager: boolean
}

export default function StoreClient({ isManager }: Props) {
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  async function handlePurchase(product: Product) {
    if (!confirm(`${product.name}을(를) 구매하시겠습니까?\n(관리자 승인 후 쿠폰이 발급됩니다)`)) return

    setPurchasing(product.id)
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: product.feature })
      })
      const data = await res.json()

      if (res.ok) {
        alert(`✅ 구매 요청이 완료되었습니다!\n관리자 승인 후 쿠폰이 발급됩니다.`)
        setSelectedProduct(null)
      } else {
        alert(data.error || '구매 처리 중 오류가 발생했습니다.')
      }
    } catch (err) {
      alert('구매 처리 중 오류가 발생했습니다.')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <main className="store-page">
      <div className="store-container">
        <div className="store-header">
          <div className="store-header-content">
            <h1 className="store-title">STORE</h1>
            <p className="store-subtitle">JOBIZIC 커리어 부스터 팩</p>
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
                  disabled={purchasing === product.id}
                >
                  {purchasing === product.id ? '처리 중...' : '구매하기'}
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
                  <p>💡 현재는 무료 체험 기간입니다.</p>
                  <p>구매 요청 시 관리자가 쿠폰을 발급해드립니다.</p>
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
                  disabled={purchasing === selectedProduct.id}
                >
                  {purchasing === selectedProduct.id ? '처리 중...' : '구매하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
