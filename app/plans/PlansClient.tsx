'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { UserType } from '@/types/user'

interface PlansClientProps {
  userEmail: string | null
  userType: string | null
  currentPlan: string
  isSuperAdminOrManager: boolean
}

// 플랜 데이터
const individualPlans = [
  {
    name: 'FREE',
    displayName: 'Free',
    price: 0,
    originalPrice: 0,
    popular: false,
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
  {
    name: 'PRO',
    displayName: 'Pro',
    price: 6930,
    originalPrice: 9900,
    popular: true,
    description: '본격적인 이직 준비 중인 재직자',
    features: [
      '이력서 분석 15회/월',
      'JD 적합도 분석 15회/월',
      '이력서 생성 10회/월',
      '면접 가이드 5회/월',
      '심층 점수 리포트',
      '커리어 방향 3가지 제안',
      '분석 결과 영구 저장',
      'HTML 리포트 다운로드',
    ],
    limitations: [],
  },
  {
    name: 'EXPERT',
    displayName: 'Expert',
    price: 20930,
    originalPrice: 29900,
    popular: false,
    description: '최종 합격까지 끝내고 싶은 이직자',
    features: [
      '이력서 분석 30회/월',
      'JD 적합도 분석 30회/월',
      '이력서 생성 30회/월',
      '면접 가이드 15회/월',
      '심층 점수 리포트',
      '커리어 방향 3가지 제안',
      '분석 결과 영구 저장',
      'HTML 리포트 다운로드',
    ],
    limitations: [],
  },
]

const headhunterPlans = [
  {
    name: 'FREE',
    displayName: 'Free',
    price: 0,
    originalPrice: 0,
    popular: false,
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
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    price: 13930,
    originalPrice: 19900,
    popular: true,
    description: '월 10-30건 매칭하는 헤드헌터',
    features: [
      '후보자 분석 20회/월',
      'JD 적합도 분석 20회/월',
      '클라이언트 제안서 20회/월',
      '면접 가이드 10회/월',
      '정산 기능',
      '심층 매칭 리포트',
      '분석 결과 영구 저장',
      'HTML/PDF 리포트 다운로드',
      '후보자 관리 대시보드',
    ],
    limitations: [],
  },
  {
    name: 'EXPERT',
    displayName: 'Expert',
    price: 34930,
    originalPrice: 49900,
    popular: false,
    description: '대형 헤드헌팅펌 / 리크루팅 에이전시',
    features: [
      '후보자 분석 50회/월',
      'JD 적합도 분석 50회/월',
      '정산 기능',
      '클라이언트 제안서 50회/월',
      '면접 가이드 25회/월',
      '심층 매칭 리포트',
      '분석 결과 영구 저장',
      'HTML/PDF 리포트 다운로드',
      '후보자 관리 대시보드',
    ],
    limitations: [],
  },
]

// FAQ 데이터
const faqData = {
  JOBSEEKER: [
    {
      q: '무료 플랜으로 어디까지 사용할 수 있나요?',
      a: 'Free 플랜은 이력서 분석, JD 적합도 분석, 이력서 생성을 각각 월 3회까지 무료로 이용할 수 있습니다. 기본 점수 리포트와 커리어 방향 제안도 제공되며, HTML 화면으로 결과를 확인할 수 있습니다.'
    },
    {
      q: '플랜은 언제든지 변경할 수 있나요?',
      a: '네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 다음 결제 주기부터 적용됩니다.'
    },
    {
      q: '환불 정책은 어떻게 되나요?',
      a: '구매 후 7일 이내에는 이유 불문하고 전액 환불이 가능합니다. 단, 분석 기능을 5회 이상 사용한 경우 환불이 제한될 수 있습니다.'
    },
    {
      q: 'Pro와 Expert의 차이점은 무엇인가요?',
      a: 'Pro는 이직 준비 중인 재직자에게 적합하며, Expert는 면접 준비까지 포함된 올인원 솔루션입니다. Expert 플랜에서는 면접 가이드를 월 15회까지 생성할 수 있어 최종 합격까지 완벽하게 준비할 수 있습니다.'
    },
  ],
  HEADHUNTER: [
    {
      q: '정산 기능은 어떻게 작동하나요?',
      a: 'Pro 이상 플랜에서는 채용 성공 시 수수료 정산을 자동으로 계산하고 관리할 수 있는 기능을 제공합니다. 입사 완료 후보자의 연봉 정보를 입력하면 자동으로 정산 금액이 계산됩니다.'
    },
    {
      q: '클라이언트 제안서는 어떻게 생성되나요?',
      a: '후보자 분석 결과를 바탕으로 클라이언트에게 제시할 수 있는 전문적인 제안서를 AI가 자동으로 생성합니다. PDF 또는 HTML 형식으로 다운로드하여 바로 사용할 수 있습니다.'
    },
    {
      q: '월 사용 횟수를 초과하면 어떻게 되나요?',
      a: '사용 횟수 초과 시 다음 달까지 기다리거나, 상위 플랜으로 업그레이드하실 수 있습니다. 긴급한 경우 고객센터로 문의주시면 임시 크레딧을 제공해드립니다.'
    },
    {
      q: '대시보드에서 어떤 정보를 확인할 수 있나요?',
      a: 'Pro 이상 플랜에서는 전체 후보자 현황, 진행 중인 채용 프로세스, 월별 매칭 성과, 정산 내역 등을 한눈에 확인할 수 있는 통합 대시보드를 제공합니다.'
    },
  ],
  DEFAULT: [
    {
      q: '회원가입은 필수인가요?',
      a: '네, 이력서 분석 및 모든 기능을 사용하려면 Google 계정으로 로그인이 필요합니다. 로그인 후 무료 플랜으로 바로 시작할 수 있습니다.'
    },
    {
      q: '플랜은 언제든지 변경할 수 있나요?',
      a: '네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 다음 결제 주기부터 적용됩니다.'
    },
    {
      q: '환불 정책은 어떻게 되나요?',
      a: '구매 후 7일 이내에는 이유 불문하고 전액 환불이 가능합니다. 단, 분석 기능을 5회 이상 사용한 경우 환불이 제한될 수 있습니다.'
    },
    {
      q: '개인 구직자와 헤드헌터의 요금이 다른 이유는?',
      a: '개인 구직자는 본인의 커리어 관리를 위해, 헤드헌터는 비즈니스 목적으로 서비스를 이용하시기 때문에 제공되는 기능과 가격이 차등 적용됩니다.'
    },
  ],
}

export default function PlansClient({ userEmail, userType, currentPlan, isSuperAdminOrManager }: PlansClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  // Super Admin/Manager는 뷰 타입을 선택할 수 있음
  const [viewType, setViewType] = useState<'JOBSEEKER' | 'HEADHUNTER'>(
    isSuperAdminOrManager ? 'JOBSEEKER' : (userType === 'HEADHUNTER' ? 'HEADHUNTER' : 'JOBSEEKER')
  )

  // Super Admin/Manager는 viewType에 따라, 일반 사용자는 userType에 따라 플랜 선택
  const effectiveType = isSuperAdminOrManager ? viewType : (userType === 'HEADHUNTER' ? 'HEADHUNTER' : 'JOBSEEKER')
  const plans = effectiveType === 'HEADHUNTER' ? headhunterPlans : individualPlans

  // FAQ 선택
  const faqs = effectiveType === 'HEADHUNTER' ? faqData.HEADHUNTER : faqData.JOBSEEKER

  // 타이틀 및 설명
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
    DEFAULT: {
      title: '나에게 맞는 플랜을 선택하세요',
      subtitle: '합리적인 가격으로 커리어를 설계하고, 이직 성공률을 높이세요',
      badge: '👋 환영합니다',
    },
  }

  const selected = isSuperAdminOrManager
    ? content[effectiveType as keyof typeof content]
    : (userType ? content[userType as keyof typeof content] || content.DEFAULT : content.DEFAULT)

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

        {/* Super Admin/Manager용 뷰 전환 버튼 */}
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
          <span style={{ fontSize: 24 }}>🎉</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fbbf24',
              marginBottom: 4
            }}>
              7월 한정 할인
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)'
            }}>
              모든 유료 플랜 30% 할인 중
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
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.popular
                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px)',
                border: plan.popular
                  ? '2px solid rgba(34, 211, 238, 0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 40,
                position: 'relative',
                transition: 'all 0.3s',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
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

              {/* Current Plan Badge */}
              {currentPlan === plan.name && (
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

              {/* Plan Name */}
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 12
              }}>
                {plan.displayName}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 16 }}>
                {plan.price > 0 ? (
                  <>
                    <div style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: plan.popular ? '#22d3ee' : '#ffffff',
                      lineHeight: 1,
                      marginBottom: 8
                    }}>
                      ₩{plan.price.toLocaleString()}
                      <span style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.5)',
                        marginLeft: 8
                      }}>
                        / 월
                      </span>
                    </div>
                    {plan.originalPrice > plan.price && (
                      <div style={{
                        fontSize: 16,
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'line-through'
                      }}>
                        ₩{plan.originalPrice.toLocaleString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: plan.popular ? '#22d3ee' : '#ffffff',
                    lineHeight: 1,
                    marginBottom: 8
                  }}>
                    무료
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 32,
                paddingBottom: 32,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                {plan.description}
              </div>

              {/* Features */}
              <div style={{ marginBottom: 32 }}>
                {plan.features.map((feature, idx) => (
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
                {plan.limitations.map((limitation, idx) => (
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

              {/* CTA Button */}
              <Link href={plan.name === 'FREE' ? '/analyze' : `/payment?plan=${plan.name}`}>
                <button
                  style={{
                    width: '100%',
                    padding: '16px 32px',
                    background: plan.popular
                      ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: currentPlan === plan.name ? 'default' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: currentPlan === plan.name ? 0.5 : 1
                  }}
                  disabled={currentPlan === plan.name}
                  onMouseEnter={(e) => {
                    if (currentPlan !== plan.name) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = plan.popular
                        ? '0 10px 30px rgba(34, 211, 238, 0.4)'
                        : '0 10px 30px rgba(255,255,255,0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {currentPlan === plan.name
                    ? '현재 사용 중'
                    : plan.name === 'FREE'
                    ? '무료로 시작'
                    : `${plan.displayName} 시작하기`}
                </button>
              </Link>
            </div>
          ))}
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
                    lineHeight: 1.7,
                    animation: 'fadeIn 0.3s ease-in'
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(34, 211, 238, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 211, 238, 0.3)'
            }}>
              무료로 시작하기 →
            </button>
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}
