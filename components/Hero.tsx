'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

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

const jdDemo = {
  company: '토스',
  position: 'Product Manager (AI Growth)',
  fit_score: 82,
  recommendation: 'APPLY' as const,
  verdict: 'GTM·SQL 이중 강점이 토스 PM 핵심 요구와 80% 일치 — PRD 작성 이력 부재가 유일한 리스크, 포트폴리오 1건 추가 시 서류 통과 가능',
  matching_points: [
    'B2B SaaS GTM 전 과정 실행 경험 — 그로스 PM 핵심 역량 직접 보유',
    'SQL 퍼널 분석·성과 측정 — 토스 데이터 드리븐 문화 즉시 적응 가능',
    '스타트업 0→1 실행력 + 영어 소통 — 글로벌 파트너 협업 대응',
    'OKR 기반 성과 관리 경험 — PM 프로세스 빠른 적응 가능',
  ],
  gaps: [
    'PRD 직접 작성 이력 없음 — 탈락 리스크 1순위',
    'B2C 서비스 경험 전무 — 소비자 앱 맥락 이해 부족으로 지적 가능',
    '팀 리딩 경험 이력서에 미기재',
  ],
  pitch_points: [
    '"GTM → PM" 전환 맥락을 자기소개서에 명확히 서술',
    '사이드 프로젝트 또는 PRD 샘플 포트폴리오 1건 첨부',
    '토스 최신 기능 10개 분석 후 PMF 관점 면접 답변 준비',
    '숫자 중심 STAR 기법으로 GTM 성과 수치화 (예: MQL +220, 전환율 +40%)',
  ],
}

const interviewQuestions = [
  {
    q: 'B2B SaaS GTM 전략을 수립·실행한 경험을 숫자로 설명해주세요.',
    a: '전 직장에서 SMB 타깃 GTM 전략을 처음부터 설계했습니다. ICP를 정의하고 LinkedIn + 콜드 이메일 시퀀스를 구축해 6개월 만에 MQL 220건, SQL 전환율 28%를 달성했습니다. SQL로 퍼널 병목을 직접 추적하며 ABM 캠페인으로 전환율을 기존 대비 40% 향상시켰습니다.',
  },
  { q: '기능 우선순위를 결정할 때 어떤 프레임워크를 사용하시나요?', a: '' },
  { q: '토스 그로스팀에서 가장 먼저 해결하고 싶은 문제는 무엇인가요?', a: '' },
  { q: 'SQL로 비즈니스 인사이트를 도출한 구체적인 사례를 말씀해주세요.', a: '' },
  { q: '데이터가 없는 상황에서 의사결정을 내려야 했던 경험이 있나요?', a: '' },
]

const reverseQuestions = [
  { type: '역할', q: 'PM이 직접 데이터를 분석하는 비중은 어느 정도인가요? 분석가와의 협업 구조가 궁금합니다.' },
  { type: '도전', q: '입사 후 3개월 안에 가장 먼저 해결해야 할 팀의 핵심 과제는 무엇인가요?' },
  { type: '기대', q: '1년 뒤 이 포지션의 성공을 어떤 지표로 측정하시나요?' },
]

const recColor = { APPLY: '#22c55e', CONSIDER: '#e8a020', SKIP: '#ef4444' }
const recLabel = { APPLY: '✅ 지원 강력 추천', CONSIDER: '⚠️ 조건부 추천', SKIP: '❌ 부적합' }

