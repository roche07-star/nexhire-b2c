const steps = [
  { num: '01', icon: '📤', title: '이력서 업로드', desc: 'PDF, DOCX, HWP 형식의 이력서를 업로드하세요. 한글 이력서도 완벽하게 분석합니다.' },
  { num: '02', icon: '🧠', title: 'AI 심층 분석', desc: '경력, 스킬, 성과를 분해하여 강점과 시장 포지션을 정밀하게 파악합니다.' },
  { num: '03', icon: '🗺️', title: '커리어 로드맵 제공', desc: '구체적인 직무 추천, 보완할 역량, 목표 기업까지 맞춤형 방향을 제시합니다.' },
]

export default function HowItWorks() {
  return (
    <section id="how">
      <div className="reveal">
        <div className="section-label">How it works</div>
        <div className="section-title">3단계로<br />커리어가 명확해집니다</div>
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
