'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { RegularUserType } from '@/types/user'
import DemoModal from './DemoModal'

export default function Hero({ userType }: { userType?: RegularUserType | null }) {
  const [showDemo, setShowDemo] = useState(false)
  const [heroTab, setHeroTab] = useState(0)
  const [selectedType, setSelectedType] = useState<'JOBSEEKER' | 'HEADHUNTER'>('JOBSEEKER')

  useEffect(() => {
    const t = setInterval(() => setHeroTab((prev) => (prev + 1) % 4), 4000)
    return () => clearInterval(t)
  }, [])

  // localStorage에서 선택한 타입 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('landing_user_type')
      if (saved === 'HEADHUNTER' || saved === 'JOBSEEKER') {
        setSelectedType(saved)
      }
    }
  }, [])

  // 선택한 타입 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('landing_user_type', selectedType)
    }
  }, [selectedType])

  // 개인/헤드헌터 맞춤 콘텐츠
  const content = {
    JOBSEEKER: {
      badge: '재직 중 이직 준비 직장인을 위한 JOBIZIC 커리어 코치',
      headline: (
        <>
          이력서 하나로,<br />
          <span className="line2">다음 커리어를 설계하세요</span>
        </>
      ),
      sub: (
        <>
          현직에 있으면서 조용히 이직을 준비 중이라면.<br />
          JOBIZIC 헤드헌터가 내 이력서를 분석하고, 지원할 회사/직무/연봉 전략까지 설계합니다.
        </>
      ),
    },
    HEADHUNTER: {
      badge: '헤드헌터를 위한 JOBIZIC 후보자 분석 플랫폼',
      headline: (
        <>
          후보자 이력서를,<br />
          <span className="line2">클라이언트 제안서로</span>
        </>
      ),
      sub: (
        <>
          후보자 강점 분석부터 JD 적합도, 클라이언트 제안 전략까지.<br />
          JOBIZIC이 10분 만에 완성합니다. 헤드헌터의 시간은 관계 구축에 집중하세요.
        </>
      ),
    },
  }

  // 로그인 사용자는 본인 타입, 비로그인은 선택한 타입
  const effectiveType = userType || selectedType
  const selected = content[effectiveType]

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-grid" />

      {/* 타입 선택 토글 (비로그인만) */}
      {!userType && (
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginBottom: 32,
          position: 'relative',
          zIndex: 10
        }}>
          <button
            onClick={() => setSelectedType('JOBSEEKER')}
            style={{
              padding: '10px 24px',
              background: selectedType === 'JOBSEEKER'
                ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              border: selectedType === 'JOBSEEKER' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)'
            }}
          >
            🎯 개인 구직자
          </button>
          <button
            onClick={() => setSelectedType('HEADHUNTER')}
            style={{
              padding: '10px 24px',
              background: selectedType === 'HEADHUNTER'
                ? 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)'
                : 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              border: selectedType === 'HEADHUNTER' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)'
            }}
          >
            💼 헤드헌터
          </button>
        </div>
      )}

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
            {(effectiveType === 'HEADHUNTER'
              ? ['📊 후보자 분석', '📋 JD 매칭', '📝 제안서 생성', '⚙️ 프로세스 관리']
              : ['📊 이력서 분석', '📋 JD 적합도', '📝 업무 Report', '🎤 면접 가이드']
            ).map((label, i) => (
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
                  <strong>{effectiveType === 'HEADHUNTER' ? '후보자 이력서를 드래그하거나 클릭' : '이력서를 드래그하거나 클릭'}</strong><br />
                  PDF, DOCX / 최대 10MB
                </div>
                <div className="typewriter">JOBIZIC 분석 중...</div>
              </div>
              <div className="demo-result">
                <div className="result-tag">✦ 분석 완료</div>
                <div className="result-score">
                  <div className="score-label">{effectiveType === 'HEADHUNTER' ? 'CANDIDATE SCORE' : 'MATCH SCORE'}</div>
                  <div className="score-row"><span className="score-name">{effectiveType === 'HEADHUNTER' ? '기술 역량' : '직무 적합도'}</span><span className="score-val">87%</span></div>
                  <div className="score-bar-wrap"><div className="score-bar" style={{ width: '87%' }} /></div>
                  <div className="score-row"><span className="score-name">시장 경쟁력</span><span className="score-val">74%</span></div>
                  <div className="score-bar-wrap"><div className="score-bar" style={{ width: '74%' }} /></div>
                  <div className="score-row"><span className="score-name">{effectiveType === 'HEADHUNTER' ? '클라이언트 적합도' : '성장 가능성'}</span><span className="score-val">92%</span></div>
                  <div className="score-bar-wrap"><div className="score-bar" style={{ width: '92%' }} /></div>
                </div>
                <div className="result-direction">
                  <div className="dir-label">{effectiveType === 'HEADHUNTER' ? '💼 추천 포지션' : '💡 커리어 경로 추천'}</div>
                  <div className="dir-items">
                    <div className="dir-item">{effectiveType === 'HEADHUNTER' ? '시니어 개발자 (연봉 9000-11000만원)' : 'BASELINE — B2B 마케팅 팀장'}</div>
                    <div className="dir-item highlighted">{effectiveType === 'HEADHUNTER' ? '테크리드 (연봉 12000-14000만원) ⭐' : 'RECOMMENDED — PM (AI/SaaS) ⭐'}</div>
                    <div className="dir-item">{effectiveType === 'HEADHUNTER' ? 'CTO / VP of Eng (연봉 15000만원+)' : 'STRETCH — SaaS 창업 / VC'}</div>
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

          {heroTab === 2 && effectiveType === 'JOBSEEKER' && (
            <div className="demo-body demo-body-interview">
              <div className="mini-jd-header">
                <span className="mini-jd-co">📝 업무 Report</span>
                <span className="mini-jd-pos">2026년 6월 성과 정리</span>
              </div>
              <div className="mini-interview-list">
                <div className="mini-q-item expanded">
                  <div className="mini-q-row"><span className="mini-q-num">✦</span><span className="mini-q-text">신규 결제 시스템 구축 완료</span></div>
                  <div className="mini-q-answer">→ TPS 2배 향상 (500→1000), 결제 성공률 98.7% 달성. Redis 캐싱 도입으로 응답속도 40% 개선</div>
                </div>
                <div className="mini-q-item"><span className="mini-q-num">✦</span><span className="mini-q-text">A/B 테스트 프레임워크 설계</span></div>
                <div className="mini-q-item"><span className="mini-q-num">✦</span><span className="mini-q-text">주니어 개발자 2명 온보딩 리드</span></div>
                <div className="mini-q-item"><span className="mini-q-num">✦</span><span className="mini-q-text">기술 블로그 2건 작성 (조회수 5K+)</span></div>
              </div>
              <div className="mini-reverse-bar">
                💾 이력서 자동 반영 &nbsp;/&nbsp;
                <span style={{ color: 'var(--muted2)' }}>월간 누적 → 최신 이력서 생성</span>
              </div>
            </div>
          )}

          {heroTab === 2 && effectiveType === 'HEADHUNTER' && (
            <div className="demo-body demo-body-interview">
              <div className="mini-jd-header">
                <span className="mini-jd-co">📝 클라이언트 제안서</span>
                <span className="mini-jd-pos">토스 / 시니어 백엔드 (김OO 후보)</span>
              </div>
              <div className="mini-interview-list">
                <div className="mini-q-item expanded">
                  <div className="mini-q-row"><span className="mini-q-num">✦</span><span className="mini-q-text">후보자 강점 요약</span></div>
                  <div className="mini-q-answer">→ 결제 시스템 5년 경험, TPS 최적화 전문성. 토스 기술 스택 80% 일치</div>
                </div>
                <div className="mini-q-item"><span className="mini-q-num">✦</span><span className="mini-q-text">적합도 근거: 82점 (HIGH FIT)</span></div>
                <div className="mini-q-item"><span className="mini-q-num">✦</span><span className="mini-q-text">예상 면접 질문 10개 포함</span></div>
                <div className="mini-q-item"><span className="mini-q-num">✦</span><span className="mini-q-text">연봉 협상 가이드 (12000-14000만원)</span></div>
              </div>
              <div className="mini-reverse-bar">
                📥 HTML/PDF 다운로드 &nbsp;/&nbsp;
                <span style={{ color: 'var(--muted2)' }}>클라이언트 즉시 공유</span>
              </div>
            </div>
          )}

          {heroTab === 3 && (
            <div className="demo-body demo-body-interview">
              <div className="mini-jd-header">
                <span className="mini-jd-co">{effectiveType === 'HEADHUNTER' ? '⚙️ 프로세스 관리' : '🎤 면접 가이드'}</span>
                <span className="mini-jd-pos">{effectiveType === 'HEADHUNTER' ? '파이프라인 현황' : '토스 / PM (AI Growth)'}</span>
              </div>
              {effectiveType === 'JOBSEEKER' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="mini-interview-list">
                    <div className="mini-q-item expanded">
                      <div className="mini-q-row"><span className="mini-q-num">📊</span><span className="mini-q-text">진행 중 12건 (서류전형 5 / 면접 4 / 최종 3)</span></div>
                      <div className="mini-q-answer">→ 이번 주 면접 일정 4건, 다음 주 최종 결과 2건 예정</div>
                    </div>
                    <div className="mini-q-item"><span className="mini-q-num">💰</span><span className="mini-q-text">6월 정산: 2건 합격 (수수료 3,200만원)</span></div>
                    <div className="mini-q-item"><span className="mini-q-num">📅</span><span className="mini-q-text">이번 주 클라이언트 미팅 3건</span></div>
                    <div className="mini-q-item"><span className="mini-q-num">🎯</span><span className="mini-q-text">목표 대비 진행률: 73% (목표 5000만원)</span></div>
                  </div>
                  <div className="mini-reverse-bar">
                    📈 실시간 대시보드 &nbsp;/&nbsp;
                    <span style={{ color: 'var(--muted2)' }}>정산 자동화</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showDemo && <DemoModal userType={userType} onClose={() => setShowDemo(false)} />}
    </section>
  )
}
