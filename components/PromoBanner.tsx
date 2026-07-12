'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PromoBanner() {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setMounted(true)
    // localStorage에서 닫힘 상태 확인
    const closed = localStorage.getItem('promo_banner_closed')
    if (closed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('promo_banner_closed', 'true')
  }

  // 마운트 전에는 항상 표시 (SSR 일치)
  if (!mounted) {
    return (
      <div className="promo-banner">
        <div className="promo-content">
          <span className="promo-text">
            ⚡ <strong>7월 한정 특가</strong> 3개월권 10% 할인
            <span className="promo-price">
              <span className="price-original">29,700원</span>
              <span className="price-arrow">→</span>
              <span className="price-sale">26,700원</span>
            </span>
          </span>
          <Link href="/plans" className="promo-cta">
            지금 시작하기 →
          </Link>
        </div>
        <button className="promo-close" aria-label="배너 닫기" style={{ opacity: 0, pointerEvents: 'none' }}>
          ✕
        </button>
      </div>
    )
  }

  if (!isVisible) return null

  return (
    <div className="promo-banner">
      <div className="promo-content">
        <span className="promo-text">
          ⚡ <strong>7월 한정 특가</strong> 3개월권 10% 할인
          <span className="promo-price">
            <span className="price-original">29,700원</span>
            <span className="price-arrow">→</span>
            <span className="price-sale">26,700원</span>
          </span>
        </span>
        <Link href="/plans" className="promo-cta">
          지금 시작하기 →
        </Link>
      </div>
      <button className="promo-close" onClick={handleClose} aria-label="배너 닫기">
        ✕
      </button>
    </div>
  )
}
