import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '₩0',
    desc: '부담 없이 시작하는 첫 분석',
    features: [
      '이력서 분석 1회/월',
      '기본 점수 리포트 (3가지 지표)',
      '커리어 방향 1가지 제안',
    ],
    disabled: [
      'JD 적합도 분석',
      '커리어 경로 3가지 + 연봉 밴드',
      '분석 결과 10일 저장',
      'HTML 리포트 다운로드',
      '이력서 리라이팅 (출시 예정)',
    ],
    btnClass: 'btn-plan-outline',
    btnText: '무료로 시작',
    href: '/analyze',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₩19,900',
    desc: '진지하게 이직을 준비하는 분',
    features: [
      '이력서 분석 무제한',
      '심층 리포트 + 커리어 경로 3가지',
      '연봉 밴드 (BASELINE · RECOMMENDED · STRETCH)',
      'JD 적합도 분석',
      '분석 결과 10일 저장',
      'HTML 리포트 다운로드',
    ],
    disabled: [
      '이력서 리라이팅 (출시 예정)',
    ],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro 시작하기',
    href: '/analyze',
    featured: true,
  },
  {
    name: 'Expert',
    price: '₩49,900',
    desc: '커리어 전환을 확실히 하고 싶은 분',
    features: [
      'Pro의 모든 기능',
      '이력서 리라이팅 출시 시 우선 제공',
      '신규 기능 우선 접근',
      '전담 지원 채널',
    ],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: 'Expert 신청',
    href: '/analyze',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing">
      <div className="reveal" style={{ textAlign: 'center' }}>
        <div className="section-label">Pricing</div>
        <div className="section-title">합리적인 가격으로<br />커리어를 설계하세요</div>
        <p className="section-sub" style={{ margin: '0 auto' }}>첫 분석은 무료. 부담 없이 시작해보세요.</p>
      </div>
      <div className="pricing-grid reveal">
        {plans.map((plan) => (
          <div key={plan.name} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
            {plan.featured && <div className="featured-badge">가장 인기</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">{plan.price} <span>/ 월</span></div>
            <div className="plan-desc">{plan.desc}</div>
            <ul className="plan-features">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
              {plan.disabled.map((f) => <li key={f} className="disabled">{f}</li>)}
            </ul>
            <Link href={plan.href}>
              <button className={`btn-plan ${plan.btnClass}`}>{plan.btnText}</button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
