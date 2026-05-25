'use client'

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react'
import Link from 'next/link'

interface CareerPath {
  type: 'BASELINE' | 'RECOMMENDED' | 'STRETCH'
  label: string
  title: string
  salary_range: string
  salary_bands: { period: string; min: number; max: number }[]
  points: string[]
}

interface AnalysisResult {
  candidate_name?: string
  job_title?: string
  scores: {
    job_fit: number
    market_competitiveness: number
    growth_potential: number
  }
  careers?: string[]
  career_paths?: CareerPath[]
  strengths: string[]
  improvements: string[]
  keywords: string[]
  summary: string
  plan?: 'FREE' | 'PRO' | 'EXPERT'
}

interface SavedAnalysis {
  result: AnalysisResult
  created_at: string
  expires_at: string
}

const CAREER_COLORS: Record<string, string> = {
  BASELINE: 'var(--muted2)',
  RECOMMENDED: '#e8a020',
  STRETCH: 'var(--accent)',
}

const CAREER_COLORS_HEX: Record<string, string> = {
  BASELINE: '#888880',
  RECOMMENDED: '#e8a020',
  STRETCH: '#e8ff47',
}

function generateReportHTML(result: AnalysisResult, date?: string): string {
  const scores = [
    { label: '직무 적합도', value: result.scores.job_fit },
    { label: '시장 경쟁력', value: result.scores.market_competitiveness },
    { label: '성장 가능성', value: result.scores.growth_potential },
  ]

  const careerPathsHTML = result.career_paths
    ? result.career_paths.map((p) => {
        const color = CAREER_COLORS_HEX[p.type] ?? '#ffffff'
        const maxVal = Math.max(...p.salary_bands.map((b) => b.max || b.min))
        const bandsHTML = p.salary_bands.map((b) => {
          const pct = maxVal ? Math.min(100, Math.round(((b.max || b.min) / maxVal) * 100)) : 0
          const rangeStr = !b.min ? '–' : b.max ? `${b.min.toLocaleString()}~${b.max.toLocaleString()}만원` : `${b.min.toLocaleString()}만원+`
          return `<div class="band-row"><span class="band-year">${b.period}</span><div class="band-bar-wrap"><div class="band-bar" style="width:${pct}%;background:${color}"></div></div><span class="band-val">${rangeStr}</span></div>`
        }).join('')
        const pointsHTML = p.points.map((pt) => `<li>${pt}</li>`).join('')
        return `
<div class="career-block">
  <div class="career-block-head">
    <span class="career-type-badge" style="border-color:${color};color:${color}">${p.type}</span>
    <span class="career-label">${p.label}</span>
  </div>
  <div class="career-title-row">
    <span class="career-title">${p.title}</span>
    <span class="career-salary" style="color:${color}">${p.salary_range}</span>
  </div>
  <div class="band-section">
    <div class="band-title">연봉 밴드 (단위: 만원)</div>
    ${bandsHTML}
  </div>
  <ul class="career-points">${pointsHTML}</ul>
</div>`
      }).join('')
    : (result.careers ?? []).map((c) => `<li>${c}</li>`).join('')

  const keywordsHTML = result.keywords.map((k) => `<span class="chip">${k}</span>`).join('')
  const strengthsHTML = result.strengths.map((s) => `<li>${s}</li>`).join('')
  const improvementsHTML = result.improvements.map((s) => `<li>${s}</li>`).join('')
  const scoresHTML = scores.map((s) => `
<div class="score-row">
  <div class="score-meta"><span class="score-name">${s.label}</span><span class="score-val">${s.value}%</span></div>
  <div class="score-bar-wrap"><div class="score-bar" style="width:${s.value}%"></div></div>
</div>`).join('')

  const titleLine = result.candidate_name
    ? `<div class="report-candidate">${result.candidate_name}${result.job_title ? ` <span class="report-job">${result.job_title}</span>` : ''}</div>`
    : result.job_title
    ? `<div class="report-candidate">${result.job_title}</div>`
    : ''

  const dateStr = date ? new Date(date).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Nexhire 이력서 분석 리포트</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e8e8de;font-family:'Segoe UI',system-ui,sans-serif;padding:40px 20px;line-height:1.6}
