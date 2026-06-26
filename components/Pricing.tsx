import Link from 'next/link'
import type { UserType } from '@/types/user'

const individualPlans = [
  {
    name: 'Free',
    price: '₩0',
    desc: '🎯 이직 방향이 궁금한 직장인을 위해',
    features: ['이력서 분석 3회/월', 'JD 적합도 분석 3회/월', '이력서 생성 3회/월', '기본 점수 리포트', '커리어 방향 1가지 제안', 'HTML 화면 보기 (다운로드 불가)'],
    disabled: ['면접 가이드', 'HTML 리포트 다운로드'],
    btnClass: 'btn-plan-outline',
    btnText: '무료로 시작',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₩9,900',
    desc: '🎯 본격적으로 이직을 준비 중인 재직자',
    features: ['이력서 분석 30회/월', 'JD 적합도 분석 30회/월', '이력서 생성 10회/월', '심층 점수 리포트', '커리어 방향 3가지 제안', '분석 결과 영구 저장', 'HTML 리포트 다운로드'],
    disabled: ['면접 가이드'],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro 시작하기',
    featured: true,
  },
  {
    name: 'Expert',
    price: '₩29,900',
    desc: '🎯 최종 합격까지 끝내고 싶은 진지한 이직자',
    features: ['이력서 분석 50회/월', 'JD 적합도 분석 50회/월', '이력서 생성 50회/월', '면접 가이드 50회/월', '심층 점수 리포트', '커리어 방향 3가지 제안', '분석 결과 영구 저장', 'HTML 리포트 다운로드'],
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
    features: ['후보자 분석 3회/월', 'JD 적합도 분석 3회/월', '기본 매칭 리포트', 'HTML 화면 보기 (다운로드 불가)'],
    disabled: ['클라이언트 제안서 생성', '대량 분석', '기업 플랫폼 연동', 'HTML 리포트 다운로드'],
    btnClass: 'btn-plan-outline',
    btnText: '무료로 시작',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₩19,900',
    desc: '💼 월 10-30건 매칭하는 헤드헌터',
    features: ['후보자 분석 100회/월', 'JD 적합도 분석 100회/월', '클라이언트 제안서 자동 생성', '심층 매칭 리포트', '분석 결과 영구 저장', 'HTML/PDF 리포트 다운로드', '후보자 관리 대시보드'],
    disabled: ['기업 플랫폼 연동', '프리미엄 템플릿'],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro 시작하기',
    featured: true,
  },
  {
    name: 'Expert',
    price: '₩49,900',
    desc: '💼 대형 헤드헌팅펌 / 리크루팅 에이전시',
    features: ['후보자 분석 무제한', 'JD 적합도 분석 무제한', '클라이언트 제안서 무제한', '기업 플랫폼 연동', '프리미엄 템플릿', '대량 분석 (엑셀 업로드)', '팀 협업 기능', 'API 접근 (상담)'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: 'Expert 신청',
    featured: false,
  },
]

export default function Pricing({ userType }: { userType?: UserType | null }) {
  // 헤드헌터만 headhunterPlans, 나머지(비로그인, 개인, 미선택)는 individualPlans
  const plans = userType === 'HEADHUNTER' ? headhunterPlans : individualPlans

  const content = {
    JOBSEEKER: {
      title: '합리적인 가격으로\n커리어를 설계하세요',
      sub: '첫 분석은 무료. 부담 없이 시작해보세요.',
    },
    HEADHUNTER: {
      title: '후보자 분석 시간을\n1/10로 단축하세요',
      sub: '월 정액제로 무제한 분석. 헤드헌터의 시간은 더 가치 있는 곳에.',
    },
    DEFAULT: {
      title: '합리적인 가격으로\n커리어를 설계하세요',
      sub: '첫 분석은 무료. 부담 없이 시작해보세요.', // 비로그인 = 개인 요금제 표시
    },
  }

  const selected = userType ? content[userType] : content.DEFAULT

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
