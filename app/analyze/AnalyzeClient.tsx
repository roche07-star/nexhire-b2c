'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import Link from 'next/link'

interface AnalysisResult {
  scores: {
    job_fit: number
    market_competitiveness: number
    growth_potential: number
  }
  careers: string[]
  strengths: string[]
  improvements: string[]
  keywords: string[]
  summary: string
}

export default function AnalyzeClient() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setResult(null)
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
      }
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="analyze-page">
      <div className="analyze-container">
        <div className="analyze-header">
          <div className="section-label">AI 분석</div>
          <h1 className="analyze-title">이력서 분석</h1>
          <p className="analyze-sub">PDF 또는 DOCX 파일을 업로드하면 AI가 3분 안에 커리어 방향을 제시합니다.</p>
        </div>

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

        {result && <AnalysisResults result={result} />}
      </div>
    </main>
  )
}

function AnalysisResults({ result }: { result: AnalysisResult }) {
  const scores = [
    { label: '직무 적합도', value: result.scores.job_fit },
    { label: '시장 경쟁력', value: result.scores.market_competitiveness },
    { label: '성장 가능성', value: result.scores.growth_potential },
  ]

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
          <div className="results-label">💡 추천 커리어 방향</div>
          <ul className="result-list career-list">
            {result.careers.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>

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
    </div>
  )
}
