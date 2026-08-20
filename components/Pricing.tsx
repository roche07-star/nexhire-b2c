'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { RegularUserType } from '@/types/user'

const individualPlans = [
  {
    name: 'Free',
    price: '₩0',
    desc: '🎯 이직 방향이 궁금한 직장인을 위해',
    features: ['이력서 분석 3회/월', 'JD 적합도 분석 3회/월', '이력서 생성 1회/월', '주간 Report 2회/월', '기본 점수 리포트', '커리어 방향 1가지 제안', '~~이력서 다운로드~~', '~~면접 가이드~~'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: '무료로 시작',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₩9,900',
    desc: '🎯 본격적으로 이직을 준비 중인 재직자',
    features: ['이력서 분석 20회/월', 'JD 적합도 분석 20회/월', '이력서 생성 10회/월', '면접 가이드 10회/월', '주간 Report 4회/월', '월간 Report 1회/월', '이력서/면접가이드 다운로드 가능'],
    disabled: [],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro 시작하기',
    featured: true,
  },
  {
    name: 'Expert',
    price: '₩29,900',
    desc: '🎯 최종 합격까지 끝내고 싶은 진지한 이직자',
    features: ['이력서 분석 30회/월', 'JD 적합도 분석 30회/월', '이력서 생성 20회/월', '면접 가이드 20회/월', '주간 Report 4회/월', '월간 Report 1회/월', '이력서/면접가이드 다운로드 가능'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: 'Expert 신청',
    featured: false,
  },
]

const headhunterPlans = [
  {
    name: 'Free',
    price: '₩0',
    desc: '💼 후보자 분석이 처음인 헤드헌터',
    features: ['후보자 분석 3회/월', 'JD 적합도 분석 3회/월', '이력서 생성 1회/월', '기본 매칭 리포트', '~~클라이언트 제안서 생성~~', '~~정산 기능~~', '~~채용 프로세스 기능~~', '~~이력서 다운로드~~'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: '무료로 시작',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₩19,900',
    desc: '💼 월 10-30건 매칭하는 헤드헌터',
    features: ['이력서 분석 25회/월', 'JD 적합도 분석 25회/월', '이력서 생성 15회/월', '면접 가이드 15회/월', '제안서 20회/월', '정산 기능 가능', '채용 프로세스 제공', '모든 다운로드 가능'],
    disabled: [],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro 시작하기',
    featured: true,
  },
  {
    name: 'Expert',
    price: '₩49,900',
    desc: '💼 전문 헤드헌터',
    features: ['이력서 분석 50회/월', 'JD 적합도 분석 50회/월', '이력서 생성 25회/월', '면접 가이드 25회/월', '제안서 50회/월', '정산 기능 가능', '채용 프로세스 제공', '모든 다운로드 가능'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: 'Expert 신청',
    featured: false,
  },
]

export default function Pricing({ userType }: { userType?: RegularUserType | null }) {
  const [selectedType, setSelectedType] = useState<'JOBSEEKER' | 'HEADHUNTER'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('landing_user_type')
      return (saved === 'HEADHUNTER' || saved === 'JOBSEEKER') ? saved : 'JOBSEEKER'
    }
    return 'JOBSEEKER'
  })

  // Hero에서 타입 변경 시 동기화
  useEffect(() => {
    const handleTypeChange = (e: CustomEvent) => {
      setSelectedType(e.detail)
    }
    window.addEventListener('landing_type_change', handleTypeChange as EventListener)
    return () => window.removeEventListener('landing_type_change', handleTypeChange as EventListener)
  }, [])

  // 로그인 사용자는 본인 타입, 비로그인은 선택한 타입
  const effectiveType = userType || selectedType
  const plans = effectiveType === 'HEADHUNTER' ? headhunterPlans : individualPlans

  const content = {
    JOBSEEKER: {
      title: '합리적인 가격으로\n커리어를 설계하세요',
      sub: '첫 분석은 무료. 부담 없이 시작해보세요.',
    },
    HEADHUNTER: {
      title: '후보자 분석 시간을\n1/10로 단축하세요',
      sub: '월 정액제로 매칭 효율 극대화. 헤드헌터의 시간은 더 가치 있는 곳에.',
    },
  }

  const selected = content[effectiveType]

  return (
    <section id="pricing">
      <div className="reveal" style={{ textAlign: 'center' }}>
        <div className="section-label">Pricing</div>
        <div className="section-title">{selected.title}</div>
        <p className="section-sub" style={{ margin: '0 auto' }}>{selected.sub}</p>
      </div>
      <div className="pricing-grid reveal">
        {plans.map((plan) => (
          <div key={plan.name} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
            {plan.featured && <div className="featured-badge">가장 인기</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">{plan.price} <span>/ 월</span></div>
            <div className="plan-desc">{plan.desc}</div>
            <ul className="plan-features">
              {plan.features.map((f) => {
                const isStrikethrough = f.startsWith('~~') && f.endsWith('~~')
                const displayText = isStrikethrough ? f.slice(2, -2) : f
                return (
                  <li
                    key={f}
                    style={{
                      textDecoration: isStrikethrough ? 'line-through' : 'none',
                      opacity: isStrikethrough ? 0.5 : 1
                    }}
                  >
                    {displayText}
                  </li>
                )
              })}
              {plan.disabled.map((f) => <li key={f} className="disabled">{f}</li>)}
            </ul>
            <Link href={plan.name === 'Free' ? '/login?callbackUrl=/analyze' : '/plans'}>
              <button className={`btn-plan ${plan.btnClass}`}>{plan.btnText}</button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
