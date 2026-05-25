const steps = [
  { num: '01', icon: '📤', title: '이력서 업로드', desc: 'PDF 또는 DOCX 형식의 이력서를 업로드하세요. 성명·연락처 등 개인정보는 분석 전 자동 마스킹 처리됩니다.' },
  { num: '02', icon: '🧠', title: 'AI 심층 분석', desc: '직무 적합도·시장 경쟁력·성장 가능성을 점수화하고, 강점·개선점·커리어 경로 3가지를 구체적으로 도출합니다.' },
  { num: '03', icon: '📋', title: 'JD 적합도 분석', desc: '지원하려는 공고를 입력하면 내 이력서 기준으로 매칭 강점, 부족한 점, 어필 전략을 즉시 분석합니다.' },
  { num: '04', icon: '📂', title: '결과 저장 & 활용', desc: '분석 결과는 10일간 저장되어 언제든 다시 확인할 수 있습니다. HTML 리포트 다운로드도 가능합니다.' },
]

export default function HowItWorks() {
  return (
    <section id="how">
      <div className="reveal">
        <div className="section-label">How it works</div>
        <div className="section-title">4단계로<br />커리어가 명확해집니다</div>
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
