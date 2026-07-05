'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const FEATURE_LABEL: Record<string, string> = {
  storage: '이력서 추가 저장', resume: '이력서 분석', jd: 'JD 분석', rewrite: '이력서 생성', proposal: '클라이언트 제안서', interview: '면접 가이드', package: '올인원 패키지',
}
const USAGE_LABEL: Record<string, string> = {
  analyze: '이력서 분석', jd: 'JD 분석', rewrite: '이력서 생성', interview: '면접 가이드',
}

interface CouponItem {
  id: string; code: string; feature: string
  status: 'active' | 'used' | 'expired'
  expires_at?: string | null; claimed_at?: string | null; used_at?: string | null
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
  downgrade_to?: string | null
  plan_end_date?: string | null
}

export default function MyInfoButton() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<MyInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [couponClaiming, setCouponClaiming] = useState(false)
  const [headhunterToggling, setHeadhunterToggling] = useState(false)
  const [restorableData, setRestorableData] = useState<any>(null)
  const [restoring, setRestoring] = useState(false)
  const [canceling, setCanceling] = useState(false)
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

  async function handleDeleteCoupon(couponId: string) {
    if (!confirm('쿠폰을 삭제하시겠습니까?\n\n관리자에게는 삭제 기록이 남습니다.')) {
      return
    }

    try {
      const res = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        // 쿠폰 목록 새로고침
        const res2 = await fetch('/api/my-info')
        setInfo(await res2.json())
        setCouponMsg({ text: '쿠폰이 삭제되었습니다.', ok: true })
      } else {
        const data = await res.json()
        alert(data.error ?? '삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다.')
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

  // 복원 가능 데이터 확인
  useEffect(() => {
    async function checkRestorable() {
      try {
        const res = await fetch('/api/user/restore')
        if (res.ok) {
          const data = await res.json()
          if (data.restorable) {
            setRestorableData(data)
          }
        }
      } catch (err) {
        console.error('Failed to check restorable data:', err)
      }
    }
    if (open) {
      checkRestorable()
    }
  }, [open])

  async function handleRestore() {
    if (!confirm('기존 데이터를 복원하시겠습니까?\n\nFREE 플랜으로 시작하며, 복원 후에는 되돌릴 수 없습니다.')) {
      return
    }

    setRestoring(true)
    try {
      const res = await fetch('/api/user/restore', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        alert(`✅ 데이터 복원 완료!\n\n이력서 분석: ${data.restored.analyses}건\nJD 분석: ${data.restored.jdAnalyses}건\n면접 가이드: ${data.restored.interviewGuides}건\n쿠폰: ${data.restored.coupons}개`)
        setRestorableData(null)
        // 페이지 새로고침
        window.location.reload()
      } else {
        alert(data.error ?? '복원에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다.')
    } finally {
      setRestoring(false)
    }
  }

  async function handleCancelSubscription() {
    if (!info) return

    if (!confirm(`구독을 종료하시겠습니까?\n\n플랜 종료일까지 현재 플랜을 이용할 수 있으며,\n종료일에 FREE 플랜으로 전환됩니다 (월 3회 제한).`)) {
      return
    }

    setCanceling(true)
    try {
      const res = await fetch('/api/user/cancel-subscription', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        if (data.downgrade_to) {
          alert(`구독 종료가 예약되었습니다.\n\n플랜 종료일: ${data.plan_end_date}\n종료일까지 현재 플랜을 이용할 수 있습니다.\n종료일에 FREE 플랜으로 자동 전환됩니다.`)
        } else {
          alert(data.message || 'FREE 플랜으로 전환되었습니다.')
        }
        // 대시보드로 이동
        window.location.href = '/'
      } else {
        alert(data.error ?? '구독 종료에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다.')
    } finally {
      setCanceling(false)
    }
  }

  return (
    <>
      <button className="btn-ghost my-info-btn" onClick={openModal}>내 정보</button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 9999999,  // 헤드헌터 대시보드보다 높게
            padding: '50px 20px 20px',
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
                      {(info.downgrade_to || (info.plan !== 'FREE' && info.resetAt)) && (
                        <span style={{
                          fontSize: 13,
                          color: info.downgrade_to ? '#f59e0b' : '#71717a',
                          letterSpacing: '-0.01em',
                          fontWeight: info.downgrade_to ? 600 : 400,
                        }}>
                          {info.downgrade_to
                            ? `플랜 종료: ${info.plan_end_date || ''}`
                            : `다음 초기화: ${info.resetAt}`
                          }
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
                          color: '#18181b',
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
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: 12,
                            position: 'relative'
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
                              {/* 등록일/사용일 */}
                              <div style={{
                                fontSize: 11,
                                color: '#a1a1aa',
                                marginTop: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                              }}>
                                {c.claimed_at && (
                                  <div>등록: {new Date(c.claimed_at).toLocaleDateString('ko-KR')}</div>
                                )}
                                {c.used_at && (
                                  <div>사용: {new Date(c.used_at).toLocaleDateString('ko-KR')}</div>
                                )}
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
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => handleDeleteCoupon(c.id)}
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                border: 'none',
                                background: '#fef2f2',
                                color: '#991b1b',
                                fontSize: 16,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fee2e2'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fef2f2'
                              }}
                              title="쿠폰 삭제"
                            >
                              ×
                            </button>
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

                  {/* 헤드헌터 추천 동의 */}
                  {info.headhunterSharing && info.userType === 'JOBSEEKER' && (
                    <Section title="헤드헌터 추천 서비스">
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
                          marginBottom: 12
                        }}>
                          <div>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#18181b',
                              marginBottom: 4,
                              letterSpacing: '-0.01em'
                            }}>
                              헤드헌터 추천 동의
                            </div>
                            {info.headhunterSharing.enabled && info.headhunterSharing.consentedAt && (
                              <div style={{
                                fontSize: 12,
                                color: '#71717a',
                                letterSpacing: '-0.01em'
                              }}>
                                동의일: {info.headhunterSharing.consentedAt}
                              </div>
                            )}
                          </div>
                          <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: 50,
                            height: 28,
                            cursor: headhunterToggling ? 'not-allowed' : 'pointer'
                          }}>
                            <input
                              type="checkbox"
                              checked={info.headhunterSharing.enabled}
                              onChange={toggleHeadhunterSharing}
                              disabled={headhunterToggling}
                              style={{ display: 'none' }}
                            />
                            <span style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: info.headhunterSharing.enabled ? '#10b981' : '#d4d4d8',
                              borderRadius: 14,
                              transition: 'background 0.3s',
                              cursor: headhunterToggling ? 'not-allowed' : 'pointer',
                              opacity: headhunterToggling ? 0.5 : 1
                            }}>
                              <span style={{
                                position: 'absolute',
                                content: '',
                                height: 22,
                                width: 22,
                                left: info.headhunterSharing.enabled ? 25 : 3,
                                bottom: 3,
                                background: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.3s',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                              }} />
                            </span>
                          </label>
                        </div>

                        <div style={{
                          fontSize: 12,
                          color: '#71717a',
                          lineHeight: 1.6,
                          letterSpacing: '-0.01em'
                        }}>
                          {info.headhunterSharing.enabled ? (
                            <>
                              ✅ 헤드헌터 추천 서비스를 이용 중입니다.<br/>
                              귀하의 이력서 정보가 헤드헌터에게 공유됩니다.
                            </>
                          ) : (
                            <>
                              ⚠️ 헤드헌터 추천 서비스가 비활성화되어 있습니다.<br/>
                              구직 요청 시 동의가 필요합니다.
                            </>
                          )}
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* 복원 UI */}
                  {restorableData && (
                    <Section title="📦 데이터 복원">
                      <div style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: '8px' }}>
                          복원 가능한 데이터가 있습니다!
                        </div>
                        <div style={{ fontSize: 13, color: '#78716c', marginBottom: '12px' }}>
                          • 이력서 분석: {restorableData.data.analyses}건<br/>
                          • JD 분석: {restorableData.data.jdAnalyses}건<br/>
                          • 면접 가이드: {restorableData.data.interviewGuides}건<br/>
                          • 쿠폰: {restorableData.data.coupons}개
                        </div>
                        <div style={{ fontSize: 12, color: '#78716c', marginBottom: '12px' }}>
                          ⚠️ 데이터 삭제 예정일: {new Date(restorableData.data_delete_at).toLocaleDateString()}
                        </div>
                        <button
                          onClick={handleRestore}
                          disabled={restoring}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: restoring ? 'not-allowed' : 'pointer',
                            opacity: restoring ? 0.6 : 1,
                          }}
                        >
                          {restoring ? '복원 중...' : '데이터 복원하기'}
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>
                        ℹ️ 복원 후 안내:<br/>
                        • FREE 플랜으로 시작합니다<br/>
                        • 월 사용량: 이력서 3회 / JD 3회<br/>
                        • 과거 결과는 열람만 가능합니다<br/>
                        • 새로운 분석은 FREE 한도 내에서 가능
                      </div>
                    </Section>
                  )}

                  {/* 구독 관리 (유료 플랜만) */}
                  {info.plan !== 'FREE' && (
                    <Section title="💳 구독 관리">
                      {info.downgrade_to ? (
                        // 구독 종료 예약됨
                        <>
                          <div style={{
                            padding: '12px 16px',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            marginBottom: 12
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
                              📅 구독 종료 예정
                            </div>
                            <div style={{ fontSize: 13, color: '#92400e' }}>
                              플랜 종료일: <strong>{info.plan_end_date}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>
                              종료일까지 현재 플랜을 이용할 수 있으며, 종료일에 FREE 플랜으로 자동 전환됩니다.
                            </div>
                          </div>
                          <p style={{ fontSize: 12, color: '#71717a' }}>
                            예약을 취소하려면{' '}
                            <a
                              href="/support"
                              style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}
                            >
                              고객센터
                            </a>
                            {' '}로 문의하세요.
                          </p>
                        </>
                      ) : (
                        // 구독 종료 가능
                        <>
                          <p style={{ fontSize: 13, color: '#71717a', marginBottom: 12 }}>
                            구독을 종료하면 FREE 플랜으로 전환됩니다. 계정 탈퇴는 <a href="/terms" style={{ color: '#3b82f6', textDecoration: 'underline' }}>이용약관</a>에서 가능합니다.
                          </p>
                          <button
                            onClick={handleCancelSubscription}
                            disabled={canceling}
                            style={{
                              padding: '10px 16px',
                              background: '#fef3c7',
                              color: '#f59e0b',
                              border: '1px solid #fde68a',
                              borderRadius: '8px',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: canceling ? 'not-allowed' : 'pointer',
                              opacity: canceling ? 0.6 : 1,
                            }}
                          >
                            {canceling ? '처리 중...' : '구독 종료'}
                          </button>
                        </>
                      )}
                    </Section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
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