.wrap{max-width:780px;margin:0 auto}
.report-header{border-bottom:1px solid #2a2a22;padding-bottom:28px;margin-bottom:36px}
.report-logo{font-size:13px;font-weight:700;letter-spacing:3px;color:#888880;margin-bottom:20px}
.report-candidate{font-size:42px;font-weight:800;color:#fff;letter-spacing:-1.5px;line-height:1.1;margin-bottom:8px}
.report-job{font-size:20px;font-weight:400;color:#888880;letter-spacing:0;margin-left:12px}
.report-date{font-size:13px;color:#555550;margin-top:12px}
.section{margin-bottom:36px}
.label{font-size:11px;font-weight:700;letter-spacing:2px;color:#888880;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid #1e1e18;padding-bottom:8px}
.score-row{margin-bottom:14px}
.score-meta{display:flex;justify-content:space-between;margin-bottom:6px}
.score-name{font-size:14px;color:#b8b8ae}
.score-val{font-size:14px;font-weight:700;color:#e8ff47}
.score-bar-wrap{height:6px;background:#1e1e18;border-radius:3px;overflow:hidden}
.score-bar{height:100%;background:#e8ff47;border-radius:3px}
.summary{font-size:15px;color:#b8b8ae;line-height:1.8}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:36px}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{background:#1a1a14;border:1px solid #2a2a22;color:#b8b8ae;padding:4px 12px;border-radius:20px;font-size:13px}
ul.list{list-style:none;display:flex;flex-direction:column;gap:8px}
ul.list li{font-size:14px;color:#b8b8ae;padding-left:14px;position:relative}
ul.list li::before{content:'—';position:absolute;left:0;color:#e8ff47}
ul.improve li::before{color:#888880}
.career-block{background:#111108;border:1px solid #2a2a22;border-radius:12px;padding:24px;margin-bottom:20px}
.career-block-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.career-type-badge{font-size:11px;font-weight:700;letter-spacing:2px;border:1px solid;padding:3px 10px;border-radius:20px}
.career-label{font-size:13px;color:#888880}
.career-title-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.career-title{font-size:20px;font-weight:700;color:#fff}
.career-salary{font-size:15px;font-weight:600}
.band-section{margin-bottom:16px}
.band-title{font-size:11px;color:#555550;letter-spacing:1px;margin-bottom:10px}
.band-row{display:grid;grid-template-columns:70px 1fr 140px;gap:12px;align-items:center;margin-bottom:8px}
.band-year{font-size:12px;color:#888880}
.band-bar-wrap{height:4px;background:#1e1e18;border-radius:2px;overflow:hidden}
.band-bar{height:100%;border-radius:2px}
.band-val{font-size:12px;color:#b8b8ae;text-align:right}
.career-points{list-style:none;display:flex;flex-direction:column;gap:8px}
.career-points li{font-size:14px;color:#b8b8ae;padding-left:14px;position:relative}
.career-points li::before{content:'›';position:absolute;left:0;color:#e8ff47;font-weight:700}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #1e1e18;font-size:12px;color:#444440;text-align:center}
@media print{body{background:#fff;color:#111}
.career-block{border-color:#ddd;background:#fafafa}
.score-bar-wrap,.band-bar-wrap{background:#eee}
.label{color:#666;border-color:#ddd}
.chip{background:#f0f0f0;border-color:#ddd;color:#333}
.summary,.score-name,.band-year,.band-val,.career-points li,.career-label{color:#333}
.score-val{color:#555}
.career-title{color:#111}
.report-candidate{color:#111}
.footer{color:#aaa}}
</style>
</head>
<body>
<div class="wrap">
  <div class="report-header">
    <div class="report-logo">NEXHIRE · AI 이력서 분석</div>
    ${titleLine}
    <div class="report-date">분석일: ${dateStr}</div>
  </div>
  <div class="section">
    <div class="label">Match Score</div>
    ${scoresHTML}
  </div>
  <div class="section">
    <div class="label">종합 요약</div>
    <p class="summary">${result.summary}</p>
  </div>
  <div class="grid">
    <div class="section">
      <div class="label">핵심 키워드</div>
      <div class="chips">${keywordsHTML}</div>
    </div>
    <div class="section">
      <div class="label">✦ 강점</div>
      <ul class="list">${strengthsHTML}</ul>
    </div>
    <div class="section">
      <div class="label">개선 포인트</div>
      <ul class="list improve">${improvementsHTML}</ul>
    </div>
  </div>
  <div class="section">
    <div class="label">${result.career_paths ? '💡 커리어 방향 분석' : '💡 추천 커리어 방향'}</div>
    ${result.career_paths ? careerPathsHTML : `<ul class="list">${careerPathsHTML}</ul>`}
  </div>
  <div class="footer">Generated by Nexhire &nbsp;·&nbsp; nexhire.kr &nbsp;·&nbsp; ${dateStr}</div>
</div>
</body>
</html>`
}

function downloadReport(result: AnalysisResult, date?: string) {
  const html = generateReportHTML(result, date)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const name = result.candidate_name ?? '이력서분석'
  a.href = url
  a.download = `nexhire_${name}_${new Date().toISOString().slice(0, 10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

type SidebarMenu = 'upload' | 'saved' | 'rewrite'

export default function AnalyzeClient({ initialIsPro }: { initialIsPro: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAnalysis | null>(null)
  const [isPro] = useState(initialIsPro)
  const [activeMenu, setActiveMenu] = useState<SidebarMenu>('upload')
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialIsPro) return
    fetch('/api/analyze/latest')
      .then((r) => r.json())
      .then(({ analysis }) => {
        if (analysis) setSavedAnalysis(analysis)
      })
      .catch(() => {})
  }, [initialIsPro])

  function handleFile(f: File) {
    setFile(f)
    setError(null)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  async function onAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const fd = new FormData()
      fd.append('resume', file)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '알 수 없는 오류가 발생했습니다.')
      } else {
        setResult(data)
        setFile(null)
        setAgreed(false)
        if (data.plan === 'PRO' || data.plan === 'EXPERT') {
          const newSaved: SavedAnalysis = {
            result: data,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          }
          setSavedAnalysis(newSaved)
        }
      }
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const sidebarMenuItems = [
    {
      id: 'rewrite' as SidebarMenu,
      icon: '✏️',
      label: 'Re-Writing',
      enabled: false,
      soon: true,
    },
    {
      id: 'upload' as SidebarMenu,
      icon: '📄',
      label: '새 분석',
      enabled: true,
    },
    {
      id: 'saved' as SidebarMenu,
      icon: '📂',
      label: '분석 다시 보기',
      enabled: !!savedAnalysis,
      badge: savedAnalysis ? new Date(savedAnalysis.created_at).toLocaleDateString('ko-KR') : undefined,
    },
  ]

  function onMenuClick(id: SidebarMenu) {
    if (id === 'saved' && savedAnalysis) {
      setResult(savedAnalysis.result)
      setActiveMenu('saved')
    } else if (id === 'upload') {
      setResult(null)
      setActiveMenu('upload')
      setFile(null)
      setError(null)
      setAgreed(false)
    } else if (id === 'rewrite') {
      // 준비중
    }
  }

  return (
    <main className="analyze-page">
      <div className="analyze-layout">

        {/* 메인 콘텐츠 */}
        <div className="analyze-main">
          <div className="analyze-container">

            {/* 상단 탭 — PRO 이상만 표시 */}
            {isPro && (
              <div className="analyze-tab-bar">
                <button
                  className={`analyze-tab-btn${activeMenu === 'upload' ? ' active' : ''}`}
                  onClick={() => onMenuClick('upload')}
                >
                  <span>📄</span> 새 분석
                </button>
                <button
                  className={`analyze-tab-btn${activeMenu === 'saved' ? ' active' : ''}${!savedAnalysis ? ' disabled' : ''}`}
                  onClick={() => onMenuClick('saved')}
                  disabled={!savedAnalysis}
                >
                  <span>📂</span> 분석 다시 보기
                  {savedAnalysis && <span className="tab-badge">{new Date(savedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>}
                </button>
                <button className="analyze-tab-btn disabled" disabled>
                  <span>✏️</span> Re-Writing <span className="tab-soon">준비중</span>
                </button>
              </div>
            )}
            <div className={`analyze-header${activeMenu === 'saved' && result ? ' analyze-header--saved' : ''}`}>
              {activeMenu === 'saved' && result?.candidate_name ? (
                <div className="analyze-candidate-header">
                  <div className="analyze-candidate-name">{result.candidate_name}</div>
                  {result.job_title && <div className="analyze-candidate-job">{result.job_title}</div>}
                </div>
              ) : (
                <>
                  <h1 className="analyze-title">이력서 분석</h1>
                  {activeMenu !== 'saved' && (
                    <p className="analyze-sub">PDF 또는 DOCX 파일을 업로드하면 AI가 3분 안에 커리어 방향을 제시합니다.</p>
                  )}
                </>
              )}
            </div>

            {/* 업로드 모드 */}
            {activeMenu !== 'saved' && !result && (
              <>
                <div
                  className={`upload-zone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx"
                    style={{ display: 'none' }}
                    onChange={onFileChange}
                  />
                  {file ? (
                    <>
                      <div className="upload-icon-success">✓</div>
                      <div className="upload-filename">{file.name}</div>
                      <div className="upload-hint">클릭하여 다른 파일 선택</div>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon-main">📄</div>
                      <div className="upload-main-text">이력서를 드래그하거나 클릭하여 업로드</div>
                      <div className="upload-hint">PDF, DOCX · 최대 10MB</div>
                    </>
                  )}
                </div>

                <label className="consent-wrap">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="consent-checkbox"
                  />
                  <span className="consent-text">
                    이력서 내 직무 정보가 AI 분석에 활용됨에 동의합니다.
                    성명·연락처·이메일은 분석 전 자동 마스킹 처리됩니다.{' '}
                    <Link href="/privacy" target="_blank" className="consent-link">개인정보처리방침</Link>
                  </span>
                </label>

                {error && <div className="analyze-error">{error}</div>}

                <button
                  className="btn-hero analyze-btn"
                  onClick={onAnalyze}
                  disabled={!file || loading || !agreed}
                >
                  {loading ? 'AI 분석 중...' : '분석 시작하기 →'}
                </button>

                {loading && (
                  <div className="analyze-loading">
                    <div className="loading-bar"><div className="loading-fill" /></div>
                    <div className="loading-text">헤드헌터 AI가 이력서를 검토하고 있습니다...</div>
                  </div>
                )}
              </>
            )}

            {/* 결과 모드 (새 분석 or 저장된 분석) */}
            {result && (
              <>
                {activeMenu === 'saved' && savedAnalysis && (
                  <div className="analyze-saved-notice">
                    <span>📂 저장된 분석 결과</span>
                    <span className="analyze-saved-date">
                      분석일: {new Date(savedAnalysis.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}

                <AnalysisResults result={result} />

                {(result.plan === 'PRO' || result.plan === 'EXPERT') && savedAnalysis && (
                  <div className="analyze-storage-notice">
                    <span className="storage-icon">🔒</span>
                    <span>
                      이 분석 결과는{' '}
                      <strong>{new Date(savedAnalysis.expires_at).toLocaleDateString('ko-KR')}</strong>
                      까지 저장됩니다.
                    </span>
                  </div>
                )}

                {!isPro && (
                  <div className="analyze-storage-notice">
                    <span className="storage-icon">💡</span>
                    <span>PRO 플랜으로 업그레이드하면 결과가 10일간 저장됩니다.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function AnalysisResults({ result }: { result: AnalysisResult }) {
  const [activeCareerTab, setActiveCareerTab] = useState(
    result.career_paths ? Math.min(1, result.career_paths.length - 1) : 0
  )

  const scores = [
    { label: '직무 적합도', value: result.scores.job_fit },
    { label: '시장 경쟁력', value: result.scores.market_competitiveness },
    { label: '성장 가능성', value: result.scores.growth_potential },
  ]

  const paths = result.career_paths
  const active = paths?.[activeCareerTab]

  const globalMax = paths
    ? Math.max(...paths.flatMap((p) => p.salary_bands.map((b) => b.max || b.min)))
    : 0

  function bandPct(b: { min: number; max: number }) {
    const val = b.max || b.min
    if (!globalMax || !val) return 0
    return Math.min(100, Math.round((val / globalMax) * 100))
  }

  return (
    <div className="results-wrap">
      <div className="results-section">
        <div className="results-label">MATCH SCORE</div>
        {scores.map((s) => (
          <div key={s.label} className="result-score-row">
            <div className="score-meta">
              <span className="score-name">{s.label}</span>
              <span className="score-val">{s.value}%</span>
            </div>
            <div className="score-bar-wrap">
              <div className="score-bar" style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="results-section">
        <div className="results-label">종합 요약</div>
        <p className="result-summary">{result.summary}</p>
      </div>

      <div className="results-grid">
        <div className="results-section">
          <div className="results-label">핵심 키워드</div>
          <div className="keyword-chips">
            {result.keywords.map((k, i) => <span key={i} className="keyword-chip">{k}</span>)}
          </div>
        </div>
        <div className="results-section">
          <div className="results-label">✦ 강점</div>
          <ul className="result-list">
            {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="results-section">
          <div className="results-label">개선 포인트</div>
          <ul className="result-list improvement-list">
            {result.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      {paths && active ? (
        <div className="results-section">
          <div className="results-label" style={{ marginTop: 8 }}>💡 커리어 방향 분석</div>
          <div className="career-cards">
            {paths.map((p, i) => (
              <button
                key={p.type}
                className={`career-card${i === activeCareerTab ? ' active' : ''}`}
                onClick={() => setActiveCareerTab(i)}
              >
                <div className="career-card-type">{p.type}</div>
                <div className="career-card-salary" style={{ color: CAREER_COLORS[p.type] ?? 'inherit' }}>
                  {p.salary_range}
                </div>
                <div className="career-card-title">{p.title}</div>
              </button>
            ))}
          </div>
          <div className="career-tabs">
            {paths.map((p, i) => (
              <button
                key={p.type}
                className={`career-tab${i === activeCareerTab ? ' active' : ''}`}
                onClick={() => setActiveCareerTab(i)}
              >
                <span className="career-tab-label">{p.type}</span>
                <span className="career-tab-sub">{p.label}</span>
              </button>
            ))}
          </div>
          <div className="salary-band-wrap">
            <div className="salary-band-title">연봉 밴드 — {active.label} (단위: 만원)</div>
            {active.salary_bands.map((b) => (
              <div key={b.period} className="salary-band-row">
                <span className="salary-band-year">{b.period}</span>
                <div className="salary-band-bar-wrap">
                  <div className="salary-band-bar" style={{ width: `${bandPct(b)}%` }} />
                </div>
                <span className="salary-band-range">
                  {!b.min ? '–' : b.max ? `${b.min.toLocaleString()}~${b.max.toLocaleString()}` : `${b.min.toLocaleString()}+`}
                </span>
              </div>
            ))}
          </div>
          <div className="career-detail">
            <div className="career-detail-badge">{active.type}</div>
            <div className="career-detail-header">
              <span className="career-detail-title">{active.title}</span>
              <span className="career-detail-salary" style={{ color: CAREER_COLORS[active.type] ?? 'inherit' }}>
                {active.salary_range}
              </span>
            </div>
            <ul className="career-detail-list">
              {active.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div className="results-section">
          <div className="results-label">💡 추천 커리어 방향</div>
          <ul className="result-list career-list">
            {(result.careers ?? []).map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      <div className="analyze-download-wrap">
        <button
          className="analyze-download-btn"
          onClick={() => downloadReport(result)}
        >
          ↓ HTML 리포트 다운로드
        </button>
      </div>
    </div>
  )
}
