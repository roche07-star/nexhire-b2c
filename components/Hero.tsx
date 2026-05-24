'use client'

import Link from 'next/link'
import { useState } from 'react'

const careerPaths = [
  {
    type: 'BASELINE',
    label: '현재 경로 유지',
    title: 'IT 기획/운영',
    salary: '3,800만원~4,500만원',
    salaryColor: 'var(--muted2)',
    desc: '현재 역량 기반, 안정적 성장',
    bands: [
      { label: '현재', min: 0, max: 0, pct: 0 },
      { label: '1년차', min: 3800, max: 4200, pct: 40 },
      { label: '3년차', min: 4200, max: 4800, pct: 55 },
      { label: '5년차', min: 4800, max: 5500, pct: 70 },
      { label: '7년차+', min: 5500, max: 6000, pct: 80 },
    ],
    points: [
      '현재 기획 역량을 바탕으로 안정적 성장 가능',
      'IT 서비스 기획 → 프로덕트 오너 전환 경로',
      '대기업 IT 계열사 이직으로 처우 개선 가능',
    ],
  },
  {
    type: 'RECOMMENDED',
    label: '추천 경로',
    title: 'Product Manager (AI/SaaS)',
    salary: '4,500만원~7,000만원',
    salaryColor: '#e8a020',
    desc: '성장성 + 시장 수요 최적 조합',
    bands: [
      { label: '현재', min: 0, max: 0, pct: 0 },
      { label: '1년차', min: 4500, max: 5000, pct: 50 },
      { label: '3년차', min: 5200, max: 6000, pct: 65 },
      { label: '5년차', min: 6000, max: 6800, pct: 80 },
      { label: '7년차+', min: 6500, max: 7000, pct: 90 },
    ],
    points: [
      'AI/SaaS PM 수요 급증 — 이직 성공률 높음',
      '데이터 기반 의사결정 경험을 강점으로 어필',
      '스타트업 → 성장기 테크 기업 순서로 이동 권장',
      '3~4년차에 시리즈B+ 기업 Senior PM 도약 가능',
    ],
  },
  {
    type: 'STRETCH',
    label: '고성장 경로',
    title: '전략 컨설턴트 / 스타트업 COO',
    salary: '6,000만원~1억+',
    salaryColor: 'var(--accent)',
    desc: '높은 도전, 높은 보상',
    bands: [
      { label: '현재', min: 0, max: 0, pct: 0 },
      { label: '1년차', min: 5500, max: 6500, pct: 65 },
      { label: '3년차', min: 6500, max: 8000, pct: 78 },
      { label: '5년차', min: 8000, max: 10000, pct: 90 },
      { label: '7년차+', min: 10000, max: 0, pct: 100 },
    ],
    points: [
      'MBA 또는 탑티어 컨설팅펌 경력 병행 시 유리',
      '스타트업 초기 멤버로 합류 후 지분 확보 전략',
      '높은 리스크 — 실행력과 네트워크가 핵심',
    ],
  },
]

function DemoModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(1)
  const active = careerPaths[activeTab]

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>✕</button>
        <div className="demo-modal-header">
          <div className="section-label">SAMPLE ANALYSIS — PRO</div>
          <h2 className="demo-modal-title">커리어 방향 분석</h2>
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

          <div className="results-label" style={{ marginTop: 8 }}>💡 커리어 방향 분석</div>

          {/* 3 career cards */}
          <div className="career-cards">
            {careerPaths.map((p, i) => (
              <button
                key={p.type}
                className={`career-card${i === activeTab ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                <div className="career-card-type">{p.type}</div>
                <div className="career-card-salary" style={{ color: p.salaryColor }}>{p.salary}</div>
                <div className="career-card-title">{p.title}</div>
              </button>
            ))}
          </div>

          {/* Tab selector */}
          <div className="career-tabs">
            {careerPaths.map((p, i) => (
              <button
                key={p.type}
                className={`career-tab${i === activeTab ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                <span className="career-tab-label">{p.type}</span>
                <span className="career-tab-sub">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Salary band chart */}
          <div className="salary-band-wrap">
            <div className="salary-band-title">연봉 밴드 — {active.label} (단위: 만원)</div>
            {active.bands.map((b) => (
              <div key={b.label} className="salary-band-row">
                <span className="salary-band-year">{b.label}</span>
                <div className="salary-band-bar-wrap">
                  <div className="salary-band-bar" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="salary-band-range">
                  {b.pct === 0 ? '–' : b.max ? `${b.min.toLocaleString()}~${b.max.toLocaleString()}` : `${b.min.toLocaleString()}+`}
                </span>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="career-detail">
            <div className="career-detail-badge">{active.type}</div>
            <div className="career-detail-header">
              <span className="career-detail-title">{active.title}</span>
              <span className="career-detail-salary" style={{ color: active.salaryColor }}>{active.salary}</span>
            </div>
            <ul className="career-detail-list">
              {active.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          <Link href="/analyze">
            <button className="btn-hero" style={{ width: '100%', marginTop: 4 }}>
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
