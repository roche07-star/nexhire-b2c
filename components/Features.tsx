const features = [
  {
    icon: '🔍',
    title: '이력서 심층 분석',
    desc: '단순 맞춤법 교정이 아닌, 직무 연관성·성과 표현·키워드 밀도를 종합 평가합니다.',
    tags: ['JD 매칭', '키워드 분석', '강약점 도출'],
    wide: false,
  },
  {
    icon: '🎯',
    title: '맞춤 커리어 방향성',
    desc: '현재 이력을 기반으로 3~5가지 커리어 경로를 구체적으로 제안하고, 각 경로의 현실적인 가능성을 분석합니다.',
    tags: ['직무 추천', '산업 매칭', '성장 경로'],
    wide: false,
  },
  {
    icon: '⚡',
    title: '이력서 자동 리라이팅',
    desc: '분석 결과를 바탕으로 채용 담당자가 긍정적으로 읽히도록 이력서를 자동으로 다듬어줍니다. 한국 정서에 맞는 자연스러운 표현으로 교정하며, 과장 없이 임팩트 있게 정리합니다.',
    tags: ['자동 교정', '한국어 최적화', '직무별 맞춤', '즉시 다운로드'],
    wide: true,
  },
]

export default function Features() {
  return (
    <section id="features">
      <div className="reveal">
        <div className="section-label">Features</div>
        <div className="section-title">단순 분석이 아닌<br />실행 가능한 인사이트</div>
        <p className="section-sub">헤드헌터의 시각으로 이력서를 읽고, AI의 속도로 방향을 제시합니다.</p>
      </div>
      <div className="features-grid reveal">
        {features.map((f) => (
          <div key={f.title} className={`feature-card${f.wide ? ' wide' : ''}`}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
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
