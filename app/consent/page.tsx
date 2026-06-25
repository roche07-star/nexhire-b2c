'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import './consent.css'

function ConsentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [consents, setConsents] = useState({
    privacyRequired: false,
    headhunterSharing: false
  })
  const [showHeadhunterDetails, setShowHeadhunterDetails] = useState(false)

  useEffect(() => {
    // 이미 동의했는지 확인
    checkExistingConsent()
  }, [])

  async function checkExistingConsent() {
    try {
      const res = await fetch('/api/consents/check')
      if (res.ok) {
        const data = await res.json()
        if (data.hasConsent) {
          // 이미 동의한 경우 메인으로 리다이렉트
          const callbackUrl = searchParams.get('callbackUrl') || '/analyze'
          router.push(callbackUrl)
        }
      }
    } catch (e) {
      console.error('동의 확인 실패:', e)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!consents.privacyRequired) {
      setError('필수 개인정보 수집·이용에 동의해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/consents/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacyRequired: consents.privacyRequired,
          headhunterSharing: consents.headhunterSharing
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '동의 처리 실패')
      }

      // 동의 완료 후 리다이렉트 (세션 갱신을 위해 강제 새로고침)
      const callbackUrl = searchParams.get('callbackUrl') || '/analyze'
      window.location.href = callbackUrl

    } catch (err: any) {
      console.error(err)
      setError(err.message || '동의 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="consent-page">
      <div className="consent-container">
        <div className="consent-header">
          <div className="logo">JOBIZIC</div>
          <h1>개인정보 수집·이용 동의</h1>
          <p className="subtitle">
            JOBIZIC 서비스 이용을 위해 아래 내용을 확인하고 동의해주세요
          </p>
        </div>

        {error && (
          <div className="consent-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="consent-form">
          {/* 필수 동의 */}
          <div className="consent-section">
            <div className="section-header required">
              <h2>개인정보 수집·이용 동의 (필수)</h2>
              <span className="required-badge">필수</span>
            </div>

            <div className="consent-content">
              <div className="info-row">
                <div className="info-label">수집·이용 목적</div>
                <div className="info-value">
                  회원 가입 및 관리, 본인 확인, 헤드헌팅 매칭 및 채용 포지션 추천 서비스 제공,
                  서비스 운영 관련 안내/고지
                </div>
              </div>

              <div className="info-row">
                <div className="info-label">수집 항목</div>
                <div className="info-value">
                  <strong>이름, 전화번호, 이메일</strong>
                  <div className="info-sub">
                    ※ 경력/학력/자격 등 이력 정보는 서비스 이용 시 별도로 수집됩니다.
                  </div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-label">보유·이용 기간</div>
                <div className="info-value">
                  <p>회원 탈퇴 또는 동의 철회 시까지 보유합니다.</p>
                  <div className="info-sub">
                    다만, 최종 서비스 이용일로부터 <strong>2년간 미이용 시</strong> 만료 30일 전 사전 안내 후
                    분리보관 또는 파기하며, 관계 법령에 따라 별도의 보존 의무가 있는 경우
                    해당 법령에서 정한 기간 동안 보관 후 파기합니다.
                  </div>
                </div>
              </div>

              <div className="consent-notice">
                <p className="notice-title">⚠️ 동의 거부권 안내</p>
                <p className="notice-text">
                  귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
                  다만 필수 항목에 대한 동의를 거부하실 경우 <strong>회원 가입 및 서비스 이용이 제한</strong>될 수 있습니다.
                </p>
              </div>
            </div>

            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={consents.privacyRequired}
                onChange={(e) => setConsents({ ...consents, privacyRequired: e.target.checked })}
                required
              />
              <div className="checkbox-text">
                위 개인정보 수집·이용에 동의합니다. <strong className="required-mark">(필수)</strong>
              </div>
            </label>
          </div>

          {/* 헤드헌터 추천 서비스 동의 (선택) */}
          <div className="consent-section optional">
            <div className="section-header optional">
              <h2>💼 헤드헌터 추천 서비스 (선택)</h2>
              <span className="optional-badge">선택</span>
            </div>

            <div className="consent-content">
              <div className="service-benefits" style={{ marginBottom: '16px' }}>
                <p style={{ marginBottom: '12px', color: '#374151', lineHeight: '1.6' }}>
                  전문 헤드헌터가 귀하의 이력서를 검토하고 최적의 포지션을 추천해 드립니다.
                </p>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span>무료 커리어 상담</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span>숨은 포지션 추천</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span>연봉 협상 지원</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHeadhunterDetails(!showHeadhunterDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  padding: '8px 0',
                  fontSize: '14px',
                  textDecoration: 'underline'
                }}
              >
                {showHeadhunterDetails ? '상세 내용 숨기기 ▲' : '상세 내용 보기 ▼'}
              </button>

              {showHeadhunterDetails && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.8'
                }}>
                  <div className="info-row">
                    <div className="info-label">공유 정보</div>
                    <div className="info-value">
                      이름, 이메일, 이력서 분석 결과 (경력, 스킬, 학력 등)
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">이용 목적</div>
                    <div className="info-value">
                      채용 제안 및 커리어 상담
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">보유·이용 기간</div>
                    <div className="info-value">
                      1년 (설정에서 언제든 철회 가능)
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">수신자</div>
                    <div className="info-value">
                      NexHire 협력 헤드헌터
                    </div>
                  </div>
                </div>
              )}

              <div className="consent-notice" style={{ marginTop: '16px' }}>
                <p className="notice-title">💡 동의 거부권 안내</p>
                <p className="notice-text">
                  헤드헌터 추천 서비스는 선택사항이며, 동의하지 않아도 서비스 이용이 가능합니다.
                  설정 &gt; 개인정보 및 공유에서 언제든지 동의를 철회할 수 있습니다.
                </p>
              </div>
            </div>

            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={consents.headhunterSharing}
                onChange={(e) => setConsents({ ...consents, headhunterSharing: e.target.checked })}
              />
              <div className="checkbox-text">
                헤드헌터 추천 서비스 이용에 동의합니다. (선택)
              </div>
            </label>
          </div>

          {/* 제출 버튼 */}
          <div className="consent-actions">
            <button
              type="submit"
              disabled={loading || !consents.privacyRequired}
              className="btn-consent-submit"
            >
              {loading ? '처리 중...' : '동의하고 시작하기'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="btn-consent-cancel"
              disabled={loading}
            >
              취소
            </button>
          </div>

          <div className="consent-footer">
            <p>
              개인정보 처리방침은 <a href="/privacy" target="_blank">여기</a>에서 확인하실 수 있습니다.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="consent-page">
        <div className="consent-container">
          <div className="consent-header">
            <div className="logo">JOBIZIC</div>
            <h1>개인정보 수집·이용 동의</h1>
            <p className="subtitle">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <ConsentPageContent />
    </Suspense>
  )
}
