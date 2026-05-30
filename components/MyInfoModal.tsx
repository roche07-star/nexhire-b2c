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
interface MyInfo {
  plan: string
  usage: Record<string, UsageItem>
  coupons: CouponItem[]
  resetAt: string | null
}

export default function MyInfoButton() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<MyInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [couponClaiming, setCouponClaiming] = useState(false)

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
                  <div className="my-info-label">플랜 · 이번 달 사용량</div>
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
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
