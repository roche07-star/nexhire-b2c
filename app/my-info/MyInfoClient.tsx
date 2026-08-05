'use client'

import { useState, useEffect } from 'react'
import type { Coupon } from '@/lib/types/coupon'

// ✅ 중앙 타입 사용 (추가 필드는 로컬 확장)
interface CouponWithDetails extends Coupon {
  issued_by?: string
}

interface Payment {
  id: string
  user_email: string
  plan: string
  amount: number
  status: string
  payment_method: string | null
  paid_at: string
  transaction_id: string | null
  description: string | null
  payment_gateway?: string | null
  refunded_at?: string | null
  refund_reason?: string | null
}

interface Props {
  coupons: CouponWithDetails[]
  payments: Payment[]
}

// 결제 방법을 사람이 읽기 쉽게 포맷
function formatPaymentMethod(paymentMethod: string | null): string {
  if (!paymentMethod) return '-'

  try {
    // JSON 파싱 시도
    const parsed = JSON.parse(paymentMethod)

    // PortOne V2 카드 결제
    if (parsed.type === 'PaymentMethodCard' && parsed.card) {
      const card = parsed.card
      const cardName = card.name || '카드'
      const last4 = card.number?.slice(-4) || ''
      const cardType = card.type === 'DEBIT' ? '체크' : card.type === 'CREDIT' ? '신용' : ''

      return `${cardName}${cardType ? ` (${cardType})` : ''} *${last4}`
    }

    // 기타 JSON 형태
    return paymentMethod
  } catch {
    // JSON이 아니면 그대로 반환
    return paymentMethod
  }
}

const FEATURE_NAMES: Record<string, string> = {
  resume: '이력서 분석',
  jd: 'JD 적합도 분석',
  rewrite: '이력서 생성',
  interview: '면접 가이드',
  proposal: '클라이언트 제안서',
  storage: '추가 저장 Slot',
}

const FEATURE_LINKS: Record<string, string> = {
  resume: '/analyze',
  jd: '/analyze',
  rewrite: '/analyze',
  interview: '/analyze',
  proposal: '/analyze',
  storage: '/analyze',
}

