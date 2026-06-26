'use client'

import { useState, useRef, useEffect } from 'react'

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
  const modalContentRef = useRef<HTMLDivElement>(null)

  // 모달 열릴 때 스크롤 맨 위로
  useEffect(() => {
    if (open && modalContentRef.current) {
      // 즉시 실행
      modalContentRef.current.scrollTop = 0
      // 렌더링 후에도 한번 더 실행
      setTimeout(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = 0
        }
      }, 0)
    }
  }, [open])

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
        setInfo(null)
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '400px 20px 20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setOpen(false)}
        >
          <div
            ref={modalContentRef}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 600,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#ffffff',
              zIndex: 1,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20
            }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#18181b',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                내 정보
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid #e4e4e7',
                  background: '#ffffff',
                  color: '#71717a',
                  fontSize: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 400,
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fafafa'
                  e.currentTarget.style.borderColor = '#d4d4d8'
                  e.currentTarget.style.color = '#18181b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.borderColor = '#e4e4e7'
                  e.currentTarget.style.color = '#71717a'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '0 0 24px' }}>
              {loading ? (
                <div style={{
                  padding: '60px 24px',
                  textAlign: 'center',
                  color: '#71717a',
                  fontSize: 15
                }}>
                  불러오는 중...
                </div>
              ) : info && (
                <>
                  {/* 플랜 + 사용량 */}
                  <Section title="플랜 및 사용량">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16
                    }}>
                      <span className={`nav-plan-badge plan-${info.plan.toLowerCase()}`}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 14
                        }}
                      >
                        {info.plan}
                      </span>
                      {info.resetAt && (
                        <span style={{
                          fontSize: 13,
                          color: '#71717a',
                          letterSpacing: '-0.01em'
                        }}>
                          다음 초기화: {info.resetAt}
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'grid',
                      gap: 12
                    }}>
                      {Object.entries(info.usage).map(([key, u]) => {
                        if (u.limit === 0) return null
                        const pct = Math.min(100, Math.round((u.used / u.limit) * 100))
                        const color = pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'

                        return (
                          <div key={key} style={{
                            background: '#fafafa',
                            border: '1px solid #f1f5f9',
                            borderRadius: 12,
                            padding: 14
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 10
                            }}>
                              <span style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#18181b',
                                letterSpacing: '-0.01em'
                              }}>
                                {USAGE_LABEL[key]}
                              </span>
                              <span style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color,
                                letterSpacing: '-0.02em'
                              }}>
                                {u.used}
                                <span style={{
                                  fontSize: 14,
                                  color: '#a1a1aa',
                                  marginLeft: 2
                                }}>
                                  /{u.limit}
                                </span>
                              </span>
                            </div>
                            <div style={{
                              height: 8,
                              background: '#e4e4e7',
                              borderRadius: 4,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: color,
                                transition: 'width 0.3s',
                                borderRadius: 4
                              }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Section>

                  {/* 쿠폰 등록 */}
                  <Section title="쿠폰 등록">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <input
                        className="coupon-input"
                        placeholder="쿠폰 코드 (예: NH-RS-XXXXXX)"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponMsg(null) }}
                        onKeyDown={e => e.key === 'Enter' && claimCoupon()}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: '1px solid #e4e4e7',
                          borderRadius: 10,
                          fontSize: 14,
                          background: '#ffffff',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#18181b'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e4e4e7'}
                      />
                      <button
                        onClick={claimCoupon}
                        disabled={!couponInput.trim() || couponClaiming}
                        style={{
                          padding: '12px 24px',
                          background: '#18181b',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: couponInput.trim() && !couponClaiming ? 'pointer' : 'not-allowed',
                          opacity: couponInput.trim() && !couponClaiming ? 1 : 0.5,
                          transition: 'all 0.2s',
                          letterSpacing: '-0.01em'
                        }}
                        onMouseEnter={(e) => {
                          if (couponInput.trim() && !couponClaiming) {
                            e.currentTarget.style.background = '#27272a'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#18181b'
                        }}
                      >
                        {couponClaiming ? '등록 중...' : '등록'}
                      </button>
                    </div>
                    {couponMsg && (
                      <div style={{
                        padding: '12px 16px',
                        background: couponMsg.ok ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${couponMsg.ok ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: 10,
                        color: couponMsg.ok ? '#166534' : '#991b1b',
                        fontSize: 13,
                        letterSpacing: '-0.01em'
                      }}>
                        {couponMsg.text}
                      </div>
                    )}
                  </Section>

                  {/* 쿠폰 현황 */}
                  <Section title="보유 쿠폰">
                    {info.coupons.length === 0 ? (
                      <div style={{
                        padding: '32px 24px',
                        textAlign: 'center',
                        color: '#a1a1aa',
                        fontSize: 14
                      }}>
                        보유 쿠폰이 없습니다.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {info.coupons.map(c => (
                          <div key={c.id} style={{
                            background: '#fafafa',
                            border: '1px solid #f1f5f9',
                            borderRadius: 12,
                            padding: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12
                          }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <code style={{
                                background: '#18181b',
                                color: '#e8ff47',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: '0.05em'
                              }}>
                                {c.code}
                              </code>
                              <div style={{
                                fontSize: 13,
                                color: '#71717a',
                                marginTop: 8,
                                letterSpacing: '-0.01em'
                              }}>
                                {FEATURE_LABEL[c.feature] ?? c.feature}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                padding: '6px 12px',
                                background: c.status === 'active' ? '#e8ff47' : c.status === 'used' ? '#e4e4e7' : '#fef2f2',
                                color: c.status === 'active' ? '#18181b' : c.status === 'used' ? '#71717a' : '#991b1b',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: '0'
                              }}>
                                {c.status === 'used' ? '사용 완료' : c.status === 'expired' ? '만료' : '사용 가능'}
                              </span>
                              {c.expires_at && c.status === 'active' && (
                                <div style={{
                                  fontSize: 11,
                                  color: '#a1a1aa',
                                  marginTop: 6,
                                  letterSpacing: '0'
                                }}>
                                  ~{new Date(c.expires_at).toLocaleDateString('ko-KR')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* 사용자 유형 */}
                  {info.userType && (
                    <Section title="사용자 유형">
                      <div style={{
                        padding: '16px',
                        background: '#fafafa',
                        border: '1px solid #f1f5f9',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#18181b',
                        letterSpacing: '-0.01em'
                      }}>
                        {info.userTypeLabel ?? '미설정'}
                      </div>
                    </Section>
                  )}

                  {/* 개인정보 동의 */}
                  {info.consents && (
                    <Section title="개인정보 동의">
                      <div style={{
                        background: info.consents.required.agreed ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${info.consents.required.agreed ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: 12,
                        padding: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#18181b',
                          letterSpacing: '-0.01em'
                        }}>
                          개인정보 수집·이용
                        </span>
                        <span style={{
                          fontSize: 13,
                          color: info.consents.required.agreed ? '#166534' : '#991b1b',
                          fontWeight: 600,
                          letterSpacing: '-0.01em'
                        }}>
                          {info.consents.required.agreed ? (
                            `✅ 동의함 (${info.consents.required.agreedAt})`
                          ) : (
                            '❌ 미동의'
                          )}
                        </span>
                      </div>
                    </Section>
                  )}

                  {/* 헤드헌터 추천 */}
                  {info.headhunterSharing && info.userType === 'INDIVIDUAL' && (
                    <Section title="💼 헤드헌터 추천 서비스">
                      <div style={{
                        background: '#fafafa',
                        border: '1px solid #f1f5f9',
                        borderRadius: 12,
                        padding: 16
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 16
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14,
                              color: '#71717a',
                              marginBottom: 8,
                              lineHeight: 1.6,
                              letterSpacing: '-0.01em'
                            }}>
                              전문 헤드헌터가 귀하의 이력서를 검토하고 최적의 포지션을 추천해 드립니다.
                            </div>
                            {info.headhunterSharing.enabled && info.headhunterSharing.consentedAt && (
                              <div style={{
                                fontSize: 12,
                                color: '#a1a1aa',
                                letterSpacing: '0'
                              }}>
                                동의 일시: {info.headhunterSharing.consentedAt}
                              </div>
                            )}
                          </div>
                          <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: 54,
                            height: 28,
                            flexShrink: 0,
                            marginLeft: 16
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
                              inset: 0,
                              background: info.headhunterSharing.enabled ? '#18181b' : '#d4d4d8',
                              transition: 'background 0.3s',
                              borderRadius: 28
                            }}>
                              <span style={{
                                position: 'absolute',
                                height: 22,
                                width: 22,
                                left: info.headhunterSharing.enabled ? 29 : 3,
                                bottom: 3,
                                background: '#ffffff',
                                transition: 'left 0.3s',
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }} />
                            </span>
                          </label>
                        </div>
                        <div style={{
                          padding: 14,
                          background: info.headhunterSharing.enabled ? '#f0fdf4' : '#ffffff',
                          border: `1px solid ${info.headhunterSharing.enabled ? '#bbf7d0' : '#e4e4e7'}`,
                          borderRadius: 10,
                          fontSize: 13,
                          color: '#71717a',
                          lineHeight: 1.6,
                          letterSpacing: '-0.01em'
                        }}>
                          {info.headhunterSharing.enabled ? (
                            <>
                              ✅ <strong style={{ color: '#166534' }}>활성화됨</strong> - 이력서 분석 시 자동으로 헤드헌터에게 공유됩니다.<br />
                              언제든지 비활성화할 수 있으며, 비활성화 시 공유된 정보는 삭제됩니다.
                            </>
                          ) : (
                            <>
                              ℹ️ <strong style={{ color: '#18181b' }}>비활성화됨</strong> - 헤드헌터 추천 서비스를 이용하려면 활성화하세요.
                            </>
                          )}
                        </div>
                      </div>
                    </Section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderBottom: '1px solid #f1f5f9'
    }}>
      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#18181b',
        marginBottom: 16,
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
