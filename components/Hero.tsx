'use client'

import Link from 'next/link'
import { useState } from 'react'

const careerPaths = [
  {
    type: 'BASELINE',
    label: '현재 경로 유지',
    title: 'B2B 마케팅 팀장',
    salary: '4,200만원~5,500만원',
    salaryColor: 'var(--muted2)',
    desc: 'GTM·마케팅 전문성 심화',
    bands: [
      { label: '현재(3년차)', min: 0, max: 0, pct: 0 },
      { label: '1년 뒤', min: 4200, max: 4800, pct: 45 },
      { label: '3년 뒤', min: 4800, max: 5200, pct: 58 },
      { label: '5년 뒤', min: 5200, max: 5800, pct: 68 },
      { label: '7년 뒤+', min: 5500, max: 6500, pct: 78 },
    ],
    points: [
      'GTM 전략 전문가로 SaaS 기업 마케팅 리더 성장',
      'B2B 세일즈·마케팅 경력 심화로 안정적 처우 향상',
      '대형 SaaS 기업 마케팅 팀장 이직으로 연봉 점프 가능',
    ],
  },
  {
    type: 'RECOMMENDED',
    label: '추천 경로',
    title: 'Product Manager (AI/SaaS)',
    salary: '4,800만원~7,500만원',
    salaryColor: '#e8a020',
    desc: 'GTM 경험 + PM 전환, 시장 수요 최고',
    bands: [
      { label: '현재(3년차)', min: 0, max: 0, pct: 0 },
      { label: '1년 뒤', min: 4800, max: 5500, pct: 55 },
      { label: '3년 뒤', min: 5500, max: 6500, pct: 70 },
      { label: '5년 뒤', min: 6500, max: 7500, pct: 85 },
      { label: '7년 뒤+', min: 7000, max: 9000, pct: 95 },
    ],
    points: [
      'B2B GTM 경험은 SaaS PM 전환 시 핵심 강점으로 작용',
      'SQL·데이터 분석 역량이 데이터 기반 PM으로 차별화',
      'AI 스타트업 시리즈A·B 기업에서 즉시 전력 가능',
      '3년 내 Senior PM → 4~5년차에 Head of Product 도약 경로',
    ],
  },
  {
    type: 'STRETCH',
    label: '고성장 경로',
    title: 'SaaS 창업 / VC 투자심사역',
    salary: '6,000만원~1억+',
    salaryColor: 'var(--accent)',
    desc: '높은 리스크, 높은 보상',
    bands: [
      { label: '현재(3년차)', min: 0, max: 0, pct: 0 },
      { label: '1년 뒤', min: 5500, max: 7000, pct: 68 },
      { label: '3년 뒤', min: 6500, max: 9000, pct: 82 },
      { label: '5년 뒤', min: 8000, max: 12000, pct: 92 },
      { label: '7년 뒤+', min: 10000, max: 0, pct: 100 },
    ],
    points: [
      'B2B SaaS 도메인 지식 + GTM 경험으로 창업 적합도 높음',
      'VC 투자심사역 전환 시 SaaS 포트폴리오 검토 역량 인정',
      '리스크 높음 — 네트워크와 자본 확보 전략이 선행되어야 함',
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
          <h2 className="demo-modal-title">3년차 B2B SaaS 마케터 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '18px' }}>· 연봉 3,800만원</span></h2>
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
            <p className="result-summary">B2B SaaS 기업에서 GTM 전략 수립과 실행을 주도한 3년차 마케터로, 데이터 기반 의사결정과 SQL 분석 역량이 강점입니다. PM 전환 시 즉시 전력이 가능하며, AI·SaaS 분야 Product Manager로의 커리어 전환을 강력히 추천합니다.</p>
          </div>

          <div className="demo-grid">
            <div className="results-section">
              <div className="results-label">핵심 키워드</div>
              <div className="keyword-chips">
                {['GTM 전략', 'B2B SaaS', 'SQL', '데이터 분석', 'OKR', 'Figma', '애자일', 'CRM'].map((k) => (
                  <span key={k} className="keyword-chip">{k}</span>
                ))}
              </div>
            </div>
            <div className="results-section">
              <div className="results-label">✦ 강점</div>
              <ul className="result-list">
                <li>B2B GTM 전 과정 실행 경험 (리드 발굴~클로징)</li>
                <li>SQL로 퍼널 분석·성과 측정 직접 수행</li>
                <li>스타트업 초기 멤버로 0→1 성장 경험 보유</li>
                <li>영어 비즈니스 커뮤니케이션 능숙</li>
              </ul>
            </div>
            <div className="results-section">
              <div className="results-label">개선 포인트</div>
              <ul className="result-list improvement-list">
                <li>PM 전환을 위한 프로덕트 스펙 작성 경험 부족</li>
                <li>리더십·팀 관리 경험 이력서에 명시 필요</li>
                <li>사이드 프로젝트 또는 PM 부트캠프 이수 권장</li>
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
            <div className="salary-band-title">연봉 밴드 — {active.label} · 현재 기준: 3년차 (단위: 만원)</div>
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
        JD 적합도까지 — 지원 전략을 한 번에 완성합니다.
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
            <div className="demo-title-bar">jobizic.io/analyze</div>
          </div>
          <div className="demo-body">
            <div className="demo-upload">
              <div className="upload-icon">📄</div>
              <div className="upload-label">
                <strong>이력서를 드래그하거나 클릭</strong><br />
                PDF, DOCX · 최대 10MB
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
                <div className="dir-label">💡 커리어 경로 추천</div>
                <div className="dir-items">
                  <div className="dir-item">BASELINE — B2B 마케팅 팀장</div>
                  <div className="dir-item">RECOMMENDED — PM (AI/SaaS)</div>
                  <div className="dir-item">STRETCH — SaaS 창업 / VC</div>
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
