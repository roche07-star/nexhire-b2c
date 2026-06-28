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
    desc: 'GTM/마케팅 전문성 심화',
    bands: [
      { label: '현재(3년차)', min: 0, max: 0, pct: 0 },
      { label: '1년 뒤', min: 4200, max: 4800, pct: 45 },
      { label: '3년 뒤', min: 4800, max: 5200, pct: 58 },
      { label: '5년 뒤', min: 5200, max: 5800, pct: 68 },
      { label: '7년 뒤+', min: 5500, max: 6500, pct: 78 },
    ],
    points: [
      'GTM 전략 전문가로 SaaS 기업 마케팅 리더 성장',
      'B2B 세일즈/마케팅 경력 심화로 안정적 처우 향상',
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
      'SQL/데이터 분석 역량이 데이터 기반 PM으로 차별화',
      'AI 스타트업 시리즈A/B 기업에서 즉시 전력 가능',
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
  verdict: 'GTM/SQL 이중 강점이 토스 PM 핵심 요구와 80% 일치 — PRD 작성 이력 부재가 유일한 리스크, 포트폴리오 1건 추가 시 서류 통과 가능',
  matching_points: [
    'B2B SaaS GTM 전 과정 실행 경험 — 그로스 PM 핵심 역량 직접 보유',
    'SQL 퍼널 분석/성과 측정 — 토스 데이터 드리븐 문화 즉시 적응 가능',
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
    q: 'B2B SaaS GTM 전략을 수립/실행한 경험을 숫자로 설명해주세요.',
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

export default function DemoModal({ userType, onClose }: { userType?: 'JOBSEEKER' | 'HEADHUNTER' | null; onClose: () => void }) {
  const [activeCareer, setActiveCareer] = useState(1)
  const [demoTab, setDemoTab] = useState(0)
  const [expandedQ, setExpandedQ] = useState<number | null>(0)
  const active = careerPaths[activeCareer]
  const color = recColor[jdDemo.recommendation]

  const isHeadhunter = userType === 'HEADHUNTER'

  // 탭 구성
  const jobseekerTabs = [
    { icon: '📊', label: '이력서 분석' },
    { icon: '📋', label: 'JD 적합도' },
    { icon: '✍️', label: '이력서 생성' },
    { icon: '🎤', label: '면접 가이드' },
  ]

  const headhunterTabs = [
    { icon: '👤', label: '후보자 분석' },
    { icon: '📋', label: 'JD 매칭' },
    { icon: '📊', label: '채용 프로세스' },
    { icon: '📄', label: '클라이언트 제안서' },
    { icon: '💰', label: '정산 기능' },
  ]

  const tabs = isHeadhunter ? headhunterTabs : jobseekerTabs

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>✕</button>

        <div className="demo-modal-header">
          <div className="section-label">SAMPLE ANALYSIS — EXPERT</div>
          <h2 className="demo-modal-title">
            {isHeadhunter ? '후보자: 김OO (30세, 여)' : '3년차 B2B SaaS 마케터'}{' '}
            <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '18px' }}>
              {isHeadhunter ? ', 희망연봉 5,000만원' : ', 연봉 3,800만원'}
            </span>
          </h2>
          <p className="demo-modal-sub">
            {isHeadhunter
              ? '실제 분석 결과는 업로드한 후보자 이력서 내용에 따라 달라집니다.'
              : '실제 분석 결과는 업로드한 이력서 내용에 따라 달라집니다.'
            }
          </p>
        </div>

        <div className="demo-feature-tabs">
          {tabs.map((t, i) => (
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

          {/* ────────────────────────────────────── */}
          {/* 개인 구직자: Tab 0 = 이력서 분석 */}
          {/* 헤드헌터: Tab 0 = 후보자 분석 */}
          {/* ────────────────────────────────────── */}
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
                  B2B SaaS 기업에서 GTM 전략 수립과 실행을 주도한 3년차 마케터로, 데이터 기반 의사결정과 SQL 분석 역량이 강점입니다. PM 전환 시 즉시 전력이 가능하며, AI/SaaS 분야 Product Manager로의 커리어 전환을 강력히 추천합니다.
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
                    <li>SQL로 퍼널 분석/성과 측정 직접 수행</li>
                    <li>스타트업 초기 멤버로 0→1 성장 경험 보유</li>
                    <li>영어 비즈니스 커뮤니케이션 능숙</li>
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">개선 포인트</div>
                  <ul className="result-list improvement-list">
                    <li>PM 전환을 위한 프로덕트 스펙 작성 경험 부족</li>
                    <li>리더십/팀 관리 경험 이력서에 명시 필요</li>
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
                <div className="salary-band-title">연봉 밴드 — {active.label}, 현재 기준: 3년차 (단위: 만원)</div>
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

          {/* ────────────────────────────────────── */}
          {/* 개인 구직자: Tab 1 = JD 적합도 */}
          {/* 헤드헌터: Tab 1 = JD 매칭 */}
          {/* ────────────────────────────────────── */}
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

          {/* ────────────────────────────────────── */}
          {/* 개인 구직자: Tab 2 = 이력서 생성 */}
          {/* 헤드헌터: Tab 2 = 클라이언터 제안서 */}
          {/* ────────────────────────────────────── */}
          {demoTab === 2 && !isHeadhunter && (
            <>
              <div className="jd-demo-company-bar">
                <span className="jd-demo-co">🏢 {jdDemo.company}</span>
                <span className="jd-demo-pos">{jdDemo.position}</span>
              </div>

              <div className="results-label" style={{ marginBottom: 10 }}>✍️ JD 맞춤 이력서 자동 생성</div>

              <div className="demo-summary-block">
                <p className="result-summary">
                  원본 이력서와 JD 분석 결과를 기반으로 <strong>매칭 강점은 부각</strong>하고 <strong>부족한 점은 보완</strong>하여 이력서를 자동으로 재작성합니다.
                </p>
              </div>

              <div className="demo-grid" style={{ marginTop: 16 }}>
                <div className="results-section">
                  <div className="results-label">원본 이력서</div>
                  <div className="result-summary" style={{ fontSize: '13px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                    <strong>[주요 업무]</strong><br/>
                    • B2B SaaS 제품 마케팅 전략 수립<br/>
                    • SQL 기반 데이터 분석 및 성과 측정<br/>
                    • 마케팅 캠페인 기획 및 실행
                  </div>
                </div>
                <div className="results-section">
                  <div className="results-label">생성된 이력서 (JD 최적화)</div>
                  <div className="result-summary" style={{ fontSize: '13px', padding: '12px', background: 'rgba(232,255,71,0.1)', borderRadius: '8px', border: '1px solid rgba(232,255,71,0.2)' }}>
                    <strong>[주요 업무 및 성과]</strong><br/>
                    • <strong>B2B SaaS 제품의 GTM 전략 수립 및 실행</strong> (PM 필수 역량)<br/>
                    • <strong>SQL로 사용자 퍼널 분석, 전환율 50% 개선</strong> (데이터 기반 의사결정)<br/>
                    • <strong>Figma로 프로덕트 개선안 제안, 5건 반영</strong> (프로덕트 감각)
                  </div>
                </div>
                <div className="results-section">
                  <div className="results-label">💡 변경 사항</div>
                  <ul className="result-list">
                    <li><strong>GTM 전략</strong> → PM 핵심 역량으로 강조</li>
                    <li><strong>구체적 성과 수치</strong> 추가 (전환율 50% 개선)</li>
                    <li><strong>Figma 프로덕트 제안</strong> 경험 부각</li>
                    <li><strong>데이터 기반 의사결정</strong> 키워드 삽입</li>
                  </ul>
                </div>
              </div>

              <div className="results-label" style={{ marginTop: 16 }}>📝 자기소개서 최적화</div>
              <div className="result-summary" style={{ fontSize: '13px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                저는 B2B SaaS 기업에서 <strong>GTM 전략 수립과 실행을 주도</strong>하며 <strong>데이터 기반 의사결정</strong>을 실천해온 마케터입니다.
                SQL로 직접 퍼널을 분석하고 개선안을 도출하여 <strong>전환율을 50% 향상</strong>시켰으며,
                Figma를 활용해 프로덕트 개선안을 제안한 경험이 있습니다.
                이러한 경험을 바탕으로 <strong>사용자와 비즈니스 양쪽의 관점</strong>에서 문제를 해결하는 PM이 되고자 합니다.
              </div>
            </>
          )}

          {demoTab === 2 && isHeadhunter && (
            <>
              <div className="results-label" style={{ marginBottom: 10 }}>📊 채용 프로세스 관리 — 후보자 진행 상황 추적</div>

              <div className="demo-summary-block">
                <p className="result-summary">
                  후보자별 진행 단계를 실시간으로 추적하고 <strong>다음 액션</strong>을 놓치지 않도록 관리합니다.
                </p>
              </div>

              <div className="results-label" style={{ marginTop: 16 }}>🏢 진행 중인 포지션: Product Manager</div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: '김OO', status: '최종 합격', stage: 4, color: '#22d3ee', nextAction: '입사일 협의 중', date: '2026-06-25' },
                  { name: '이OO', status: '2차 면접 대기', stage: 3, color: '#e8ff47', nextAction: '2차 면접 일정 조율', date: '2026-06-28' },
                  { name: '박OO', status: '1차 면접 합격', stage: 2, color: '#a78bfa', nextAction: '2차 면접 제안 예정', date: '2026-06-30' },
                ].map((candidate, i) => (
                  <div key={i} style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 700 }}>{candidate.name}</span>
                        <span style={{
                          marginLeft: '8px',
                          padding: '4px 10px',
                          background: candidate.color + '20',
                          color: candidate.color,
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: `1px solid ${candidate.color}40`
                        }}>
                          {candidate.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{candidate.date}</span>
                    </div>

                    {/* 프로세스 바 */}
                    <div style={{ position: 'relative', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '12px' }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${(candidate.stage / 4) * 100}%`,
                        background: candidate.color,
                        borderRadius: '3px',
                        transition: 'width 0.3s'
                      }} />
                    </div>

                    {/* 단계 표시 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      {['서류', '1차', '2차', '최종'].map((step, idx) => (
                        <span key={idx} style={{
                          fontSize: '10px',
                          color: idx < candidate.stage ? candidate.color : 'var(--muted)',
                          fontWeight: idx < candidate.stage ? 600 : 400
                        }}>
                          {step}
                        </span>
                      ))}
                    </div>

                    <div style={{
                      padding: '10px 12px',
                      background: 'var(--surface)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: 'var(--muted2)' }}>다음 액션:</span>{' '}
                      <span style={{ fontWeight: 600 }}>{candidate.nextAction}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="demo-grid" style={{ marginTop: 16 }}>
                <div className="results-section">
                  <div className="results-label">📋 진행 통계</div>
                  <ul className="result-list">
                    <li>총 후보자: 8명</li>
                    <li>서류 합격: 5명 (62.5%)</li>
                    <li>1차 면접 합격: 3명 (60%)</li>
                    <li>최종 합격: 1명</li>
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">⏰ 다가오는 일정</div>
                  <ul className="result-list">
                    <li>이OO - 2차 면접 (6/28)</li>
                    <li>박OO - 2차 제안 (6/30)</li>
                    <li>김OO - 입사일 확정 (7/1)</li>
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">💡 프로세스 관리 기능</div>
                  <ul className="result-list">
                    <li>후보자별 진행 단계 실시간 추적</li>
                    <li>다음 액션 알림</li>
                    <li>면접 일정 관리</li>
                    <li>진행 통계 및 전환율 분석</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* ────────────────────────────────────── */}
          {/* 개인 구직자: Tab 3 = 면접 가이드 */}
          {/* 헤드헌터: Tab 3 = 클라이언트 제안서 */}
          {/* ────────────────────────────────────── */}
          {demoTab === 3 && !isHeadhunter && (
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

          {demoTab === 3 && isHeadhunter && (
            <>
              <div className="jd-demo-company-bar">
                <span className="jd-demo-co">🏢 {jdDemo.company}</span>
                <span className="jd-demo-pos">{jdDemo.position}</span>
              </div>

              <div className="results-label" style={{ marginBottom: 10 }}>📄 클라이언트 제안서 자동 생성</div>

              <div className="demo-summary-block">
                <p className="result-summary">
                  후보자 강점, JD 적합도, 매칭 포인트, 예상 질문/답변을 포함한 <strong>종합 제안서</strong>를 자동으로 생성합니다.
                </p>
              </div>

              <div className="demo-scores" style={{ marginTop: 16 }}>
                <div className="results-label">후보자 적합도</div>
                {[
                  { label: 'JD 매칭률', val: 89 },
                  { label: '직무 경험', val: 92 },
                  { label: '연봉 협상력', val: 85 },
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

              <div className="demo-grid" style={{ marginTop: 16 }}>
                <div className="results-section">
                  <div className="results-label">✅ 추천 이유</div>
                  <ul className="result-list">
                    <li>B2B SaaS PM 필수 역량 (GTM, 데이터 분석) 완벽 보유</li>
                    <li>SQL 기반 퍼널 분석으로 전환율 50% 개선 성과</li>
                    <li>스타트업 0→1 성장 경험, 즉시 전력 가능</li>
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">⚠️ 유의사항</div>
                  <ul className="result-list improvement-list">
                    <li>PM 전환 희망으로 프로덕트 스펙 작성 경험 부족</li>
                    <li>리더십 경험 이력서에 명시 필요</li>
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">💰 연봉 협상 가이드</div>
                  <ul className="result-list">
                    <li>현재 연봉: 3,800만원</li>
                    <li>희망 연봉: 5,000만원</li>
                    <li>적정 제안: <strong>4,500~4,800만원</strong></li>
                  </ul>
                </div>
              </div>

              <div className="results-label" style={{ marginTop: 16 }}>📋 클라이언트 프레젠테이션 요약</div>
              <div className="result-summary" style={{ fontSize: '13px', padding: '12px', background: 'rgba(232,255,71,0.1)', borderRadius: '8px', border: '1px solid rgba(232,255,71,0.2)' }}>
                <strong>추천 후보:</strong> 김OO (30세, 여)<br/>
                <strong>핵심 강점:</strong> B2B SaaS GTM 전략 수립/실행, SQL 기반 데이터 분석, 0→1 성장 경험<br/>
                <strong>JD 매칭률:</strong> 89% (매우 우수)<br/>
                <strong>제안 연봉:</strong> 4,500~4,800만원<br/>
                <strong>추천 사유:</strong> 귀사가 찾는 PM 역량(GTM 전략, 데이터 분석)을 완벽히 보유하고 있으며, 스타트업 성장 경험으로 빠른 적응이 가능합니다.
              </div>
            </>
          )}

          {/* ────────────────────────────────────── */}
          {/* 헤드헌터: Tab 4 = 정산 기능 */}
          {/* ────────────────────────────────────── */}
          {demoTab === 4 && isHeadhunter && (
            <>
              <div className="results-label" style={{ marginBottom: 10 }}>💰 정산 기능 — 매출/수수료 자동 계산</div>

              <div className="demo-summary-block">
                <p className="result-summary">
                  합격자 정보, 입사일, 연봉, 수수료율을 입력하면 <strong>정산 금액을 자동으로 계산</strong>하고 <strong>연도별 통계</strong>를 제공합니다.
                </p>
              </div>

              <div className="demo-scores" style={{ marginTop: 16 }}>
                <div className="results-label">2026년 실적 요약</div>
                {[
                  { label: '총 매출', val: '128,500,000원' },
                  { label: '전환액 (회수)', val: '96,200,000원' },
                  { label: '미수금 (대기)', val: '32,300,000원' },
                ].map((s) => (
                  <div key={s.label} className="result-score-row">
                    <div className="score-meta">
                      <span className="score-name">{s.label}</span>
                      <span className="score-val" style={{ color: 'var(--primary)' }}>{s.val}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="demo-grid" style={{ marginTop: 16 }}>
                <div className="results-section">
                  <div className="results-label">📊 월별 매출</div>
                  <ul className="result-list">
                    <li>1월: 12,500,000원</li>
                    <li>2월: 18,300,000원</li>
                    <li>3월: 21,700,000원</li>
                    <li>4월: 19,200,000원</li>
                    <li>5월: 23,800,000원</li>
                    <li>6월: 33,000,000원 (최고)</li>
                  </ul>
                </div>
                <div className="results-section">
                  <div className="results-label">🎯 목표 달성률</div>
                  <div className="result-score-row">
                    <div className="score-meta">
                      <span className="score-name">연간 목표 (1.5억)</span>
                      <span className="score-val">86%</span>
                    </div>
                    <div className="score-bar-wrap">
                      <div className="score-bar" style={{ width: '86%' }} />
                    </div>
                  </div>
                  <p className="result-summary" style={{ fontSize: '12px', marginTop: 8 }}>
                    현재 진행률로 <strong>목표 달성 가능</strong> (예상: 1.62억)
                  </p>
                </div>
                <div className="results-section">
                  <div className="results-label">💡 정산 관리 기능</div>
                  <ul className="result-list">
                    <li>합격자별 정산 내역 자동 기록</li>
                    <li>입사일 기준 수수료 자동 계산</li>
                    <li>전환액/미수금 실시간 집계</li>
                    <li>연도별 통계 및 목표 달성률</li>
                    <li>Excel 다운로드 지원</li>
                  </ul>
                </div>
              </div>

              <div className="results-label" style={{ marginTop: 16 }}>📋 최근 정산 내역</div>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontWeight: 600, marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span>이름</span>
                  <span>입사일</span>
                  <span>연봉</span>
                  <span>수수료</span>
                </div>
                {[
                  { name: '김OO', date: '2026-06-01', salary: '5,000만원', fee: '12,500,000원' },
                  { name: '이OO', date: '2026-05-15', salary: '6,500만원', fee: '16,250,000원' },
                  { name: '박OO', date: '2026-04-20', salary: '4,200만원', fee: '10,500,000원' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', padding: '6px 0' }}>
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--muted)' }}>{item.date}</span>
                    <span>{item.salary}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.fee}</span>
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
