'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import DemoModal from './DemoModal'

export default function Hero({ userType }: { userType?: 'JOBSEEKER' | 'HEADHUNTER' | null }) {
  const [showDemo, setShowDemo] = useState(false)
  const [heroTab, setHeroTab] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setHeroTab((prev) => (prev + 1) % 3), 3800)
    return () => clearInterval(t)
  }, [])

  // 개인/헤드헌터 맞춤 콘텐츠
  const content = {
    JOBSEEKER: {
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
          AI 헤드헌터가 내 이력서를 분석하고, 지원할 회사/직무/연봉 전략까지 설계합니다.
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
          AI가 10분 만에 완성합니다. 헤드헌터의 시간은 관계 구축에 집중하세요.
        </>
      ),
    },
    DEFAULT: {
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
          AI 헤드헌터가 내 이력서를 분석하고, 지원할 회사/직무/연봉 전략까지 설계합니다.
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
                  PDF, DOCX / 최대 10MB
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
              <div className="mini-jd-verdict">"GTM/SQL 강점이 토스 PM 요구와 80% 일치"</div>
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
                <span className="mini-jd-pos">토스 / PM (AI Growth)</span>
              </div>
              <div className="mini-interview-list">
                <div className="mini-q-item expanded">
                  <div className="mini-q-row"><span className="mini-q-num">Q1</span><span className="mini-q-text">B2B SaaS GTM 전략 수립/실행 경험?</span></div>
                  <div className="mini-q-answer">→ MQL 220건, SQL 전환율 28% 달성. ABM으로 전환율 40% 향상…</div>
                </div>
                <div className="mini-q-item"><span className="mini-q-num">Q2</span><span className="mini-q-text">기능 우선순위 결정 프레임워크?</span></div>
                <div className="mini-q-item"><span className="mini-q-num">Q3</span><span className="mini-q-text">토스에서 가장 먼저 해결할 문제?</span></div>
                <div className="mini-q-item"><span className="mini-q-num">Q4</span><span className="mini-q-text">SQL 기반 비즈니스 인사이트 도출 사례?</span></div>
              </div>
              <div className="mini-reverse-bar">
                💬 역질문 3가지 &nbsp;/&nbsp;
                <span style={{ color: 'var(--muted2)' }}>역할 / 도전 / 기대</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDemo && <DemoModal userType={userType} onClose={() => setShowDemo(false)} />}
    </section>
  )
}
