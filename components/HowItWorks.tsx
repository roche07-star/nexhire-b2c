import type { UserType } from '@/types/user'

const individualSteps = [
  { num: '01', icon: '📤', title: '이력서 업로드', desc: '🎯 PDF 또는 DOCX 형식의 이력서를 업로드하세요. 성명/연락처 등 개인정보는 분석 전 자동 마스킹됩니다.' },
  { num: '02', icon: '🧠', title: 'AI 심층 분석', desc: '🎯 직무 적합도/시장 경쟁력/성장 가능성을 점수화하고, 강점/개선점/커리어 경로 3가지를 도출합니다.' },
  { num: '03', icon: '📋', title: 'JD 적합도 분석', desc: '🎯 지원하려는 공고를 입력하면 회사 정보를 수집 후 매칭 강점/부족한 점/어필 전략을 분석합니다.' },
  { num: '04', icon: '✏️', title: '이력서 자동 생성', desc: '🎯 JD 분석 결과를 반영해 이력서를 자동 재작성합니다. 자기소개서도 함께 최적화됩니다.' },
  { num: '05', icon: '🎤', title: '면접 가이드 생성', desc: '🎯 예상 면접 질문 10개, 이력서 기반 모범 답변, 역질문 3가지를 생성합니다.' },
]

const headhunterSteps = [
  { num: '01', icon: '📤', title: '후보자 이력서 업로드', desc: '💼 후보자의 이력서를 업로드하세요. PDF/DOCX 형식 지원. 개인정보는 자동 마스킹됩니다.' },
  { num: '02', icon: '🧠', title: 'AI 후보자 분석', desc: '💼 후보자 강점/약점/시장 가치를 점수화하고, 추천 포지션과 연봉 밴드를 도출합니다.' },
  { num: '03', icon: '📋', title: 'JD 매칭 분석', desc: '💼 클라이언트 JD를 입력하면 후보자 적합도를 분석하고 제안 전략을 자동 생성합니다.' },
  { num: '04', icon: '📊', title: '클라이언트 제안서 생성', desc: '💼 후보자 강점, JD 매칭, 예상 질문까지 포함된 제안서를 HTML/PDF로 다운로드합니다.' },
  { num: '05', icon: '🤝', title: '기업 플랫폼 연동 (Pro 이상)', desc: '💼 B2B 플랫폼과 연동하여 후보자 관리, 파이프라인 추적, 팀 협업까지 한 곳에서.' },
]

export default function HowItWorks({ userType }: { userType?: UserType | null }) {
  const steps = userType === 'HEADHUNTER' ? headhunterSteps : individualSteps

  const content = {
    INDIVIDUAL: {
      title: '5단계로\n서류부터 면접까지 준비됩니다',
      sub: '복잡한 설정 없이, 이력서 하나만 있으면 됩니다.',
    },
    HEADHUNTER: {
      title: '후보자 분석부터\n클라이언트 제안까지 2분',
      sub: '이력서 업로드 하나로 제안서까지 자동 완성됩니다.',
    },
    DEFAULT: {
      title: '5단계로\n서류부터 면접까지 준비됩니다',
      sub: '복잡한 설정 없이, 이력서 하나만 있으면 됩니다.',
    },
  }

  const selected = userType ? content[userType] : content.DEFAULT

  return (
    <section id="how">
      <div className="reveal">
        <div className="section-label">How it works</div>
        <div className="section-title">{selected.title}</div>
        <p className="section-sub">{selected.sub}</p>
      </div>
      <div className="how-grid reveal">
        {steps.map((s) => (
          <div key={s.num} className="how-card">
            <div className="how-num">{s.num}</div>
            <div className="how-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
