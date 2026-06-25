'use client'

import { useState } from 'react'

const FEATURE_LABEL: Record<string, string> = {
  resume: '이력서 분석', direction: '방향성 분석', jd: 'JD 분석', rewrite: '이력서 생성', interview: '면접 가이드',
}
const USAGE_LABEL: Record<string, string> = {
  analyze: '이력서 분석', jd: 'JD 분석', rewrite: '이력서 생성', interview: '면접 가이드',
}

interface CouponItem {
  id: string; code: string; feature: string
  status: 'active' | 'used' | 'expired'
  expires_at?: string | null; claimed_at?: string | null
}
interface UsageItem { used: number; limit: number }
interface ConsentInfo {
  required: { agreed: boolean; agreedAt: string | null }
  optional: { agreed: boolean; agreedAt: string | null }
}
interface MyInfo {
  plan: string
  usage: Record<string, UsageItem>
  coupons: CouponItem[]
  resetAt: string | null
  consents?: ConsentInfo
  userType?: string | null
  userTypeLabel?: string
  serviceType?: string
  serviceTypeLabel?: string
  headhunterSharing?: {
    enabled: boolean
    consentedAt: string | null
  }
}

export default function MyInfoButton() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<MyInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [couponClaiming, setCouponClaiming] = useState(false)
  const [headhunterToggling, setHeadhunterToggling] = useState(false)

  async function openModal() {
    setOpen(true)
    if (info) return
    setLoading(true)
    try {
      const res = await fetch('/api/my-info')
      const data = await res.json()
      setInfo(data)
    } finally {
      setLoading(false)
    }
  }

  async function claimCoupon() {
    if (!couponInput.trim()) return
    setCouponClaiming(true)
    setCouponMsg(null)
    try {
      const res = await fetch('/api/coupons/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setCouponMsg({ text: `등록 완료! (${FEATURE_LABEL[data.feature] ?? data.feature})`, ok: true })
        setCouponInput('')
        setInfo(null)   // 새로고침
        const res2 = await fetch('/api/my-info')
        setInfo(await res2.json())
      } else {
        setCouponMsg({ text: data.error ?? '오류가 발생했습니다.', ok: false })
      }
    } finally {
      setCouponClaiming(false)
    }
  }

  async function toggleHeadhunterSharing() {
    if (!info?.headhunterSharing) return
    const newValue = !info.headhunterSharing.enabled

    if (!newValue && !confirm('헤드헌터 추천 서비스를 중단하시겠습니까?\n\n이미 공유된 정보는 삭제됩니다.')) {
      return
    }

    setHeadhunterToggling(true)
    try {
      const res = await fetch('/api/settings/headhunter-sharing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      })

      if (res.ok) {
        // 정보 새로고침
        const res2 = await fetch('/api/my-info')
        setInfo(await res2.json())
      } else {
        const data = await res.json()
        alert(data.error ?? '설정 변경에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다.')
    } finally {
      setHeadhunterToggling(false)
    }
  }

  return (
    <>
      <button className="btn-ghost my-info-btn" onClick={openModal}>내 정보</button>

      {open && (
        <div className="my-info-overlay" onClick={() => setOpen(false)}>
          <div className="my-info-modal" onClick={e => e.stopPropagation()}>
            <div className="my-info-header">
              <span className="my-info-title">내 정보</span>
              <button className="withdraw-close" onClick={() => setOpen(false)}>×</button>
            </div>

            {loading ? (
              <div className="my-info-loading">불러오는 중...</div>
            ) : info && (
              <>
                {/* 플랜 + 잔여 횟수 */}
                <div className="my-info-section">
                  <div className="my-info-label">플랜, 이번 달 사용량</div>
                  <div className="my-info-plan-row">
                    <span className={`nav-plan-badge plan-${info.plan.toLowerCase()}`}>{info.plan}</span>
                    {info.resetAt && <span className="my-info-reset">다음 초기화: {info.resetAt}</span>}
                  </div>
                  <div className="my-info-usage-grid">
                    {Object.entries(info.usage).map(([key, u]) => {
                      if (u.limit === 0) return null
                      const pct = Math.min(100, Math.round((u.used / u.limit) * 100))
                      const cls = pct >= 100 ? 'full' : pct >= 70 ? 'warn' : ''
                      return (
                        <div key={key} className="my-info-usage-item">
                          <div className="my-info-usage-top">
                            <span className="my-info-usage-name">{USAGE_LABEL[key]}</span>
                            <span className={`my-info-usage-val ${cls}`}>{u.used}<span>/{u.limit}</span></span>
                          </div>
                          <div className="my-info-bar-wrap">
                            <div className={`my-info-bar ${cls}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 쿠폰 등록 */}
                <div className="my-info-section">
                  <div className="my-info-label">쿠폰 등록</div>
                  <div className="coupon-input-row">
                    <input
                      className="coupon-input"
                      placeholder="쿠폰 코드 입력 (예: NH-RS-XXXXXX)"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponMsg(null) }}
                      onKeyDown={e => e.key === 'Enter' && claimCoupon()}
                    />
                    <button className="coupon-claim-btn" onClick={claimCoupon} disabled={!couponInput.trim() || couponClaiming}>
                      {couponClaiming ? '등록 중...' : '등록'}
                    </button>
                  </div>
                  {couponMsg && (
                    <div className={`coupon-msg${couponMsg.ok ? ' ok' : ' err'}`}>{couponMsg.text}</div>
                  )}
                </div>

                {/* 쿠폰 현황 */}
                <div className="my-info-section">
                  <div className="my-info-label">내 쿠폰 현황</div>
                  {info.coupons.length === 0 ? (
                    <div className="my-info-empty">보유 쿠폰이 없습니다.</div>
                  ) : (
                    <div className="my-coupons-list">
                      {info.coupons.map(c => (
                        <div key={c.id} className="my-coupon-row">
                          <code className="my-coupon-code">{c.code}</code>
                          <span className="my-coupon-feature">{FEATURE_LABEL[c.feature] ?? c.feature}</span>
                          <span className={`my-coupon-status ${c.status}`}>
                            {c.status === 'used' ? '사용 완료' : c.status === 'expired' ? '만료' : '사용 가능'}
                          </span>
                          {c.expires_at && c.status === 'active' && (
                            <span className="my-coupon-expires">~{new Date(c.expires_at).toLocaleDateString('ko-KR')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 사용자 유형 */}
                {info.userType && (
                  <div className="my-info-section">
                    <div className="my-info-label">사용자 유형</div>
                    <div className="my-info-row">
                      <span className="my-info-value">{info.userTypeLabel ?? '미설정'}</span>
                    </div>
                  </div>
                )}

                {/* 개인정보 동의 현황 */}
                {info.consents && (
                  <div className="my-info-section">
                    <div className="my-info-label">개인정보 동의 현황</div>
                    <div className="my-info-row">
                      <span className="my-info-key">개인정보 동의</span>
                      <span className={`my-info-value ${info.consents.required.agreed ? 'text-green' : 'text-red'}`}>
                        {info.consents.required.agreed ? (
                          <>✅ 동의함 ({info.consents.required.agreedAt})</>
                        ) : (
                          <>❌ 미동의</>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* 헤드헌터 추천 서비스 */}
                {info.headhunterSharing && info.userType === 'INDIVIDUAL' && (
                  <div className="my-info-section">
                    <div className="my-info-label">💼 헤드헌터 추천 서비스</div>
                    <div className="my-info-row" style={{ alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                          전문 헤드헌터가 귀하의 이력서를 검토하고 최적의 포지션을 추천해 드립니다.
                        </div>
                        {info.headhunterSharing.enabled && info.headhunterSharing.consentedAt && (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            동의 일시: {info.headhunterSharing.consentedAt}
                          </div>
                        )}
                      </div>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px',
                        flexShrink: 0
                      }}>
                        <input
                          type="checkbox"
                          checked={info.headhunterSharing.enabled}
                          onChange={toggleHeadhunterSharing}
                          disabled={headhunterToggling}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: headhunterToggling ? 'not-allowed' : 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: info.headhunterSharing.enabled ? '#3b82f6' : '#d1d5db',
                          transition: '0.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px',
                            width: '18px',
                            left: info.headhunterSharing.enabled ? '26px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%'
                          }} />
                        </span>
                      </label>
                    </div>
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.6'
                    }}>
                      {info.headhunterSharing.enabled ? (
                        <>
                          ✅ <strong>활성화됨</strong> - 이력서 분석 시 자동으로 헤드헌터에게 공유됩니다.<br />
                          언제든지 비활성화할 수 있으며, 비활성화 시 공유된 정보는 삭제됩니다.
                        </>
                      ) : (
                        <>
                          ℹ️ <strong>비활성화됨</strong> - 헤드헌터 추천 서비스를 이용하려면 활성화하세요.
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
