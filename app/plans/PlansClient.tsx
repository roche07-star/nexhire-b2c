'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getProductsByUserType, type ProductId } from '@/lib/products'

interface PlansClientProps {
  userEmail: string | null
  userType: string | null
  currentPlan: string
  isSuperAdminOrManager: boolean
}

// FREE 플랜 데이터
const freePlanData = {
  JOBSEEKER: {
    description: '이직 방향이 궁금한 직장인',
    features: [
      '이력서 분석 3회/월',
      'JD 적합도 분석 3회/월',
      '이력서 생성 3회/월',
      '기본 점수 리포트',
      '커리어 방향 1가지 제안',
      'HTML 화면 보기',
    ],
    limitations: [
      '면접 가이드 제공 안 함',
      'HTML 다운로드 불가',
    ],
  },
  HEADHUNTER: {
    description: '후보자 분석이 처음인 헤드헌터',
    features: [
      '후보자 분석 3회/월',
      'JD 적합도 분석 3회/월',
      '기본 매칭 리포트',
      'HTML 화면 보기',
    ],
    limitations: [
      '클라이언트 제안서 생성 안 함',
      '정산 기능 없음',
      'HTML 다운로드 불가',
    ],
  }
}

// FAQ 데이터
const faqData = {
  JOBSEEKER: [
    {
      q: '기간제 이용권은 어떻게 사용하나요?',
      a: '구매하신 이용권은 결제 시점부터 선택하신 기간(1개월 또는 3개월) 동안 유효합니다. 기간 내에는 해당 플랜의 모든 기능을 무제한으로 사용하실 수 있습니다.'
    },
    {
      q: '3개월권이 더 저렴한 이유는?',
      a: '장기 이용을 선택하시는 분들께 10% 할인 혜택을 드립니다. 1개월권을 3번 구매하는 것보다 3개월권을 한 번에 구매하시는 것이 더 경제적입니다.'
    },
    {
      q: '이용권 만료 후에는 어떻게 되나요?',
      a: '이용권 만료 후에는 자동으로 FREE 플랜으로 전환됩니다. 계속 사용하고 싶으시다면 새로운 이용권을 구매하시면 됩니다.'
    },
    {
      q: '환불 정책은 어떻게 되나요?',
      a: '구매 후 7일 이내, 서비스를 5회 미만 사용하신 경우 전액 환불이 가능합니다.'
    },
  ],
  HEADHUNTER: [
    {
      q: '정산 기능은 어떻게 작동하나요?',
      a: 'PRO 이상 플랜에서는 채용 성공 시 수수료 정산을 자동으로 계산하고 관리할 수 있는 기능을 제공합니다.'
    },
    {
      q: '클라이언트 제안서는 어떻게 생성되나요?',
      a: '후보자 분석 결과를 바탕으로 클라이언트에게 제시할 수 있는 전문적인 제안서를 AI가 자동으로 생성합니다.'
    },
    {
      q: '이용권 만료 후에는 어떻게 되나요?',
      a: '이용권 만료 후에는 자동으로 FREE 플랜으로 전환됩니다. 계속 사용하고 싶으시다면 새로운 이용권을 구매하시면 됩니다.'
    },
    {
      q: '환불 정책은 어떻게 되나요?',
      a: '구매 후 7일 이내, 서비스를 5회 미만 사용하신 경우 전액 환불이 가능합니다.'
    },
  ],
}

