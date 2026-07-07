'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import './consent.css'

function ConsentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userType, setUserType] = useState<'JOBSEEKER' | 'HEADHUNTER' | null>(null)
  const [consents, setConsents] = useState({
    privacyRequired: false,
    headhunterSharing: false,
    headhunterResponsibility: false // 헤드헌터 전용
  })
  const [showHeadhunterDetails, setShowHeadhunterDetails] = useState(false)
  const [showResponsibilityDetails, setShowResponsibilityDetails] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    // 이미 동의한 사용자인지 체크
    checkExistingConsent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkExistingConsent() {
    try {
      const res = await fetch('/api/consents/check')
      if (res.ok) {
        const data = await res.json()

        // userType이 이미 설정되어 있어도 자동으로 설정하지 않음
        // 사용자가 직접 선택하도록 함

        if (data.hasConsent && data.hasUserType) {
          // 이미 동의한 경우 callbackUrl로 리다이렉트
          const callbackUrl = searchParams.get('callbackUrl') || '/'
          router.push(callbackUrl)
        }
      }
    } catch (e) {
      console.error('동의 확인 실패:', e)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!userType) {
      setError('사용자 유형을 선택해주세요.')
      return
    }

    if (!consents.privacyRequired) {
      setError('필수 개인정보 수집·이용에 동의해주세요.')
      return
    }

    // 헤드헌터의 경우 책임 동의 필수
    if (userType === 'HEADHUNTER' && !consents.headhunterResponsibility) {
      setError('후보자 개인정보 처리 책임 동의는 필수입니다.')
      return
    }

    // 헤드헌터 공유 동의 시 전화번호 필수
    if (consents.headhunterSharing && !phone.trim()) {
      setError('헤드헌터 추천 서비스를 이용하려면 전화번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/consents/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          privacyRequired: consents.privacyRequired,
          headhunterSharing: userType === 'JOBSEEKER' ? consents.headhunterSharing : false,
          headhunterResponsibility: userType === 'HEADHUNTER' ? consents.headhunterResponsibility : false,
          phone: phone.trim() || null
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '동의 처리 실패')
      }

      // 동의 완료 후 리다이렉트 (세션 갱신을 위해 /api/after-login 경유)
      window.location.href = '/api/after-login'

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
          <h1>
            {!userType ? '환영합니다!' :
             userType === 'HEADHUNTER' ? '헤드헌터 회원가입' : '개인정보 수집·이용 동의'}
          </h1>
          <p className="subtitle">
            {!userType ? 'JOBIZIC을 어떻게 사용하실 계획인가요?' :
             userType === 'HEADHUNTER'
              ? '후보자 개인정보 처리 책임을 부담하는 헤드헌터 회원가입입니다'
              : 'JOBIZIC 서비스 이용을 위해 아래 내용을 확인하고 동의해주세요'
            }
          </p>
        </div>

        {error && (
          <div className="consent-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="consent-form">
          {/* 사용자 유형 선택 */}
          {!userType && (
            <div className="user-type-form">
              <div className="user-type-cards">
                {/* 개인 구직자 */}
                <button
                  type="button"
                  onClick={() => setUserType('JOBSEEKER')}
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
                </button>

                {/* 헤드헌터 */}
                <button
                  type="button"
                  onClick={() => setUserType('HEADHUNTER')}
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
                    <li>✓ 개인 구직자 모든 기능</li>
                    <li>✓ 후보자 분석 & 제안서</li>
                    <li>✓ 💰 정산 기능 (매출/수수료 관리)</li>
                    <li>✓ 채용 프로세스 관리</li>
                  </ul>
                </button>
              </div>

              <p className="user-type-help">
                💡 선택하시면 동의 화면으로 이동합니다
              </p>
            </div>
          )}

          {/* 필수 동의 - 개인 구직자용 */}
          {userType === 'JOBSEEKER' && (
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
              <div className="checkbox-text" style={{ color: '#18181b' }}>
                위 개인정보 수집·이용에 동의합니다. <strong className="required-mark">(필수)</strong>
              </div>
            </label>
          </div>
          )}

          {/* 필수 동의 - 헤드헌터용 */}
          {userType === 'HEADHUNTER' && (
          <div className="consent-section">
            <div className="section-header required">
              <h2>개인정보 수집·이용 동의 (필수)</h2>
              <span className="required-badge">필수</span>
            </div>

            <div className="consent-content">
              <div className="info-row">
                <div className="info-label">수집·이용 목적</div>
                <div className="info-value">
                  회원 가입 및 관리, 본인 확인, 헤드헌터 서비스 제공,
                  서비스 운영 관련 안내/고지
                </div>
              </div>

              <div className="info-row">
                <div className="info-label">수집 항목</div>
                <div className="info-value">
                  <strong>이름, 이메일, 전화번호</strong>
                  <div className="info-sub">
                    ※ 헤드헌터 본인의 정보만 수집되며, 후보자 정보는 별도 처리됩니다.
                  </div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-label">보유·이용 기간</div>
                <div className="info-value">
                  <p>회원 탈퇴 시까지 보유합니다.</p>
                  <div className="info-sub">
                    다만, 최종 서비스 이용일로부터 <strong>2년간 미이용 시</strong> 만료 30일 전 사전 안내 후
                    분리보관 또는 파기하며, 관계 법령에 따라 별도의 보존 의무가 있는 경우
                    해당 법령에서 정한 기간 동안 보관 후 파기합니다.
                  </div>
                </div>
              </div>

              <div className="consent-notice" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <p className="notice-title" style={{ color: '#991b1b' }}>⚠️ 동의 거부권 안내</p>
                <p className="notice-text" style={{ color: '#7f1d1d' }}>
                  귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
                  다만 필수 항목에 대한 동의를 거부하실 경우 <strong>헤드헌터 회원 가입 및 서비스 이용이 제한</strong>될 수 있습니다.
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
              <div className="checkbox-text" style={{ color: '#18181b' }}>
                위 개인정보 수집·이용에 동의합니다. <strong className="required-mark">(필수)</strong>
              </div>
            </label>
          </div>
          )}

          {/* 헤드헌터 전용: 후보자 개인정보 처리 책임 동의 (필수) */}
          {userType === 'HEADHUNTER' && (
            <div className="consent-section">
              <div className="section-header required">
                <h2>🛡️ 후보자 개인정보 처리 책임 동의</h2>
                <span className="required-badge">필수</span>
              </div>

              <div className="consent-content">
                <div className="consent-notice" style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  marginBottom: '16px'
                }}>
                  <p className="notice-title" style={{ color: '#991b1b' }}>⚠️ 법적 책임 안내</p>
                  <p className="notice-text" style={{ color: '#7f1d1d' }}>
                    헤드헌터는 <strong>개인정보보호법상 "개인정보 수탁자"</strong>로서
                    후보자 정보 처리에 대한 법적 책임을 부담합니다.
                    <br />
                    위반 시 <strong>5년 이하 징역 또는 5천만원 이하 벌금</strong>에 처해질 수 있습니다.
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ marginBottom: '12px', fontWeight: 600, color: '#18181b' }}>다음 사항을 확인하고 동의합니다:</p>

                  <div style={{ display: 'grid', gap: '12px', fontSize: '14px', lineHeight: '1.8', color: '#18181b' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>1️⃣</span>
                      <div>
                        <strong>법적 책임:</strong> 본인은 개인정보보호법상 수탁자로서 후보자 정보 유출,
                        오용 시 형사처벌 및 과태료 대상이 될 수 있음을 인지합니다.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>2️⃣</span>
                      <div>
                        <strong>이용 목적 및 범위:</strong> 후보자 정보는 채용 중개 목적으로만 이용하며,
                        마케팅, 영업, 제3자 제공 등 목적 외 사용을 금지합니다.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>3️⃣</span>
                      <div>
                        <strong>보안 의무:</strong> 후보자 정보를 안전하게 관리하고 무단 접근을 방지하며,
                        타인과 계정을 공유하거나 정보를 재위탁하지 않습니다.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>4️⃣</span>
                      <div>
                        <strong>후보자 권리 보장:</strong> 후보자의 열람, 정정, 삭제 요구에 적극 협조하며,
                        후보자가 동의 철회 시 즉시 정보를 파기합니다.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>5️⃣</span>
                      <div>
                        <strong>서비스 탈퇴 시:</strong> 모든 후보자 정보를 즉시 파기합니다.
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResponsibilityDetails(!showResponsibilityDetails)}
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
                  {showResponsibilityDetails ? '법적 근거 숨기기 ▲' : '법적 근거 보기 ▼'}
                </button>

                {showResponsibilityDetails && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.8',
                    color: '#18181b'
                  }}>
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>관련 법령:</p>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li>개인정보 보호법 제17조 (개인정보의 제공)</li>
                      <li>개인정보 보호법 제26조 (업무위탁에 따른 개인정보의 처리 제한)</li>
                      <li>개인정보 보호법 제71조 (벌칙)</li>
                    </ul>
                    <p style={{ marginTop: '12px', color: '#6b7280' }}>
                      💡 Jobizic은 <strong>개인정보 처리자</strong>(Controller)이며,
                      헤드헌터는 <strong>개인정보 수탁자</strong>(Processor)입니다.
                    </p>
                  </div>
                )}
              </div>

              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={consents.headhunterResponsibility}
                  onChange={(e) => setConsents({ ...consents, headhunterResponsibility: e.target.checked })}
                  required={userType === 'HEADHUNTER'}
                />
                <div className="checkbox-text" style={{ color: '#18181b' }}>
                  위 후보자 개인정보 처리 책임을 확인하고 동의합니다.
                  <strong className="required-mark" style={{ color: '#ef4444' }}> (필수)</strong>
                </div>
              </label>
            </div>
          )}

          {/* 개인 구직자 전용: 헤드헌터 추천 서비스 동의 (선택) */}
          {userType === 'JOBSEEKER' && (
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
                    <span style={{ color: '#18181b' }}>무료 커리어 상담</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span style={{ color: '#18181b' }}>숨은 포지션 추천</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span style={{ color: '#18181b' }}>연봉 협상 지원</span>
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
                      <strong>Jobizic 플랫폼에 등록된 모든 헤드헌터</strong>
                      <div className="info-sub" style={{ marginTop: '8px', color: '#ef4444' }}>
                        ⚠️ <strong>중요:</strong> 귀하의 정보는 Jobizic에 가입한 모든 헤드헌터 회원에게 공유됩니다.
                        특정 헤드헌터만 선택할 수 없으며, 동의 시 전체 공개됩니다.
                      </div>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">헤드헌터 책임</div>
                    <div className="info-value">
                      헤드헌터는 <strong>개인정보보호법상 수탁자</strong>로서 다음을 보장합니다:
                      <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
                        <li>채용 중개 목적으로만 이용</li>
                        <li>제3자 제공 및 목적 외 사용 금지</li>
                        <li>보안 유지 의무 (유출 시 형사처벌 대상)</li>
                      </ul>
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
              <div className="checkbox-text" style={{ color: '#18181b' }}>
                헤드헌터 추천 서비스 이용에 동의합니다. (선택)
              </div>
            </label>

            {/* 헤드헌터 공유 동의 시 전화번호 입력 */}
            {consents.headhunterSharing && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#1e40af' }}>
                  📞 연락처 정보
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    전화번호 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="coupon-input"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
          )}

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
