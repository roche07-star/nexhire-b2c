const steps = [
  { num: '01', icon: '📤', title: '이력서 업로드', desc: 'PDF 또는 DOCX 형식의 이력서를 업로드하세요. 성명·연락처 등 개인정보는 분석 전 자동 마스킹 처리되어 AI에 전송되지 않습니다.' },
  { num: '02', icon: '🧠', title: 'AI 심층 분석', desc: '직무 적합도·시장 경쟁력·성장 가능성을 점수화하고, 강점·개선점·커리어 경로 3가지와 연봉 밴드를 구체적으로 도출합니다.' },
  { num: '03', icon: '📋', title: 'JD 적합도 분석', desc: '지원하려는 공고를 입력하면 회사 실제 정보를 웹에서 수집한 뒤, 내 이력서 기준으로 매칭 강점·부족한 점·어필 전략을 즉시 분석합니다.' },
  { num: '04', icon: '✏️', title: '이력서 자동 생성', desc: 'JD 분석 결과를 반영해 이력서를 자동으로 재작성합니다. 자기소개서도 함께 최적화되며, 변경된 항목을 다운로드 후 바로 확인할 수 있습니다.' },
  { num: '05', icon: '🎤', title: '면접 가이드 생성', desc: 'JD와 내 이력서를 기반으로 예상 면접 질문 10개, 이력서 기반 모범 답변, 역질문 3가지를 생성합니다. 면접 당일까지 반복 활용하세요.' },
]

export default function HowItWorks() {
  return (
    <section id="how">
      <div className="reveal">
        <div className="section-label">How it works</div>
        <div className="section-title">5단계로<br />서류부터 면접까지 준비됩니다</div>
        <p className="section-sub">복잡한 설정 없이, 이력서 하나만 있으면 됩니다.</p>
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
