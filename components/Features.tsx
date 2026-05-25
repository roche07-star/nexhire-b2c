const features = [
  {
    icon: '🔍',
    title: '이력서 심층 분석',
    desc: '직무 적합도·시장 경쟁력·성장 가능성을 점수화하고 강점·개선점·핵심 키워드를 한눈에 정리합니다. PRO는 BASELINE / RECOMMENDED / STRETCH 3가지 커리어 경로와 연봉 밴드까지 제시합니다.',
    tags: ['Match Score', '강점 도출', '커리어 경로 3가지', '연봉 밴드'],
    wide: false,
    soon: false,
  },
  {
    icon: '📋',
    title: 'JD 적합도 분석',
    desc: '지원할 채용공고를 붙여넣으면 내 이력서 분석 결과 기반으로 매칭 강점, 부족한 점, 어필 전략을 즉시 도출합니다. 헤드헌터 시각의 냉정한 실전 피드백을 제공합니다.',
    tags: ['적합도 점수', '매칭 강점', '부족한 점', '어필 전략'],
    wide: false,
    soon: false,
  },
  {
    icon: '✏️',
    title: '이력서 자동 리라이팅',
    desc: '분석 결과를 바탕으로 채용 담당자가 긍정적으로 읽히도록 이력서를 자동으로 다듬어줍니다. 과장 없이 임팩트 있게 — 지원 직무에 최적화된 표현으로 교정합니다.',
    tags: ['자동 교정', '직무별 맞춤', '즉시 다운로드'],
    wide: true,
    soon: true,
  },
]

export default function Features() {
  return (
    <section id="features">
      <div className="reveal">
        <div className="section-label">Features</div>
        <div className="section-title">단순 분석이 아닌<br />실행 가능한 인사이트</div>
        <p className="section-sub">헤드헌터의 시각으로 이력서를 읽고, AI의 속도로 전략을 제시합니다.</p>
      </div>
      <div className="features-grid reveal">
        {features.map((f) => (
          <div key={f.title} className={`feature-card${f.wide ? ' wide' : ''}`}>
            <div className="feature-icon">{f.icon}</div>
            <h3>
              {f.title}
              {f.soon && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle' }}>출시 예정</span>}
            </h3>
            <p>{f.desc}</p>
            <div className="feature-tags">
              {f.tags.map((tag) => <span key={tag} className="ftag">{tag}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