export default function PlansClient({ userEmail, userType, currentPlan, isSuperAdminOrManager }: PlansClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [viewType, setViewType] = useState<'JOBSEEKER' | 'HEADHUNTER'>(
    isSuperAdminOrManager ? 'JOBSEEKER' : (userType === 'HEADHUNTER' ? 'HEADHUNTER' : 'JOBSEEKER')
  )

  // 각 플랜별 선택된 기간 (1개월 or 3개월)
  const [selectedDuration, setSelectedDuration] = useState<Record<string, 1 | 3>>({
    PRO: 1,
    EXPERT: 1
  })

  const effectiveType = isSuperAdminOrManager ? viewType : (userType === 'HEADHUNTER' ? 'HEADHUNTER' : 'JOBSEEKER')

  // 현재 사용자 타입에 맞는 상품들 가져오기
  const userProducts = getProductsByUserType(effectiveType)

  // PRO, EXPERT 플랜별로 그룹화
  const planGroups = {
    PRO: userProducts.filter(p => p.plan === 'PRO'),
    EXPERT: userProducts.filter(p => p.plan === 'EXPERT')
  }

  const freePlan = freePlanData[effectiveType]
  const faqs = faqData[effectiveType]

  const content = {
    JOBSEEKER: {
      title: '나에게 맞는 플랜을 선택하세요',
      subtitle: '합리적인 가격으로 커리어를 설계하고, 이직 성공률을 높이세요',
      badge: '🎯 개인 구직자',
    },
    HEADHUNTER: {
      title: '비즈니스를 위한 최적의 플랜',
      subtitle: '후보자 분석 시간을 1/10로 단축하고, 매칭 정확도를 높이세요',
      badge: '💼 헤드헌터',
    },
  }

  const selected = content[effectiveType]

  return (
    <main style={{
      background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Hero Section */}
      <section style={{
        padding: '140px 24px 80px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          padding: '8px 20px',
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: 20,
          color: '#22d3ee',
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 24,
          letterSpacing: '-0.01em'
        }}>
          {selected.badge}
        </div>

        {/* Test Mode Warning */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '2px solid rgba(251, 191, 36, 0.5)',
          borderRadius: 12,
          marginBottom: 32,
          maxWidth: 600,
          margin: '0 auto 32px'
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#fbbf24',
            marginBottom: 4
          }}>
            ⚠️ 테스트 결제 모드
          </div>
          <div style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)'
          }}>
            실제 결제가 진행될 수 있습니다. 테스트용으로만 사용하세요.
          </div>
        </div>

        {/* Admin 뷰 전환 버튼 */}
        {isSuperAdminOrManager && (
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 32
          }}>
            <button
              onClick={() => setViewType('JOBSEEKER')}
              style={{
                padding: '12px 24px',
                background: viewType === 'JOBSEEKER'
                  ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: viewType === 'JOBSEEKER' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🎯 개인 구직자 플랜
            </button>
            <button
              onClick={() => setViewType('HEADHUNTER')}
              style={{
                padding: '12px 24px',
                background: viewType === 'HEADHUNTER'
                  ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: viewType === 'HEADHUNTER' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              💼 헤드헌터 플랜
            </button>
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: 20,
          letterSpacing: '-0.03em',
          lineHeight: 1.2
        }}>
          {selected.title}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 20,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 48,
          lineHeight: 1.6,
          maxWidth: 600,
          margin: '0 auto 48px'
        }}>
          {selected.subtitle}
        </p>

        {/* 할인 배너 */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 32px',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 16,
          marginBottom: 80
        }}>
          <span style={{ fontSize: 24 }}>🎁</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fbbf24',
              marginBottom: 4
            }}>
              기간제 이용권 출시
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)'
            }}>
              3개월권 구매 시 10% 할인
            </div>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section style={{
        padding: '0 24px 120px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 120
        }}>
          {/* FREE 플랜 */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: 40,
              position: 'relative',
              transition: 'all 0.3s'
            }}
          >
            {currentPlan === 'FREE' && (
              <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                padding: '4px 12px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700
              }}>
                현재 플랜
              </div>
            )}

            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 12
            }}>
              Free
            </div>

            <div style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 16
            }}>
              무료
            </div>

            <div style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 32,
              paddingBottom: 32,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              {freePlan.description}
            </div>

            <div style={{ marginBottom: 32 }}>
              {freePlan.features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 12,
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  <span style={{ color: '#22d3ee', fontSize: 16 }}>✓</span>
                  <span>{feature}</span>
                </div>
              ))}
              {freePlan.limitations.map((limitation, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 12,
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.4)',
                    textDecoration: 'line-through'
                  }}
                >
                  <span>✕</span>
                  <span>{limitation}</span>
                </div>
              ))}
            </div>

            <Link href="/analyze">
              <button
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: currentPlan === 'FREE' ? 'default' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: currentPlan === 'FREE' ? 0.5 : 1
                }}
                disabled={currentPlan === 'FREE'}
              >
                {currentPlan === 'FREE' ? '현재 사용 중' : '무료로 시작'}
              </button>
            </Link>
          </div>

          {/* PRO, EXPERT 플랜 */}
          {(['PRO', 'EXPERT'] as const).map((planType) => {
            const products = planGroups[planType]
            const selectedProduct = products.find(p => p.duration === selectedDuration[planType])
            if (!selectedProduct) return null

            const isPopular = planType === 'PRO'

            return (
              <div
                key={planType}
                style={{
                  background: isPopular
                    ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: isPopular
                    ? '2px solid rgba(34, 211, 238, 0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 24,
                  padding: 40,
                  position: 'relative',
                  transition: 'all 0.3s',
                  transform: isPopular ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '6px 20px',
                    background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                    color: '#ffffff',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 20px rgba(34, 211, 238, 0.4)'
                  }}>
                    가장 인기
                  </div>
                )}

                {currentPlan === planType && (
                  <div style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    padding: '4px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    현재 플랜
                  </div>
                )}

                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: 16
                }}>
                  {planType}
                </div>

                {/* 기간 선택 버튼 */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 20,
                  padding: '4px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 12
                }}>
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedDuration(prev => ({ ...prev, [planType]: product.duration as 1 | 3 }))}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: selectedDuration[planType] === product.duration
                          ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                          : 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div>{product.duration}개월</div>
                      {product.discount && (
                        <div style={{
                          fontSize: 10,
                          color: selectedDuration[planType] === product.duration ? '#fff' : '#fbbf24'
                        }}>
                          {product.discount}% 할인
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* 가격 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: isPopular ? '#22d3ee' : '#ffffff',
                    lineHeight: 1,
                    marginBottom: 8
                  }}>
                    ₩{selectedProduct.price.toLocaleString()}
                  </div>
                  {selectedProduct.originalPrice && (
                    <div style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.4)',
                      textDecoration: 'line-through'
                    }}>
                      ₩{selectedProduct.originalPrice.toLocaleString()}
                    </div>
                  )}
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 8
                  }}>
                    {selectedProduct.duration}개월 이용권
                  </div>
                </div>

                {/* 설명 */}
                <div style={{
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 32,
                  paddingBottom: 32,
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {effectiveType === 'JOBSEEKER'
                    ? (planType === 'PRO' ? '본격적인 이직 준비 중인 재직자' : '최종 합격까지 끝내고 싶은 이직자')
                    : (planType === 'PRO' ? '월 10-30건 매칭하는 헤드헌터' : '대형 헤드헌팅펌 / 리크루팅 에이전시')
                  }
                </div>

                {/* 기능 */}
                <div style={{ marginBottom: 32 }}>
                  {selectedProduct.features.map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        marginBottom: 12,
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      <span style={{ color: '#22d3ee', fontSize: 16 }}>✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA 버튼 */}
                {isSuperAdminOrManager ? (
                  <button
                    style={{
                      width: '100%',
                      padding: '16px 32px',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      transition: 'all 0.3s',
                      opacity: 0.5
                    }}
                    disabled
                  >
                    관리자 계정은 결제 불가
                  </button>
                ) : (
                  <Link href={`/payment?product=${selectedProduct.id}`}>
                    <button
                      style={{
                        width: '100%',
                        padding: '16px 32px',
                        background: isPopular
                          ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                          : 'rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        border: isPopular ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: currentPlan === planType ? 'default' : 'pointer',
                        transition: 'all 0.3s',
                        opacity: currentPlan === planType ? 0.5 : 1
                      }}
                      disabled={currentPlan === planType}
                    >
                      {currentPlan === planType ? '현재 사용 중' : `${planType} 구매하기`}
                    </button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div style={{
          maxWidth: 800,
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: 40,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: '-0.02em'
          }}>
            자주 묻는 질문
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            marginBottom: 56
          }}>
            궁금한 점이 있으신가요? 여기서 답을 찾아보세요
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.3s'
                }}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  style={{
                    width: '100%',
                    padding: '24px 28px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{
                    fontSize: 20,
                    color: '#22d3ee',
                    transition: 'transform 0.3s',
                    transform: openFaqIndex === index ? 'rotate(180deg)' : 'rotate(0)'
                  }}>
                    ▼
                  </span>
                </button>
                {openFaqIndex === index && (
                  <div style={{
                    padding: '0 28px 24px',
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.7
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          marginTop: 120,
          textAlign: 'center',
          padding: '80px 40px',
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
          borderRadius: 24,
          border: '1px solid rgba(34, 211, 238, 0.3)'
        }}>
          <h2 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 16,
            letterSpacing: '-0.02em'
          }}>
            아직 결정하지 못하셨나요?
          </h2>
          <p style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 32,
            lineHeight: 1.6
          }}>
            무료 플랜으로 시작해보세요. 신용카드 등록 없이 바로 사용할 수 있습니다.
          </p>
          <Link href="/analyze">
            <button style={{
              padding: '18px 48px',
              background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(34, 211, 238, 0.3)'
            }}>
              무료로 시작하기 →
            </button>
          </Link>
        </div>
      </section>
    </main>
  )
}