export default function MyInfoClient({ coupons: initialCoupons, payments: initialPayments }: Props) {
  const [coupons, setCoupons] = useState<CouponWithDetails[]>(initialCoupons)
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [loading, setLoading] = useState(false)

  // ✅ 구매 후 최신 데이터 가져오기
  useEffect(() => {
    const refreshData = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/my-info')
        if (res.ok) {
          const data = await res.json()
          setCoupons(data.coupons || [])
          setPayments(data.payments || [])
        }
      } catch (err) {
        console.error('[MyInfo] 데이터 새로고침 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    // 페이지 포커스 시 새로고침 (다른 탭에서 구매 후 돌아올 때)
    const handleFocus = () => refreshData()
    window.addEventListener('focus', handleFocus)

    // 최초 로딩 시 새로고침 (구매 완료 직후)
    refreshData()

    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const remainingCredits = (coupon: Coupon) => {
    return coupon.credits - (coupon.used || 0)
  }

  // 서버/클라이언트 일관된 날짜 포맷팅
  const formatDate = (dateString: string | null, includeTime = false) => {
    if (!dateString) return '기한 없음'

    const date = new Date(dateString)

    // Invalid Date 체크
    if (isNaN(date.getTime())) return '기한 없음'

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    if (!includeTime) {
      return `${year}년 ${month}월 ${day}일`
    }

    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const period = hours >= 12 ? '오후' : '오전'
    const displayHours = hours % 12 || 12

    return `${year}년 ${month}월 ${day}일 ${period} ${displayHours}:${minutes}`
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '100px 20px 40px',
    }}>
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
      }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: 8,
          }}>
            내 정보
          </h1>
          <p style={{ color: 'var(--muted2)', fontSize: 16 }}>
            보유 쿠폰 및 구매 내역을 확인하세요
          </p>
        </div>

        {/* 🎫 보유 쿠폰 */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 24,
          }}>
            🎫 보유 쿠폰
          </h2>

          {coupons.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--muted2)',
            }}>
              <p style={{ fontSize: 16 }}>
                보유 쿠폰이 없습니다
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {coupons.map((coupon) => {
                const expired = isExpired(coupon.expires_at)
                const remaining = remainingCredits(coupon)
                const status = expired ? 'expired' : remaining <= 0 ? 'used' : 'active'

                return (
                  <div
                    key={coupon.id}
                    style={{
                      background: status === 'active'
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(100, 116, 139, 0.05) 100%)',
                      border: status === 'active'
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: 12,
                      padding: 20,
                      opacity: status === 'active' ? 1 : 0.6,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}>
                        {FEATURE_NAMES[coupon.feature] || coupon.feature}
                      </div>

                      <div style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: status === 'active'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : status === 'expired'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(148, 163, 184, 0.2)',
                        color: status === 'active'
                          ? '#15803d'
                          : status === 'expired'
                          ? '#991b1b'
                          : '#475569',
                      }}>
                        {status === 'active' ? '사용 가능' : status === 'expired' ? '만료됨' : '사용 완료'}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{
                        fontSize: 14,
                        color: 'var(--muted2)',
                      }}>
                        남은 횟수: <span style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: status === 'active' ? '#22c55e' : 'var(--muted2)',
                        }}>
                          {remaining}/{coupon.credits}회
                        </span>
                      </div>

                      {coupon.expires_at && (
                        <div style={{
                          fontSize: 13,
                          color: 'var(--muted2)',
                        }}>
                          만료일: {formatDate(coupon.expires_at)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 구매 내역 (결제 + 쿠폰 통합) */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 32,
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 24,
          }}>
            💳 구매 내역
          </h2>

          {payments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--muted2)',
            }}>
              <p style={{ fontSize: 16 }}>
                결제 내역이 없습니다
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {payments.map((payment) => {
                const isRefunded = payment.status === 'refunded'

                return (
                <div
                  key={payment.id}
                  style={{
                    background: isRefunded
                      ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.05) 0%, rgba(100, 116, 139, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%)',
                    border: isRefunded
                      ? '1px solid rgba(148, 163, 184, 0.3)'
                      : '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 12,
                    padding: 20,
                    opacity: isRefunded ? 0.7 : 1,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}>
                    <div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{ textDecoration: isRefunded ? 'line-through' : 'none' }}>
                          {payment.description || '상품'}
                        </span>
                        {isRefunded && (
                          <span style={{
                            padding: '2px 8px',
                            background: '#ef4444',
                            color: '#fff',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            환불 완료
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'var(--muted2)',
                      }}>
                        {payment.paid_at ? formatDate(payment.paid_at, true) : '-'}
                        {isRefunded && payment.refunded_at && (
                          <span style={{ marginLeft: 8, color: '#ef4444' }}>
                            • 환불: {formatDate(payment.refunded_at, true)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'right',
                    }}>
                      <div style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: isRefunded ? '#94a3b8' : '#3b82f6',
                        textDecoration: isRefunded ? 'line-through' : 'none',
                      }}>
                        {payment.amount.toLocaleString()}원
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: 'var(--muted2)',
                      }}>
                        {formatPaymentMethod(payment.payment_method)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      fontSize: 13,
                      color: 'var(--muted2)',
                    }}>
                      거래 ID: {payment.transaction_id || '-'}
                    </div>

                    {/* Toss Payments만 영수증 보기 (PortOne은 미지원) */}
                    {payment.payment_gateway !== 'portone' && payment.transaction_id && (
                      <button
                        onClick={() => window.open(`/api/receipt/${payment.id}`, '_blank')}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        📄 영수증 보기
                      </button>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
