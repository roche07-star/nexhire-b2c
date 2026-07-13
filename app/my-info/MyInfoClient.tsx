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
}

interface Props {
  coupons: CouponWithDetails[]
  payments: Payment[]
}

const FEATURE_NAMES: Record<string, string> = {
  resume: '이력서 분석',
  jd: 'JD 적합도 분석',
  rewrite: '이력서 생성',
  interview: '면접 가이드',
  proposal: '클라이언트 제안서',
  storage: '이력서 추가 저장',
}

const FEATURE_LINKS: Record<string, string> = {
  resume: '/analyze',
  jd: '/analyze',
  rewrite: '/analyze',
  interview: '/analyze',
  proposal: '/analyze',
  storage: '/analyze',
}

export default function MyInfoClient({ coupons: initialCoupons, payments }: Props) {
  const [coupons] = useState<CouponWithDetails[]>(initialCoupons)

  // useEffect 제거: 서버에서 이미 최신 데이터를 가져옴

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
            구매 내역
          </h1>
          <p style={{ color: 'var(--muted2)', fontSize: 16 }}>
            STORE 구매 내역 및 영수증을 확인하세요
          </p>
        </div>

        {/* 보유 쿠폰 */}
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
            구매 쿠폰
          </h2>

          {coupons.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--muted2)',
            }}>
              <p style={{ fontSize: 16, marginBottom: 16 }}>
                보유 중인 쿠폰이 없습니다
              </p>
              <a
                href="/store"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                스토어에서 구매하기
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {coupons.map((coupon) => {
                const expired = isExpired(coupon.expires_at)
                const remaining = remainingCredits(coupon)
                const isUsed = coupon.used_at || remaining <= 0

                return (
                  <div
                    key={coupon.id}
                    onClick={() => {
                      if (!expired && !isUsed && remaining > 0) {
                        window.location.href = FEATURE_LINKS[coupon.feature] || '/analyze'
                      }
                    }}
                    style={{
                      background: (expired || isUsed) ? 'var(--surface2)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                      border: (expired || isUsed) ? '1px solid var(--border)' : '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: 12,
                      padding: 20,
                      opacity: (expired || isUsed) ? 0.6 : 1,
                      cursor: (!expired && !isUsed && remaining > 0) ? 'pointer' : 'default',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!expired && remaining > 0) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--text)',
                          marginBottom: 4,
                        }}>
                          {FEATURE_NAMES[coupon.feature] || coupon.feature}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: 'var(--muted2)',
                        }}>
                          등록: {formatDate(coupon.claimed_at)}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 8,
                      }}>
                        <div style={{
                          padding: '4px 12px',
                          background: isUsed
                            ? '#9ca3af'
                            : expired
                            ? '#ef4444'
                            : 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          {isUsed ? '사용 완료' : expired ? '만료' : '사용 가능'}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: 'var(--muted2)',
                          textAlign: 'right',
                        }}>
                          ~{formatDate(coupon.expires_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}>
                      <div style={{
                        fontSize: 13,
                        color: 'var(--muted2)',
                      }}>
                        {isUsed ? (
                          <span style={{ color: '#9ca3af', fontWeight: 600 }}>
                            ✓ 사용 완료
                          </span>
                        ) : expired ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>
                            ⚠️ 만료됨
                          </span>
                        ) : (
                          <span>
                            💡 클릭하여 사용하기
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: (isUsed || expired) ? 'var(--muted2)' : '#3b82f6',
                      }}>
                        남은 횟수: {remaining}회
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 결제 내역 */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 32,
          marginTop: 24,
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 24,
          }}>
            💳 결제 내역
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
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 12,
                    padding: 20,
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
                      }}>
                        {payment.description || '상품'}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'var(--muted2)',
                      }}>
                        {payment.paid_at ? formatDate(payment.paid_at, true) : '-'}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'right',
                    }}>
                      <div style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: '#3b82f6',
                      }}>
                        {payment.amount.toLocaleString()}원
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: 'var(--muted2)',
                      }}>
                        {payment.payment_method || '-'}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
