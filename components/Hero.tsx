export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-grid" />

      <div className="hero-badge">
        <div className="badge-dot" />
        AI 커리어 분석 플랫폼 — 오픈 베타
      </div>

      <h1>
        이력서 하나로,<br />
        <span className="line2">다음 커리어를 설계하세요</span>
      </h1>

      <p className="hero-sub">
        이력서를 업로드하면 AI가 강점을 분석하고,<br />
        당신에게 맞는 커리어 방향을 구체적으로 제시합니다.
      </p>

      <div className="hero-actions">
        <button className="btn-hero">이력서 분석 시작하기 →</button>
        <button className="btn-hero-ghost">데모 보기</button>
      </div>

      <div className="hero-demo">
        <div className="demo-card">
          <div className="demo-header">
            <div className="demo-dots">
              <div className="demo-dot" />
              <div className="demo-dot" />
              <div className="demo-dot" />
            </div>
            <div className="demo-title-bar">nexhire.co/analyze</div>
          </div>
          <div className="demo-body">
            <div className="demo-upload">
              <div className="upload-icon">📄</div>
              <div className="upload-label">
                <strong>이력서를 드래그하거나 클릭</strong><br />
                PDF, DOCX, HWP 지원
              </div>
              <div className="typewriter">AI 분석 중...</div>
            </div>
            <div className="demo-result">
              <div className="result-tag">✦ 분석 완료</div>
              <div className="result-score">
                <div className="score-label">MATCH SCORE</div>
                <div className="score-row"><span className="score-name">직무 적합도</span><span className="score-val">87%</span></div>
                <div className="score-bar-wrap"><div className="score-bar" style={{ width: '87%' }} /></div>
                <div className="score-row"><span className="score-name">시장 경쟁력</span><span className="score-val">74%</span></div>
                <div className="score-bar-wrap"><div className="score-bar" style={{ width: '74%' }} /></div>
                <div className="score-row"><span className="score-name">성장 가능성</span><span className="score-val">92%</span></div>
                <div className="score-bar-wrap"><div className="score-bar" style={{ width: '92%' }} /></div>
              </div>
              <div className="result-direction">
                <div className="dir-label">💡 추천 커리어 방향</div>
                <div className="dir-items">
                  <div className="dir-item">Product Manager (AI/SaaS)</div>
                  <div className="dir-item">Business Development</div>
                  <div className="dir-item">Strategy Consultant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