function DemoModal({ onClose }: { onClose: () => void }) {
  const [activeCareer, setActiveCareer] = useState(1)
  const [demoTab, setDemoTab] = useState(0)
  const [expandedQ, setExpandedQ] = useState<number | null>(0)
  const active = careerPaths[activeCareer]
  const color = recColor[jdDemo.recommendation]

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>✕</button>

        <div className="demo-modal-header">
          <div className="section-label">SAMPLE ANALYSIS — EXPERT</div>
          <h2 className="demo-modal-title">
            3년차 B2B SaaS 마케터{' '}
            <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '18px' }}>· 연봉 3,800만원</span>
          </h2>
          <p className="demo-modal-sub">실제 분석 결과는 업로드한 이력서 내용에 따라 달라집니다.</p>
        </div>

        <div className="demo-feature-tabs">
          {[
            { icon: '📊', label: '이력서 분석' },
            { icon: '📋', label: 'JD 적합도' },
            { icon: '🎤', label: '면접 가이드' },
          ].map((t, i) => (
            <button
              key={i}
              className={`demo-feature-tab${demoTab === i ? ' active' : ''}`}
              onClick={() => setDemoTab(i)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="demo-modal-body">

          {/* ── Tab 0: 이력서 분석 ── */}
          {demoTab === 0 && (
            <>
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
                <p className="result-summary">
                  B2B SaaS 기업에서 GTM 전략 수립과 실행을 주도한 3년차 마케터로, 데이터 기반 의사결정과 SQL 분석 역량이 강점입니다. PM 전환 시 즉시 전력이 가능하며, AI·SaaS 분야 Product Manager로의 커리어 전환을 강력히 추천합니다.
                </p>
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
              <div className="career-cards">
                {careerPaths.map((p, i) => (
                  <button
                    key={p.type}
                    className={`career-card${i === activeCareer ? ' active' : ''}`}
                    onClick={() => setActiveCareer(i)}
                  >
                    <div className="career-card-type">{p.type}</div>
                    <div className="career-card-salary" style={{ color: p.salaryColor }}>{p.salary}</div>
                    <div className="career-card-title">{p.title}</div>
                  </button>
                ))}
              </div>

              <div className="career-tabs">
                {careerPaths.map((p, i) => (
                  <button
                    key={p.type}
                    className={`career-tab${i === activeCareer ? ' active' : ''}`}
                    onClick={() => setActiveCareer(i)}
                  >
                    <span className="career-tab-label">{p.type}</span>
                    <span className="career-tab-sub">{p.label}</span>
                  </button>
                ))}
              </div>

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
            </>
          )}

          {/* ── Tab 1: JD 적합도 ── */}
          {demoTab === 1 && (
            <>
              <div className="jd-demo-company-bar">
                <span className="jd-demo-co">🏢 {jdDemo.company}</span>
                <span className="jd-demo-pos">{jdDemo.position}</span>
              </div>

              <div className="jd-fit-hero">
                <div className="jd-fit-score-block">
                  <span className="jd-fit-score-num">{jdDemo.fit_score}</span>
                  <span className="jd-fit-score-denom">/100</span>
                </div>
                <div className="jd-fit-right">
                  <div className="jd-fit-bar-wrap">
                    <div className="jd-fit-bar" style={{ width: `${jdDemo.fit_score}%` }} />
                  </div>
                  <div
                    className="jd-recommendation-badge"
                    style={{ background: color + '20', color, borderColor: color + '50' }}
                  >
                    {recLabel[jdDemo.recommendation]}
                  </div>
                </div>
              </div>

              <div className="jd-verdict">
                &ldquo;{jdDemo.verdict}&rdquo;
              </div>

              <div className="demo-grid" style={{ marginTop: 16 }}>
                <div className="results-section">
                  <div className="results-label">✅ 매칭 강점</div>
                  <ul className="result-list">
                    {jdDemo.matching_points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">⚠️ 부족한 점</div>
                  <ul className="result-list improvement-list">
                    {jdDemo.gaps.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">🎯 어필 전략</div>
                  <ul className="result-list">
                    {jdDemo.pitch_points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* ── Tab 2: 면접 가이드 ── */}
          {demoTab === 2 && (
            <>
              <div className="jd-demo-company-bar">
                <span className="jd-demo-co">🏢 {jdDemo.company}</span>
                <span className="jd-demo-pos">{jdDemo.position}</span>
              </div>

              <div className="results-label" style={{ marginBottom: 10 }}>🎤 예상 질문 & 이력서 기반 모범 답변</div>
              <div className="interview-questions-list">
                {interviewQuestions.map((item, i) => (
                  <div
                    key={i}
                    className={`interview-q-item${expandedQ === i ? ' expanded' : ''}`}
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  >
                    <div className="interview-q-row">
                      <span className="interview-q-num">Q{i + 1}</span>
                      <span className="interview-q-text">{item.q}</span>
                      <span className="interview-q-toggle">{expandedQ === i ? '▲' : '▼'}</span>
                    </div>
                    {expandedQ === i && (
                      <div className="interview-q-answer">
                        {item.a
                          ? <><span className="interview-q-answer-label">모범 답변</span>{item.a}</>
                          : <span style={{ color: 'var(--muted)' }}>내 이력서 기반 모범 답변이 생성됩니다.</span>
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="results-label" style={{ marginTop: 20, marginBottom: 10 }}>💬 역질문 — 면접관에게 꼭 물어볼 것</div>
              <div className="reverse-questions-list">
                {reverseQuestions.map((rq, i) => (
                  <div key={i} className="reverse-q-card">
                    <span className="reverse-q-type">{rq.type}</span>
                    <p className="reverse-q-text">{rq.q}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link href="/analyze">
            <button className="btn-hero" style={{ width: '100%', marginTop: 20 }}>
              내 이력서 분석하기 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Hero({ userType }: { userType?: 'INDIVIDUAL' | 'HEADHUNTER' | null }) {
  const [showDemo, setShowDemo] = useState(false)
  const [heroTab, setHeroTab] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setHeroTab((prev) => (prev + 1) % 3), 3800)
    return () => clearInterval(t)
  }, [])

  // 개인/헤드헌터 맞춤 콘텐츠
  const content = {
    INDIVIDUAL: {
      badge: '재직 중 이직 준비 직장인을 위한 AI 커리어 코치',
      headline: (
        <>
          이력서 하나로,<br />
          <span className="line2">다음 커리어를 설계하세요</span>
        </>
      ),
      sub: (
        <>
          현직에 있으면서 조용히 이직을 준비 중이라면.<br />
          AI 헤드헌터가 내 이력서를 분석하고, 지원할 회사·직무·연봉 전략까지 설계합니다.
        </>
      ),
    },
    HEADHUNTER: {
      badge: '헤드헌터를 위한 AI 후보자 분석 플랫폼',
      headline: (
        <>
          후보자 이력서를,<br />
          <span className="line2">클라이언트 제안서로</span>
        </>
      ),
      sub: (
        <>
          후보자 강점 분석부터 JD 적합도, 클라이언트 제안 전략까지.<br />
          AI가 2분 만에 완성합니다. 헤드헌터의 시간은 관계 구축에 집중하세요.
        </>
      ),
    },
    DEFAULT: {
      badge: '개인 구직자 & 헤드헌터를 위한 AI 이력서 분석',
      headline: (
        <>
          이력서 하나로,<br />
          <span className="line2">커리어의 다음 단계를 설계하세요</span>
        </>
      ),
      sub: (
        <>
          개인 구직자는 취업 전략을, 헤드헌터는 후보자 제안서를.<br />
          AI가 이력서를 분석하고 맞춤형 인사이트를 2분 만에 제공합니다.
        </>
      ),
    },
  }

  const selected = userType ? content[userType] : content.DEFAULT

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-grid" />

      <div className="hero-badge">
        <div className="badge-dot" />
        {selected.badge}
      </div>

      <h1>{selected.headline}</h1>

      <p className="hero-sub">{selected.sub}</p>

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

          <div className="demo-hero-tabs">
            {['📊 이력서 분석', '📋 JD 적합도', '🎤 면접 가이드'].map((label, i) => (
              <button
                key={i}
                className={`demo-hero-tab${heroTab === i ? ' active' : ''}`}
                onClick={() => setHeroTab(i)}
              >
                {label}
              </button>
            ))}
          </div>

          {heroTab === 0 && (
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
                    <div className="dir-item highlighted">RECOMMENDED — PM (AI/SaaS) ⭐</div>
                    <div className="dir-item">STRETCH — SaaS 창업 / VC</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {heroTab === 1 && (
            <div className="demo-body demo-body-jd">
              <div className="mini-jd-header">
                <span className="mini-jd-co">🏢 토스</span>
                <span className="mini-jd-pos">Product Manager (AI Growth)</span>
              </div>
              <div className="mini-jd-score-row">
                <span className="mini-jd-score">82<span style={{ fontSize: 13, color: 'var(--muted)' }}>/100</span></span>
                <span className="mini-jd-badge" style={{ background: '#22c55e20', color: '#22c55e', borderColor: '#22c55e50' }}>✅ APPLY</span>
              </div>
              <div className="mini-jd-bar-wrap"><div className="mini-jd-bar" style={{ width: '82%' }} /></div>
              <div className="mini-jd-verdict">"GTM·SQL 강점이 토스 PM 요구와 80% 일치"</div>
              <div className="mini-jd-list">
                <div className="mini-jd-row ok">✅ B2B GTM 전 과정 실행 경험 보유</div>
                <div className="mini-jd-row ok">✅ SQL 퍼널 분석 — 데이터 드리븐 문화 적응</div>
                <div className="mini-jd-row gap">⚠️ PRD 작성 이력 없음 — 리스크</div>
                <div className="mini-jd-row pitch">🎯 GTM→PM 전환 맥락 자소서에 서술 권장</div>
              </div>
            </div>
          )}

          {heroTab === 2 && (
            <div className="demo-body demo-body-interview">
              <div className="mini-jd-header">
                <span className="mini-jd-co">🎤 면접 가이드</span>
                <span className="mini-jd-pos">토스 · PM (AI Growth)</span>
              </div>
              <div className="mini-interview-list">
                <div className="mini-q-item expanded">
                  <div className="mini-q-row"><span className="mini-q-num">Q1</span><span className="mini-q-text">B2B SaaS GTM 전략 수립·실행 경험?</span></div>
                  <div className="mini-q-answer">→ MQL 220건, SQL 전환율 28% 달성. ABM으로 전환율 40% 향상…</div>
                </div>
                <div className="mini-q-item"><span className="mini-q-num">Q2</span><span className="mini-q-text">기능 우선순위 결정 프레임워크?</span></div>
                <div className="mini-q-item"><span className="mini-q-num">Q3</span><span className="mini-q-text">토스에서 가장 먼저 해결할 문제?</span></div>
                <div className="mini-q-item"><span className="mini-q-num">Q4</span><span className="mini-q-text">SQL 기반 비즈니스 인사이트 도출 사례?</span></div>
              </div>
              <div className="mini-reverse-bar">
                💬 역질문 3가지 &nbsp;·&nbsp;
                <span style={{ color: 'var(--muted2)' }}>역할 · 도전 · 기대</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </section>
  )
}
