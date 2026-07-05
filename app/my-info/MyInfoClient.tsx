'use client'

interface User {
  email: string
  name: string | null
  user_type: string
  plan: string
  created_at: string
}

interface Coupon {
  id: string
  code: string | null
  feature: string
  credits: number
  used: number
  expires_at: string
  issued_by: string
  created_at: string
  claimed_at: string
  used_at: string | null
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
  user: User | null
  coupons: Coupon[]
  payments: Payment[]
  userEmail: string
}

const FEATURE_NAMES: Record<string, string> = {
  resume: '이력서 분석',
  jd: 'JD 적합도 분석',
  rewrite: '이력서 생성',
  interview: '면접 가이드',
  proposal: '클라이언트 제안서',
}

export default function MyInfoClient({ user, coupons, payments, userEmail }: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const remainingCredits = (coupon: Coupon) => {
    return coupon.credits - (coupon.used || 0)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '40px 20px',
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
            계정 정보 및 보유 쿠폰을 확인하세요
          </p>
        </div>

        {/* 사용자 정보 */}
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
            계정 정보
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{
                fontSize: 13,
                color: 'var(--muted2)',
                marginBottom: 4,
              }}>
                이메일
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text)',
              }}>
                {userEmail}
              </div>
            </div>

            {user && (
              <>
                <div>
                  <div style={{
                    fontSize: 13,
                    color: 'var(--muted2)',
                    marginBottom: 4,
                  }}>
                    사용자 타입
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    {user.user_type === 'JOBSEEKER' ? '개인 구직자' :
                     user.user_type === 'HEADHUNTER' ? '헤드헌터' :
                     user.user_type === 'MANAGER' ? '매니저' :
                     user.user_type === 'SUPER_ADMIN' ? '슈퍼 관리자' : user.user_type}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: 13,
                    color: 'var(--muted2)',
                    marginBottom: 4,
                  }}>
                    현재 플랜
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    {user.plan}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: 13,
                    color: 'var(--muted2)',
                    marginBottom: 4,
                  }}>
                    가입일
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </>
            )}
          </div>
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
            보유 쿠폰
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

                return (
                  <div
                    key={coupon.id}
                    style={{
                      background: expired ? 'var(--surface2)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                      border: expired ? '1px solid var(--border)' : '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: 12,
                      padding: 20,
                      opacity: expired ? 0.6 : 1,
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
                          {FEATURE_NAMES[coupon.feature] || coupon.feature}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: 'var(--muted2)',
                        }}>
                          발급: {coupon.issued_by}
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'right',
                      }}>
                        <div style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: expired ? 'var(--muted2)' : '#3b82f6',
                        }}>
                          {remaining}회
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--muted2)',
                        }}>
                          / {coupon.credits}회
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: 'var(--muted2)',
                    }}>
                      <div>
                        유효기간: {formatDate(coupon.expires_at)}
                      </div>
                      {expired && (
                        <div style={{ color: '#ef4444', fontWeight: 600 }}>
                          만료됨
                        </div>
                      )}
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
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
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
