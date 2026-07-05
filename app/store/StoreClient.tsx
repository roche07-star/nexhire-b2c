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
    price: 1000,
    feature: 'resume',
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
    price: 3900,
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
      '✅ JD 맞춤형 이력서 자동 생성',
      '✅ 매칭 강점 부각 & 약점 보완',
      '✅ 자기소개서 최적화',
      '✅ DOCX 파일 다운로드',
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
      '✅ 예상 질문 10개 + 모범 답변',
      '✅ 역질문 3가지 (역할/도전/기대)',
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
      '✅ 예상 질문 & 답변 포함',
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
      '✅ 이력서 생성 50회',
      '✅ 면접 가이드 15회 (구직자) / 25회 (헤드헌터)',
      '✅ 제안서 생성 50회 (헤드헌터)',
    ],
    badge: '최대 40% 할인',
  },
]

interface Props {
  isManager: boolean
}

export default function StoreClient({ isManager }: Props) {
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  async function handlePurchase(product: Product) {
    if (!confirm(`${product.name}을(를) 구매하시겠습니까?\n₩${product.price.toLocaleString()}`)) return

    setPurchasing(product.id)
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: product.feature })
      })
      const data = await res.json()

      if (res.ok) {
        alert(`✅ 구매가 완료되었습니다!\n\n내 정보 페이지에서 쿠폰을 확인하세요.\n쿠폰은 1년간 유효합니다.`)
        setSelectedProduct(null)
        // 페이지 새로고침으로 쿠폰 반영
        window.location.reload()
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
                  <p>💡 구매 즉시 쿠폰이 발급됩니다.</p>
                  <p>쿠폰 유효기간: 1년 (구매일로부터)</p>
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
