import type { UserType } from '@/types/user'

const individualSteps = [
  { num: '01', icon: '📤', title: '이력서 업로드', desc: 'PDF/DOCX 이력서를 업로드하세요. 개인정보는 자동으로 보호됩니다.' },
  { num: '02', icon: '🧠', title: 'JOBIZIC 심층 분석', desc: '직무 적합도, 시장 경쟁력, 성장 가능성을 점수화하고 강점/개선점을 분석합니다.' },
  { num: '03', icon: '📋', title: 'JD 매칭 분석', desc: '지원할 공고를 입력하면 회사 정보를 수집하고 매칭 강점과 어필 전략을 제시합니다.' },
  { num: '04', icon: '✏️', title: '맞춤 이력서 생성', desc: 'JD에 최적화된 이력서를 자동으로 재작성합니다. 자기소개서도 함께 생성됩니다.' },
  { num: '05', icon: '🎤', title: '면접 준비 완성', desc: '예상 질문 10개와 모범 답변, 역질문까지 한 번에 준비됩니다.' },
]

const headhunterSteps = [
  // 후보자 관련 (1-4단계)
  { num: '01', icon: '📤', title: '후보자 이력서 업로드', desc: '후보자 이력서를 업로드하세요. 개인정보는 자동으로 보호됩니다.', category: 'candidate' },
  { num: '02', icon: '🧠', title: 'JOBIZIC 후보자 분석', desc: '강점, 약점, 시장 가치를 점수화하고 추천 포지션과 연봉 밴드를 제시합니다.', category: 'candidate' },
  { num: '03', icon: '📋', title: 'JD 매칭 분석', desc: '클라이언트 JD를 입력하면 적합도를 분석하고 제안 전략을 자동 생성합니다.', category: 'candidate' },
  { num: '04', icon: '📊', title: '클라이언트 제안서 생성', desc: '후보자 강점, JD 매칭, 예상 질문이 포함된 제안서를 HTML/PDF로 다운로드합니다.', category: 'candidate' },
  // 시스템 관리 (5단계)
  { num: '05', icon: '⚙️', title: '시스템 관리 기능', desc: '채용 프로세스 추적, 후보자 현황 관리, 정산 자동화까지 통합 관리합니다.', category: 'system' },
]

export default function HowItWorks({ userType }: { userType?: UserType | null }) {
  const steps = userType === 'HEADHUNTER' ? headhunterSteps : individualSteps

  const content = {
    JOBSEEKER: {
      title: '5단계로\n서류부터 면접까지 준비됩니다',
      sub: '복잡한 설정 없이, 이력서 하나만 있으면 됩니다.',
    },
    HEADHUNTER: {
      title: '후보자 분석 (1-4단계)\n+ 시스템 관리 (5단계)',
      sub: '후보자 관련 업무부터 채용 프로세스 관리까지 한 곳에서.',
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
          <div
            key={s.num}
            className={`how-card ${(s as any).category === 'system' ? 'how-card-system' : ''}`}
          >
            <div className="how-num">{s.num}</div>
            <div className="how-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            {(s as any).category === 'system' && (
              <div style={{
                marginTop: '12px',
                padding: '6px 12px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#fbbf24',
                textAlign: 'center'
              }}>
                ⚙️ 시스템 관리 기능
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
