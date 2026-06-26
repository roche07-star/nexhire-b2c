'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { UserType } from '@/types/user'
import './user-type-modal.css'

interface Props {
  onSelect: (userType: UserType) => Promise<void>
}

export default function UserTypeSelectionModal({ onSelect }: Props) {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  async function handleSelect(userType: UserType) {
    setLoading(true)
    try {
      await onSelect(userType)
    } catch (err) {
      console.error('User type selection error:', err)
      alert('설정 중 오류가 발생했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="user-type-page">
      <div className="user-type-container">
        {/* 헤더 (동의 페이지 스타일) */}
        <div className="user-type-header">
          <div className="logo">JOBIZIC</div>
          <h1>환영합니다!</h1>
          <p className="subtitle">
            JOBIZIC을 어떻게 사용하실 계획인가요?
          </p>
        </div>

        {loading && (
          <div className="user-type-loading">
            설정 중...
          </div>
        )}

        {!loading && (
          <div className="user-type-form">
            {/* 안내 */}
            <div className="user-type-notice">
              <p className="notice-title">⚠️ 선택 시 유의사항</p>
              <p className="notice-text">
                선택한 유형은 <strong>변경할 수 없으니</strong> 신중히 선택해주세요.
                선택한 유형에 따라 맞춤형 기능과 UI가 제공됩니다.
              </p>
            </div>

            {/* 선택 카드 */}
            <div className="user-type-cards">
              {/* 개인 구직자 */}
              <button
                onClick={() => handleSelect('JOBSEEKER')}
                className="user-type-card"
              >
                <div className="card-header">
                  <span className="card-icon">🎯</span>
                  <div>
                    <h3 className="card-title">개인 구직자</h3>
                    <p className="card-subtitle">내 이력서 분석 & 취업 준비</p>
                  </div>
                </div>

                <ul className="card-features">
                  <li>✓ 내 이력서 강점/약점 분석</li>
                  <li>✓ 채용공고 적합도 자동 매칭</li>
                  <li>✓ 면접 준비 & 자소서 가이드</li>
                  <li>✓ 추천 커리어 경로 제시</li>
                </ul>

                <div className="card-footer">
                  <strong>PRO 플랜:</strong> 월 9,900원 (30회)
                </div>
              </button>

              {/* 헤드헌터 */}
              <button
                onClick={() => handleSelect('HEADHUNTER')}
                className="user-type-card"
              >
                <div className="card-header">
                  <span className="card-icon">💼</span>
                  <div>
                    <h3 className="card-title">헤드헌터</h3>
                    <p className="card-subtitle">후보자 분석 & 클라이언트 제안</p>
                  </div>
                </div>

                <ul className="card-features">
                  <li>✓ 후보자 이력서 대량 분석</li>
                  <li>✓ JD 매칭 & 클라이언트 리포트</li>
                  <li>✓ 분석 결과 공유 & 프레젠테이션</li>
                  <li>✓ 채용 프로세스 관리</li>
                </ul>

                <div className="card-footer">
                  <strong>PRO 플랜:</strong> 월 19,900원 (100회)
                </div>
              </button>
            </div>

            {/* 안내 문구 */}
            <p className="user-type-help">
              💡 선택하시면 바로 시작됩니다
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
