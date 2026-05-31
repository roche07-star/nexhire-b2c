import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '₩0',
    desc: '시작하는 구직자를 위해',
    features: ['이력서 분석 3회/월', '기본 점수 리포트', '커리어 방향 1가지 제안'],
    disabled: ['JD 적합도 분석', '이력서 생성', '면접 가이드', 'HTML 리포트 다운로드'],
    btnClass: 'btn-plan-outline',
    btnText: '무료로 시작',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₩19,900',
    desc: '진지하게 이직을 준비하는 분',
    features: ['이력서 분석 10회/월', 'JD 적합도 분석 15회/월', '이력서 생성 3회/월', '심층 점수 리포트', '커리어 방향 3가지 제안', '분석 결과 영구 저장', 'HTML 리포트 다운로드'],
    disabled: ['면접 가이드'],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro 시작하기',
    featured: true,
  },
  {
    name: 'Expert',
    price: '₩49,900',
    desc: '서류부터 면접까지 완전히 준비하는 분',
    features: ['이력서 분석 30회/월', 'JD 적합도 분석 30회/월', '이력서 생성 15회/월', '면접 가이드 15회/월', '심층 점수 리포트', '커리어 방향 3가지 제안', '분석 결과 영구 저장', 'HTML 리포트 다운로드'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: 'Expert 신청',
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
            <Link href="/analyze">
              <button className={`btn-plan ${plan.btnClass}`}>{plan.btnText}</button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
