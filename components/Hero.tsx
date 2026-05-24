'use client'

import Link from 'next/link'
import { useState } from 'react'

function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>✕</button>
        <div className="demo-modal-header">
          <div className="section-label">SAMPLE ANALYSIS</div>
          <h2 className="demo-modal-title">AI 분석 결과 미리보기</h2>
          <p className="demo-modal-sub">실제 분석 결과는 업로드한 이력서 내용에 따라 달라집니다.</p>
        </div>

        <div className="demo-modal-body">
          <div className="demo-scores">
            <div className="results-label">MATCH SCORE</div>
            {[
              { label: '직무 적합도', val: 87 },
              { label: '시장 경쟁력', val: 74 },
              { label: '성장 가능성', val: 92 },
            ].map((s) => (
              <div key={s.label} className="result-score-row">
                <div className="score-meta">
                  <span className="score-name">{s.label}</span>
                  <span className="score-val">{s.val}%</span>
                </div>
                <div className="score-bar-wrap">
                  <div className="score-bar" style={{ width: `${s.val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="demo-summary-block">
            <div className="results-label">종합 요약</div>
            <p className="result-summary">마케팅과 데이터 분석 역량을 겸비한 지원자로, B2B SaaS 환경에서 전략 기획 및 GTM 실행 경험이 돋보입니다. 빠르게 성장하는 AI 스타트업 또는 테크 기업의 PM/전략 포지션에 높은 적합도를 보입니다.</p>
          </div>

          <div className="demo-grid">
            <div className="results-section">
              <div className="results-label">💡 추천 커리어 방향</div>
              <ul className="result-list career-list">
                <li>Product Manager (AI/SaaS)</li>
                <li>Business Development Lead</li>
                <li>Strategy Consultant</li>
              </ul>
            </div>
            <div className="results-section">
              <div className="results-label">핵심 키워드</div>
              <div className="keyword-chips">
                {['GTM 전략', 'SaaS', '데이터 분석', 'B2B', 'SQL', 'Figma', '애자일', 'OKR'].map((k) => (
                  <span key={k} className="keyword-chip">{k}</span>
                ))}
              </div>
            </div>
            <div className="results-section">
              <div className="results-label">✦ 강점</div>
              <ul className="result-list">
                <li>다양한 산업군에서의 전략 기획 경험</li>
                <li>정량적 성과 중심의 이력서 서술</li>
                <li>글로벌 팀 협업 및 영어 커뮤니케이션</li>
                <li>빠른 실행력과 스타트업 적응력</li>
              </ul>
            </div>
            <div className="results-section">
              <div className="results-label">개선 포인트</div>
              <ul className="result-list improvement-list">
                <li>기술 스택 명시가 부족함 (개발 협업 역량 강조 필요)</li>
                <li>리더십 경험 구체화 필요</li>
                <li>포트폴리오 또는 사이드 프로젝트 추가 권장</li>
              </ul>
            </div>
          </div>

          <Link href="/analyze">
            <button className="btn-hero" style={{ width: '100%', marginTop: 8 }}>
              내 이력서 분석하기 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const [showDemo, setShowDemo] = useState(false)

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
        <Link href="/analyze"><button className="btn-hero">이력서 분석 시작하기 →</button></Link>
        <button className="btn-hero-ghost" onClick={() => setShowDemo(true)}>데모 보기</button>
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

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </section>
  )
}
