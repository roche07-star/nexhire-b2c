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
  _id?: string | null
  _rewrite_saved?: boolean
  _file_path?: string
  refined?: boolean
  refinement_text?: string
}

interface SavedAnalysis {
  result: AnalysisResult
  created_at: string
  expires_at: string
}

interface JDResult {
  company: string
  position?: string
  fit_score: number
  recommendation: 'APPLY' | 'CONSIDER' | 'SKIP'
  verdict: string
  matching_points: string[]
  gaps: string[]
  pitch_points: string[]
  resume_job_title?: string
  resume_analyzed_at?: string
  expires_at?: string
}

const toArr = (v: unknown): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n').filter(Boolean) : []

interface InterviewGuideResult {
  id?: string | null
  expires_at?: string | null
  positioning_message: string
  self_intro: string
  qa_resign_reason: string
  qa_domain_gap: string
  qa_competency: string
  qa_post_join: string
  qa_salary: string
  strengths: string[]
  risks: Array<{ risk: string; response: string }>
  reverse_questions: string[]
  checklist: string[]
  company?: string | null
  position?: string | null
  candidate_name?: string | null
}

interface SavedInterviewGuide {
  id: string
  result: InterviewGuideResult
  created_at: string
  expires_at: string
}

interface AnalysisListItem {
  id: string
  result: AnalysisResult
  created_at: string
  expires_at: string
}

interface SavedJDAnalysis {
  id: string
  result: JDResult
  created_at: string
  expires_at?: string | null
}

const FEATURE_LABEL: Record<string, string> = {
  resume: '이력서 분석',
  direction: '방향성 분석',
  jd: 'JD 매칭 분석',
  rewrite: '이력서 보존 (Re-Writing)',
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

function generateInterviewHTML(guide: InterviewGuideResult): string {
  const dateStr = new Date().toLocaleDateString('ko-KR')
  const title = [guide.candidate_name, guide.company, guide.position].filter(Boolean).join(' · ')

  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const lines = (s: string) => esc(s).split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('')
  const listItems = (arr: string[]) => arr.map(s => `<li>${esc(s)}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>면접 가이드 — ${esc(title || '후보자')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e0e0f0;font-family:'Malgun Gothic','맑은 고딕',sans-serif;padding:40px 24px;max-width:820px;margin:0 auto;line-height:1.7}
h1{font-size:22px;font-weight:700;color:#e8ff47;margin-bottom:4px}
.sub{font-size:13px;color:#888;margin-bottom:32px}
.section{background:#12121a;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:22px 26px;margin-bottom:20px}
.sec-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#e8ff47;border-bottom:1px solid rgba(232,255,71,0.12);padding-bottom:10px;margin-bottom:14px}
.positioning{font-size:15px;font-weight:600;color:#fff;background:rgba(232,255,71,0.06);border-left:3px solid #e8ff47;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:4px}
.qa-label{font-size:12px;font-weight:700;color:#e0e0f0;margin:14px 0 6px}
p{font-size:14px;color:#b0b0c8;margin-bottom:5px}
ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:7px;margin-top:4px}
li{font-size:14px;color:#b0b0c8;padding-left:16px;position:relative}
li::before{content:'›';position:absolute;left:0;color:#e8ff47;font-weight:700}
.strength{background:rgba(76,175,134,0.08);border:1px solid rgba(76,175,134,0.2);border-radius:8px;padding:8px 14px;font-size:14px;color:#4caf86;margin-bottom:7px}
.risk{background:rgba(255,107,107,0.05);border:1px solid rgba(255,107,107,0.15);border-radius:8px;padding:10px 14px;margin-bottom:10px}
.risk-label{font-size:13px;font-weight:600;color:#ff9a9a;margin-bottom:4px}
.risk-resp{font-size:13px;color:#b0b0c8}
.checklist{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px}
.checklist li{display:flex;align-items:flex-start;gap:8px;padding-left:0}
.checklist li::before{content:none}
.chk{color:#e8ff47;flex-shrink:0}
.footer{text-align:center;font-size:11px;color:#444;margin-top:36px}
</style>
</head>
<body>
<h1>${esc(guide.candidate_name ?? '후보자')} 면접 가이드</h1>
<div class="sub">${guide.company ? esc(guide.company) + (guide.position ? ` — ${esc(guide.position)}` : '') + ' &nbsp;·&nbsp; ' : ''}생성일: ${dateStr}</div>

<div class="section">
  <div class="sec-title">SECTION 1 — 핵심 포지셔닝 메시지</div>
  <div class="positioning">"${esc(guide.positioning_message)}"</div>
</div>

<div class="section">
  <div class="sec-title">SECTION 2 — 자기소개 설계</div>
  ${lines(guide.self_intro)}
</div>

<div class="section">
  <div class="sec-title">SECTION 3 — 예상 질문 & 답변 가이드</div>
  <div class="qa-label">A. 이직 사유</div>${lines(guide.qa_resign_reason)}
  ${guide.qa_domain_gap && guide.qa_domain_gap !== '해당없음' ? `<div class="qa-label">B. 도메인 갭 대응</div>${lines(guide.qa_domain_gap)}` : ''}
  <div class="qa-label">C. 역량 검증 (STAR)</div>${lines(guide.qa_competency)}
  <div class="qa-label">D. 입사 후 계획</div>${lines(guide.qa_post_join)}
  <div class="qa-label">E. 희망 연봉</div>${lines(guide.qa_salary)}
</div>

<div class="section">
  <div class="sec-title">SECTION 4 — 강점 & 리스크</div>
  ${toArr(guide.strengths).map(s => `<div class="strength">✅ ${esc(s)}</div>`).join('')}
  ${(guide.risks ?? []).map(r => `<div class="risk"><div class="risk-label">⚠️ ${esc(r.risk)}</div><div class="risk-resp">→ ${esc(r.response)}</div></div>`).join('')}
</div>

<div class="section">
  <div class="sec-title">SECTION 5 — 역질문 추천</div>
  <ul>${listItems(toArr(guide.reverse_questions))}</ul>
</div>

<div class="section">
  <div class="sec-title">SECTION 6 — 면접 전 체크리스트</div>
  <ul class="checklist">${toArr(guide.checklist).map(c => `<li><span class="chk">☑</span>${esc(c)}</li>`).join('')}</ul>
</div>

<div class="footer">Generated by Jobizic · AI 면접 가이드</div>
</body>
</html>`
}

function generateReportHTML(result: AnalysisResult, date?: string): string {
  const scores = [
    { label: '직무 적합도', value: result.scores?.job_fit },
    { label: '시장 경쟁력', value: result.scores?.market_competitiveness },
    { label: '성장 가능성', value: result.scores?.growth_potential },
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

  const keywordsHTML = toArr(result.keywords).map((k) => `<span class="chip">${k}</span>`).join('')
  const strengthsHTML = toArr(result.strengths).map((s) => `<li>${s}</li>`).join('')
  const improvementsHTML = toArr(result.improvements).map((s) => `<li>${s}</li>`).join('')
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
<title>Jobizic 이력서 분석 리포트</title>
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
    <div class="report-logo">JOBIZIC · AI 이력서 분석</div>
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
  <div class="footer">Generated by Jobizic &nbsp;·&nbsp; jobizic.io &nbsp;·&nbsp; ${dateStr}</div>
</div>
</body>
</html>`
}

function downloadReport(result: AnalysisResult, date?: string) {
  const html = generateReportHTML(result, date)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const name = result.candidate_name ?? '무기명'
  a.href = url
  a.download = `jobizic_${name}_${new Date().toISOString().slice(0, 10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function generateJDReportHTML(jd: JDResult, item: AnalysisListItem): string {
  const color = REC_COLOR_HEX[jd.recommendation] ?? '#888'
  const label = REC_LABEL_CONST[jd.recommendation] ?? jd.recommendation
  const dateStr = new Date().toLocaleDateString('ko-KR')
  const analysisDate = new Date(item.created_at).toLocaleDateString('ko-KR')

  const listHTML = (arr: unknown, bullet = '›') =>
    toArr(arr).map((s) => `<li><span class="bullet">${bullet}</span>${s}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Jobizic JD 적합도 리포트 — ${jd.company}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e8e8de;font-family:'Segoe UI',system-ui,sans-serif;padding:40px 20px;line-height:1.6}
.wrap{max-width:780px;margin:0 auto}
.logo{font-size:12px;font-weight:700;letter-spacing:3px;color:#888880;margin-bottom:20px}
.header{border-bottom:1px solid #2a2a22;padding-bottom:28px;margin-bottom:36px}
.company{font-size:13px;font-weight:700;letter-spacing:2px;color:#888880;text-transform:uppercase;margin-bottom:10px}
.score-row{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.score{font-size:64px;font-weight:800;letter-spacing:-3px;line-height:1;color:${color}}
.badge{font-size:12px;font-weight:700;letter-spacing:1px;border:1px solid ${color};color:${color};padding:4px 12px;border-radius:20px;align-self:center}
.verdict{font-size:15px;color:#b8b8ae;line-height:1.7}
.resume-ref{background:#111108;border:1px solid #2a2a22;border-radius:8px;padding:12px 16px;margin-bottom:32px;font-size:13px;color:#888880}
.resume-ref strong{color:#e8e8de}
.section{margin-bottom:32px}
.label{font-size:11px;font-weight:700;letter-spacing:2px;color:#888880;text-transform:uppercase;border-bottom:1px solid #1e1e18;padding-bottom:8px;margin-bottom:14px}
ul{list-style:none;display:flex;flex-direction:column;gap:8px}
li{font-size:14px;color:#b8b8ae;display:flex;gap:10px;line-height:1.6}
.bullet{color:${color};font-weight:700;flex-shrink:0}
.gap-bullet{color:#ff8080}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #1e1e18;font-size:12px;color:#444440;text-align:center}
@media print{body{background:#fff;color:#111}.score{color:${color}}.badge{color:${color};border-color:${color}}.resume-ref{background:#f5f5f5;border-color:#ddd}.label{color:#666;border-color:#ddd}li{color:#333}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">JOBIZIC · JD 적합도 분석</div>
    <div class="company">${jd.company}${jd.position ? ` <span style="font-size:14px;font-weight:500;opacity:0.7">· ${jd.position}</span>` : ''}</div>
    <div class="score-row">
      <span class="score">${jd.fit_score}%</span>
      <span class="badge">${label}</span>
    </div>
    <p class="verdict">${jd.verdict}</p>
  </div>
  <div class="resume-ref">
    기반 이력서 분석: <strong>${item.result.job_title ?? '이력서 분석'}</strong> &nbsp;·&nbsp; ${analysisDate}
  </div>
  <div class="section" style="margin-bottom:32px">
    <div class="label">💬 어필 전략 · 제안 포인트</div>
    <ul>${listHTML(jd.pitch_points)}</ul>
  </div>
  <div class="grid">
    <div class="section">
      <div class="label">✅ 매칭 강점</div>
      <ul>${listHTML(jd.matching_points)}</ul>
    </div>
    <div class="section">
      <div class="label">⚠️ 부족한 점</div>
      <ul>${toArr(jd.gaps).map((s) => `<li><span class="bullet gap-bullet">›</span>${s}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="footer">Generated by Jobizic &nbsp;·&nbsp; jobizic.io &nbsp;·&nbsp; ${dateStr}</div>
</div>
</body>
</html>`
}

const REC_LABEL_CONST: Record<string, string> = {
  APPLY: '지원 강력 추천',
  CONSIDER: '조건부 추천',
  SKIP: '부적합',
}
const REC_COLOR_HEX: Record<string, string> = {
  APPLY: '#4caf86',
  CONSIDER: '#e8a020',
  SKIP: '#ff6b6b',
}

function downloadJDReport(jd: JDResult, item: AnalysisListItem) {
  const html = generateJDReportHTML(jd, item)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jobizic_JD_${jd.company}_${new Date().toISOString().slice(0, 10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

type SidebarMenu = 'upload' | 'saved' | 'jd' | 'rewrite' | 'interview'

export default function AnalyzeClient({ initialIsPro, initialIsExpert, userEmail }: { initialIsPro: boolean; initialIsExpert?: boolean; userEmail: string | null }) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAnalysis | null>(null)
  const [isPro] = useState(initialIsPro)
  const [isExpert] = useState(!!initialIsExpert)
  const [activeMenu, setActiveMenu] = useState<SidebarMenu>('upload')
  const [rewritingId, setRewritingId] = useState<string | null>(null)
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  const [rewriteChanges, setRewriteChanges] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const jdTopRef = useRef<HTMLDivElement>(null)
  const [jdCompany, setJdCompany] = useState('')
  const [jdPosition, setJdPosition] = useState('')
  const [jdContent, setJdContent] = useState('')
  const [jdResult, setJdResult] = useState<JDResult | null>(null)
  const [jdLoading, setJdLoading] = useState(false)
  const [jdError, setJdError] = useState<string | null>(null)
  const [analysisList, setAnalysisList] = useState<AnalysisListItem[] | null>(null)
  const [analysisListLoading, setAnalysisListLoading] = useState(false)
  const [jdSelectedAnalysis, setJdSelectedAnalysis] = useState<AnalysisListItem | null>(null)
  const [savedSelectedItem, setSavedSelectedItem] = useState<AnalysisListItem | null>(null)
  const [savedListLoading, setSavedListLoading] = useState(false)
  const [jdSavedList, setJdSavedList] = useState<SavedJDAnalysis[] | null>(null)
  const [jdSavedListLoading, setJdSavedListLoading] = useState(false)
  const [jdViewingSaved, setJdViewingSaved] = useState<SavedJDAnalysis | null>(null)
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null)
  const [deletingJdId, setDeletingJdId] = useState<string | null>(null)
  const [myCoupons, setMyCoupons] = useState<{ id: string; code: string; feature: string }[]>([])
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [couponClaiming, setCouponClaiming] = useState(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'analysis' | 'jd'; id: string } | null>(null)
  const [preserveModal, setPreserveModal] = useState(false)
  const preserveResolveRef = useRef<((choice: 'replace' | 'add' | 'skip' | 'cancel') => void) | null>(null)
  const [jdSelectModal, setJdSelectModal] = useState(false)
  const jdSelectResolveRef = useRef<((jdId: string | null | 'cancel') => void) | null>(null)
  const [formatSelectModal, setFormatSelectModal] = useState(false)
  const formatSelectResolveRef = useRef<((choice: 'original' | 'updated' | 'cancel') => void) | null>(null)
  const [templateUploadModal, setTemplateUploadModal] = useState(false)
  const templateUploadResolveRef = useRef<((file: File | 'cancel') => void) | null>(null)
  const [modalTemplateFile, setModalTemplateFile] = useState<File | null>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  // ── 면접 가이드
  const [interviewSelectedAnalysis, setInterviewSelectedAnalysis] = useState<AnalysisListItem | null>(null)
  const [interviewJdId, setInterviewJdId] = useState<string | null>(null)
  const [interviewFormat, setInterviewFormat] = useState('')
  const [interviewerInfo, setInterviewerInfo] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [interviewResult, setInterviewResult] = useState<InterviewGuideResult | null>(null)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewError, setInterviewError] = useState<string | null>(null)
  const [interviewSavedList, setInterviewSavedList] = useState<SavedInterviewGuide[] | null>(null)
  const [interviewSavedListLoading, setInterviewSavedListLoading] = useState(false)
  const [interviewViewingSaved, setInterviewViewingSaved] = useState<SavedInterviewGuide | null>(null)
  const [showNewInterview, setShowNewInterview] = useState(false)

  useEffect(() => {
    if (initialIsPro) return  // Pro는 분석 목록 탭이 있으므로 latest 불필요
    fetch('/api/analyze/latest')
      .then((r) => r.json())
      .then(({ analysis }) => {
        if (analysis?.result) {
          setResult(analysis.result)
          setSavedAnalysis({ result: analysis.result, created_at: analysis.created_at, expires_at: '' })
        }
      })
      .catch(() => {})
  }, [initialIsPro])

  useEffect(() => {
    fetch('/api/coupons/mine')
      .then((r) => r.json())
      .then(({ coupons }) => { if (coupons) setMyCoupons(coupons) })
      .catch(() => {})
  }, [])

  // PRO/Expert 유저는 마운트 시 분석 목록 미리 로드 (보존 모달용)
  useEffect(() => {
    if (!initialIsPro) return
    fetch('/api/analyze/list')
      .then((r) => r.json())
      .then(({ analyses }) => setAnalysisList(analyses ?? []))
      .catch(() => setAnalysisList([]))
  }, [initialIsPro])

  async function handleDeleteAnalysis(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteConfirm({ type: 'analysis', id })
  }

  async function handleDeleteJDAnalysis(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteConfirm({ type: 'jd', id })
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    const { type, id } = deleteConfirm
    setDeleteConfirm(null)
    if (type === 'analysis') {
      setDeletingAnalysisId(id)
      try {
        const res = await fetch(`/api/analyze/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setAnalysisList((prev) => prev ? prev.filter((a) => a.id !== id) : prev)
          if (savedSelectedItem?.id === id) setSavedSelectedItem(null)
        }
      } finally {
        setDeletingAnalysisId(null)
      }
    } else {
      setDeletingJdId(id)
      try {
        const res = await fetch(`/api/analyze/jd/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setJdSavedList((prev) => prev ? prev.filter((a) => a.id !== id) : prev)
          if (jdViewingSaved?.id === id) setJdViewingSaved(null)
        }
      } finally {
        setDeletingJdId(null)
      }
    }
  }

  function openJdSelectModal(): Promise<string | null | 'cancel'> {
    return new Promise(resolve => {
      jdSelectResolveRef.current = resolve
      setJdSelectModal(true)
    })
  }

  function resolveJdSelect(jdId: string | null | 'cancel') {
    setJdSelectModal(false)
    jdSelectResolveRef.current?.(jdId)
    jdSelectResolveRef.current = null
  }

  function openFormatSelectModal(): Promise<'original' | 'updated' | 'cancel'> {
    return new Promise(resolve => {
      formatSelectResolveRef.current = resolve
      setFormatSelectModal(true)
    })
  }

  function resolveFormatSelect(choice: 'original' | 'updated' | 'cancel') {
    setFormatSelectModal(false)
    formatSelectResolveRef.current?.(choice)
    formatSelectResolveRef.current = null
  }

  function openTemplateUploadModal(): Promise<File | 'cancel'> {
    return new Promise(resolve => {
      setModalTemplateFile(null)
      templateUploadResolveRef.current = resolve
      setTemplateUploadModal(true)
    })
  }

  function resolveTemplateUpload(file: File | 'cancel') {
    setTemplateUploadModal(false)
    setModalTemplateFile(null)
    templateUploadResolveRef.current?.(file)
    templateUploadResolveRef.current = null
  }

  async function handleRewrite(analysisId: string) {
    setRewriteError(null)

    // 양식 선택 모달
    const formatChoice = await openFormatSelectModal()
    if (formatChoice === 'cancel') return

    // 업데이트 이력서: 템플릿 DOCX 업로드
    let templateFile: File | null = null
    if (formatChoice === 'updated') {
      const fileChoice = await openTemplateUploadModal()
      if (fileChoice === 'cancel') return
      templateFile = fileChoice
    }

    // JD 목록 로드 (없으면)
    let jdList = jdSavedList
    if (!jdList) {
      try {
        const res = await fetch('/api/analyze/jd/list')
        const data = await res.json()
        jdList = data.analyses ?? []
        setJdSavedList(jdList)
      } catch { jdList = [] }
    }

    // JD 선택 모달 (JD 필수)
    const now = new Date()
    const validJds = (jdList ?? []).filter(jd => !jd.expires_at || new Date(jd.expires_at) > now)
    const jdChoice = await openJdSelectModal()
    if (jdChoice === 'cancel') return
    const jdAnalysisId = validJds.length > 0 ? (jdChoice as string) : null

    setRewritingId(analysisId)
    setRewriteChanges([])
    try {
      const fd = new FormData()
      fd.append('analysisId', analysisId)
      if (jdAnalysisId) fd.append('jdAnalysisId', jdAnalysisId)
      fd.append('formatMode', formatChoice)
      if (templateFile) fd.append('templateFile', templateFile)

      const res = await fetch('/api/analyze/rewrite', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRewriteError(data.error ?? '오류가 발생했습니다.')
        return
      }
      // base64 DOCX 디코드 후 다운로드
      const bytes = Uint8Array.from(atob(data.docx), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = data.filename ?? 'rewrite.docx'
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
      if (Array.isArray(data.changes) && data.changes.length > 0) {
        setRewriteChanges(data.changes)
      }
    } catch {
      setRewriteError('서버 오류가 발생했습니다.')
    } finally {
      setRewritingId(null)
    }
  }

  async function claimCoupon() {
    if (!couponInput.trim()) return
    setCouponClaiming(true)
    setCouponMsg(null)
    try {
      const res = await fetch('/api/coupons/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMyCoupons((prev) => [...prev, { id: data.id ?? '', code: data.code, feature: data.feature }])
        setCouponMsg({ text: `쿠폰 등록 완료! (${FEATURE_LABEL[data.feature] ?? data.feature})`, ok: true })
        setCouponInput('')
      } else {
        setCouponMsg({ text: data.error ?? '오류가 발생했습니다.', ok: false })
      }
    } finally {
      setCouponClaiming(false)
    }
  }

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

  function openPreserveModal(): Promise<'replace' | 'add' | 'skip' | 'cancel'> {
    return new Promise(resolve => {
      preserveResolveRef.current = resolve
      setPreserveModal(true)
    })
  }

  function resolvePreserve(choice: 'replace' | 'add' | 'skip' | 'cancel') {
    setPreserveModal(false)
    preserveResolveRef.current?.(choice)
    preserveResolveRef.current = null
  }

  async function onAnalyze() {
    if (!file) return
    setError(null)
    setResult(null)

    // PRO/Expert 유저이고 이미 보존된 이력서가 있으면 방법 선택 모달
    let preserveMode = 'auto'
    if ((isPro || isExpert) && analysisList) {
      const preservedCount = analysisList.filter(item => item.result?._file_path).length
      if (preservedCount > 0) {
        const choice = await openPreserveModal()
        if (choice === 'cancel') return
        preserveMode = choice
      }
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('resume', file)
      fd.append('preserveMode', preserveMode)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '알 수 없는 오류가 발생했습니다.')
      } else {
        setResult(data)
        setAnalysisId(data._id ?? null)
        setFile(null)
        setAgreed(false)
        // 쿠폰 사용 후 목록 갱신
        fetch('/api/coupons/mine').then(r => r.json()).then(({ coupons }) => { if (coupons) setMyCoupons(coupons) }).catch(() => {})
        // 분석 목록 갱신 (saved 탭)
        // 항상 DB에서 재로드 (replace 시 기존 _file_path 제거 반영)
        fetch('/api/analyze/list').then(r => r.json()).then(({ analyses }) => setAnalysisList(analyses ?? [])).catch(() => {})
        if (data.plan === 'PRO' || data.plan === 'EXPERT') {
          const newSaved: SavedAnalysis = {
            result: data,
            created_at: new Date().toISOString(),
            expires_at: '',
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

  function onMenuClick(id: SidebarMenu) {
    if (id === 'saved') {
      setResult(null)
      setActiveMenu('saved')
      if (!analysisList) {
        setSavedListLoading(true)
        fetch('/api/analyze/list')
          .then((r) => r.json())
          .then(({ analyses }) => setAnalysisList(analyses ?? []))
          .catch(() => setAnalysisList([]))
          .finally(() => setSavedListLoading(false))
      }
    } else if (id === 'upload') {
      setResult(null)
      setActiveMenu('upload')
      setFile(null)
      setError(null)
      setAgreed(false)
    } else if (id === 'jd') {
      setResult(null)
      setActiveMenu('jd')
      if (!analysisList) {
        setAnalysisListLoading(true)
        fetch('/api/analyze/list')
          .then((r) => r.json())
          .then(({ analyses }) => setAnalysisList(analyses ?? []))
          .catch(() => setAnalysisList([]))
          .finally(() => setAnalysisListLoading(false))
      }
      if (!jdSavedList) {
        setJdSavedListLoading(true)
        fetch('/api/analyze/jd/list')
          .then((r) => r.json())
          .then(({ analyses }) => setJdSavedList(analyses ?? []))
          .catch(() => setJdSavedList([]))
          .finally(() => setJdSavedListLoading(false))
      }
    } else if (id === 'rewrite') {
      setResult(null)
      setActiveMenu('rewrite')
      setRewriteError(null)
      if (!analysisList) {
        setSavedListLoading(true)
        fetch('/api/analyze/list')
          .then((r) => r.json())
          .then(({ analyses }) => setAnalysisList(analyses ?? []))
          .catch(() => setAnalysisList([]))
          .finally(() => setSavedListLoading(false))
      }
    } else if (id === 'interview') {
      setResult(null)
      setActiveMenu('interview')
      setInterviewError(null)
      setShowNewInterview(false)
      setInterviewViewingSaved(null)
      setInterviewResult(null)
      setInterviewSelectedAnalysis(null)
      if (!analysisList) {
        setSavedListLoading(true)
        fetch('/api/analyze/list')
          .then((r) => r.json())
          .then(({ analyses }) => setAnalysisList(analyses ?? []))
          .catch(() => setAnalysisList([]))
          .finally(() => setSavedListLoading(false))
      }
      if (!jdSavedList) {
        setJdSavedListLoading(true)
        fetch('/api/analyze/jd/list')
          .then((r) => r.json())
          .then(({ analyses }) => setJdSavedList(analyses ?? []))
          .catch(() => setJdSavedList([]))
          .finally(() => setJdSavedListLoading(false))
      }
      setInterviewSavedListLoading(true)
      fetch('/api/analyze/interview/list')
        .then((r) => r.json())
        .then(({ guides }) => setInterviewSavedList(guides ?? []))
        .catch(() => setInterviewSavedList([]))
        .finally(() => setInterviewSavedListLoading(false))
    }
  }

  async function onJDAnalyze() {
    if (!jdCompany.trim() || !jdContent.trim()) return
    setJdLoading(true)
    setJdError(null)
    setJdResult(null)
    try {
      const res = await fetch('/api/analyze/jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: jdCompany, position: jdPosition, jd: jdContent, analysisResult: jdSelectedAnalysis?.result }),
      })
      const data = await res.json()
      if (!res.ok) {
        setJdError(data.error || '알 수 없는 오류가 발생했습니다.')
      } else {
        setJdResult(data)
        setTimeout(() => jdTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        // 저장 목록 갱신
        fetch('/api/analyze/jd/list')
          .then((r) => r.json())
          .then(({ analyses }) => setJdSavedList(analyses ?? []))
          .catch(() => {})
      }
    } catch {
      setJdError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setJdLoading(false)
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
                  <span>📄</span> 이력서 분석
                </button>
                <button
                  className={`analyze-tab-btn${activeMenu === 'saved' ? ' active' : ''}`}
                  onClick={() => onMenuClick('saved')}
                >
                  <span>📂</span> 분석 Report
                  {analysisList && analysisList.length > 0 && <span className="tab-badge">{analysisList.length}개</span>}
                </button>
                <button
                  className={`analyze-tab-btn${activeMenu === 'jd' ? ' active' : ''}`}
                  onClick={() => onMenuClick('jd')}
                >
                  <span>📋</span> JD기반 분석
                </button>
                {isExpert ? (
                  <button
                    className={`analyze-tab-btn${activeMenu === 'rewrite' ? ' active' : ''}`}
                    onClick={() => onMenuClick('rewrite')}
                  >
                    <span>✏️</span> 이력서 생성 <span className="tab-expert-badge">EXPERT</span>
                  </button>
                ) : (
                  <button className="analyze-tab-btn disabled" disabled>
                    <span>✏️</span> 이력서 생성 <span className="tab-soon">준비중</span>
                  </button>
                )}
                {isExpert ? (
                  <button
                    className={`analyze-tab-btn${activeMenu === 'interview' ? ' active' : ''}`}
                    onClick={() => onMenuClick('interview')}
                  >
                    <span>🎤</span> 면접 가이드 <span className="tab-expert-badge">EXPERT</span>
                  </button>
                ) : (
                  <button className="analyze-tab-btn disabled" disabled>
                    <span>🎤</span> 면접 가이드 <span className="tab-soon">준비중</span>
                  </button>
                )}
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
                  <h1 className="analyze-title">
                    {activeMenu === 'jd' ? 'JD 적합도 분석' : activeMenu === 'saved' ? '분석 Report' : activeMenu === 'rewrite' ? '이력서 생성' : activeMenu === 'interview' ? '면접 가이드' : '이력서 분석'}
                  </h1>
                  {activeMenu === 'upload' && (
                    <p className="analyze-sub">PDF 또는 DOCX 파일을 업로드하면 AI가 3분 안에 커리어 방향을 제시합니다.</p>
                  )}
                </>
              )}
            </div>

            {/* 분석 다시보기 모드 */}
            {activeMenu === 'saved' && (
              <div className="jd-section">
                {savedSelectedItem ? (
                  <>
                    <button className="jd-back-btn" onClick={() => setSavedSelectedItem(null)}>
                      ← 목록으로
                    </button>
                    <div className="analyze-saved-notice">
                      <span>📂 저장된 분석 결과</span>
                      <span className="analyze-saved-date">
                        분석일: {new Date(savedSelectedItem.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <AnalysisResults result={savedSelectedItem.result} analysisId={savedSelectedItem.id} isPro={isPro} />
                  </>
                ) : (
                  <>
                    <div className="jd-list-title">분석 결과를 선택하세요</div>
                    {savedListLoading ? (
                      <div className="jd-list-loading">불러오는 중...</div>
                    ) : !analysisList || analysisList.length === 0 ? (
                      <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
                    ) : (
                      <div className="jd-saved-list">
                        {analysisList.map((item) => (
                          <div key={item.id} className="jd-saved-card" onClick={() => setSavedSelectedItem(item)}>
                            <div className="jd-saved-card-left">
                              <span className="jd-saved-company">{item.result.job_title ?? '이력서 분석'}</span>
                              <span className="jd-saved-resume">{item.result.summary?.slice(0, 60)}…</span>
                            </div>
                            <div className="jd-saved-card-right">
                              <span className="jd-saved-score" style={{ color: 'var(--accent)' }}>
                                {item.result.scores?.job_fit ?? '—'}%
                              </span>
                              <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <button
                              className="saved-delete-btn"
                              onClick={(e) => handleDeleteAnalysis(item.id, e)}
                              disabled={deletingAnalysisId === item.id}
                              title="삭제"
                            >
                              {deletingAnalysisId === item.id ? '…' : '×'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Re-Writing 모드 */}
            {activeMenu === 'rewrite' && (() => {
              const preservedCount = (analysisList ?? []).filter(item => item.result?._file_path).length
              const rewriteCouponCount = myCoupons.filter(c => c.feature === 'rewrite').length
              return (
              <div className="jd-section">
                <div className="rewrite-status-bar">
                  <div className="rewrite-status-item">
                    <span className="rewrite-status-label">보존된 이력서</span>
                    <span className="rewrite-status-value">{analysisList ? `${preservedCount}개` : '—'}</span>
                  </div>
                  <div className="rewrite-status-divider" />
                  <div className="rewrite-status-item">
                    <span className="rewrite-status-label">무료 보존</span>
                    <span className={`rewrite-status-value${preservedCount === 0 ? ' available' : ' used'}`}>
                      {preservedCount === 0 ? '1회 사용 가능' : '사용 완료'}
                    </span>
                  </div>
                  <div className="rewrite-status-divider" />
                  <div className="rewrite-status-item">
                    <span className="rewrite-status-label">보존 쿠폰</span>
                    <span className={`rewrite-status-value${rewriteCouponCount > 0 ? ' available' : ''}`}>
                      {rewriteCouponCount > 0 ? `${rewriteCouponCount}장` : '없음'}
                    </span>
                  </div>
                </div>

                <div className="jd-list-title">생성할 이력서를 선택하세요</div>
                <p className="rewrite-desc">
                  <strong>기존 이력서</strong>: 원본 포맷·서식을 그대로 유지하며 JD 기반으로 내용을 보완합니다.<br />
                  <strong>업데이트 이력서</strong>: 원하는 DOCX 양식을 업로드하면 원본 내용을 해당 양식에 맞게 채워 생성합니다.<br />
                  JD 적합도 분석을 선택하여 해당 채용사에 맞게 전략적으로 반영됩니다. 완료 시 <strong>.docx</strong> 파일로 다운로드됩니다.
                </p>
                {rewriteError && <div className="analyze-error">{rewriteError}</div>}
                {rewriteChanges.length > 0 && (
                  <div className="rewrite-changes-box">
                    <div className="rewrite-changes-title">✏️ 주요 변경사항</div>
                    <ul className="rewrite-changes-list">
                      {rewriteChanges.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {savedListLoading ? (
                  <div className="jd-list-loading">불러오는 중...</div>
                ) : !analysisList || analysisList.length === 0 ? (
                  <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
                ) : (
                  <div className="jd-saved-list">
                    {analysisList.map((item) => (
                      <div key={item.id} className="jd-saved-card rewrite-card">
                        <div className="jd-saved-card-left">
                          <span className="jd-saved-company">
                            {item.result.job_title ?? '이력서 분석'}
                            {item.result._file_path
                              ? <span className="preserve-badge saved">보존됨</span>
                              : <span className="preserve-badge unsaved">미보존</span>
                            }
                          </span>
                          <span className="jd-saved-resume">{item.result.summary?.slice(0, 60)}…</span>
                        </div>
                        <div className="jd-saved-card-right">
                          <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {(() => {
                          const now2 = new Date()
                          const hasValidJd = (jdSavedList ?? []).some(jd => !jd.expires_at || new Date(jd.expires_at) > now2)
                          const noFile = !item.result._file_path
                          const disabledTitle = noFile
                            ? '원본 파일이 보존되지 않은 이력서입니다'
                            : !hasValidJd
                            ? 'JD 적합도 분석을 먼저 진행해 주세요'
                            : undefined
                          return (
                            <button
                              className="rewrite-dl-btn"
                              onClick={() => handleRewrite(item.id)}
                              disabled={rewritingId === item.id || noFile || !hasValidJd}
                              title={disabledTitle}
                            >
                              {rewritingId === item.id ? '생성 중...' : '✏️ 생성 이력서 다운로드'}
                            </button>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            })()}

            {/* 면접 가이드 모드 */}
            {activeMenu === 'interview' && (() => {
              const guide = interviewResult ?? (interviewViewingSaved?.result ?? null)
              const expiresAt = guide?.expires_at ?? interviewViewingSaved?.expires_at ?? null
              const daysLeft = expiresAt
                ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
                : null

              const dlButton = (g: InterviewGuideResult) => (
                <button
                  className="rewrite-dl-btn"
                  onClick={() => {
                    const html = generateInterviewHTML(g)
                    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    const name = g.candidate_name ?? '후보자'
                    const company = g.company ? `_${g.company}` : ''
                    const date = new Date().toISOString().slice(0, 10)
                    a.href = url
                    a.download = `jobizic_interview_${name}${company}_${date}.html`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  ⬇ HTML 다운로드
                </button>
              )

              const renderGuide = (g: InterviewGuideResult) => (
                <div className="interview-guide-wrap">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="jd-back-btn" onClick={() => { setInterviewResult(null); setInterviewViewingSaved(null); setInterviewSelectedAnalysis(null); setShowNewInterview(false) }}>
                      ← 목록으로
                    </button>
                    {dlButton(g)}
                  </div>

                  {daysLeft !== null && (
                    <div className="interview-expire-notice">
                      🕐 이 가이드는 <strong>{daysLeft}일 후</strong> 자동 삭제됩니다. HTML로 다운로드하여 보관하세요.
                    </div>
                  )}

                  {(g.company || g.candidate_name) && (
                    <div className="interview-guide-header">
                      {g.candidate_name && <span className="interview-candidate">{g.candidate_name}</span>}
                      {g.company && <span className="interview-company">@ {g.company}{g.position ? ` — ${g.position}` : ''}</span>}
                    </div>
                  )}

                  <div className="interview-section">
                    <div className="interview-section-title">SECTION 1 — 핵심 포지셔닝 메시지</div>
                    <div className="interview-positioning">&ldquo;{g.positioning_message}&rdquo;</div>
                  </div>
                  <div className="interview-section">
                    <div className="interview-section-title">SECTION 2 — 자기소개 설계</div>
                    <div className="interview-text">{(g.self_intro ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                  </div>
                  <div className="interview-section">
                    <div className="interview-section-title">SECTION 3 — 예상 질문 & 답변 가이드</div>
                    <div className="interview-qa-block">
                      <div className="interview-qa-label">A. 이직 사유</div>
                      <div className="interview-text">{(g.qa_resign_reason ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                    </div>
                    {g.qa_domain_gap && g.qa_domain_gap !== '해당없음' && (
                      <div className="interview-qa-block">
                        <div className="interview-qa-label">B. 도메인 갭 대응</div>
                        <div className="interview-text">{(g.qa_domain_gap ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                      </div>
                    )}
                    <div className="interview-qa-block">
                      <div className="interview-qa-label">C. 역량 검증 (STAR)</div>
                      <div className="interview-text">{(g.qa_competency ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                    </div>
                    <div className="interview-qa-block">
                      <div className="interview-qa-label">D. 입사 후 계획</div>
                      <div className="interview-text">{(g.qa_post_join ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                    </div>
                    <div className="interview-qa-block">
                      <div className="interview-qa-label">E. 희망 연봉</div>
                      <div className="interview-text">{(g.qa_salary ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                    </div>
                  </div>
                  <div className="interview-section">
                    <div className="interview-section-title">SECTION 4 — 강점 & 리스크</div>
                    <div className="interview-strength-list">
                      {toArr(g.strengths).map((s, i) => <div key={i} className="interview-strength-item">✅ {s}</div>)}
                    </div>
                    {(g.risks ?? []).length > 0 && (
                      <div className="interview-risk-list">
                        {(g.risks ?? []).map((r, i) => (
                          <div key={i} className="interview-risk-item">
                            <div className="interview-risk-label">⚠️ {r.risk}</div>
                            <div className="interview-risk-response">→ {r.response}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="interview-section">
                    <div className="interview-section-title">SECTION 5 — 역질문 추천</div>
                    <ul className="interview-list">
                      {toArr(g.reverse_questions).map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                  <div className="interview-section">
                    <div className="interview-section-title">SECTION 6 — 면접 전 체크리스트</div>
                    <ul className="interview-checklist">
                      {toArr(g.checklist).map((c, i) => <li key={i}><span className="check-icon">☑</span>{c}</li>)}
                    </ul>
                  </div>
                </div>
              )

              return (
                <div className="jd-section">
                  {guide ? renderGuide(guide)
                  : showNewInterview ? (
                    interviewSelectedAnalysis ? (
                      <div className="interview-form-wrap">
                        <button className="jd-back-btn" onClick={() => setInterviewSelectedAnalysis(null)}>
                          ← 이력서 다시 선택
                        </button>
                        <div className="jd-selected-summary">
                          <div className="jd-selected-label">선택된 이력서</div>
                          <div className="jd-selected-title">
                            {interviewSelectedAnalysis.result.job_title ?? '이력서 분석'}
                            <span className="jd-selected-date">{new Date(interviewSelectedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <p className="jd-selected-summary-text">{interviewSelectedAnalysis.result.summary?.slice(0, 100)}…</p>
                        </div>
                        <div className="jd-form">
                          <div className="jd-field">
                            <label className="jd-label">JD 기반 분석 연결 <span className="jd-label-optional">(선택)</span></label>
                            <select className="jd-input" value={interviewJdId ?? ''} onChange={(e) => setInterviewJdId(e.target.value || null)}>
                              <option value="">선택 안 함 (일반 관점으로 생성)</option>
                              {(jdSavedList ?? []).map((jd) => (
                                <option key={jd.id} value={jd.id}>
                                  {jd.result.company}{jd.result.position ? ` — ${jd.result.position}` : ''} ({new Date(jd.created_at).toLocaleDateString('ko-KR')})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="jd-field">
                            <label className="jd-label">면접 형식 <span className="jd-label-optional">(선택)</span></label>
                            <input className="jd-input" type="text" placeholder="예) 1차 실무 → 2차 임원, PT 발표 포함" value={interviewFormat} onChange={(e) => setInterviewFormat(e.target.value)} />
                          </div>
                          <div className="jd-field">
                            <label className="jd-label">면접관 정보 <span className="jd-label-optional">(선택)</span></label>
                            <input className="jd-input" type="text" placeholder="예) 인사팀 + 현업 팀장, C-level" value={interviewerInfo} onChange={(e) => setInterviewerInfo(e.target.value)} />
                          </div>
                          <div className="jd-field">
                            <label className="jd-label">특이사항 <span className="jd-label-optional">(선택)</span></label>
                            <input className="jd-input" type="text" placeholder="예) 단기 재직 이력, 도메인 갭, 연봉 Gap" value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} />
                          </div>
                        </div>
                        {interviewError && <div className="analyze-error">{interviewError}</div>}
                        <button
                          className="jd-analyze-btn"
                          disabled={interviewLoading}
                          onClick={async () => {
                            setInterviewLoading(true)
                            setInterviewError(null)
                            try {
                              const res = await fetch('/api/analyze/interview', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  analysisId: interviewSelectedAnalysis.id,
                                  jdAnalysisId: interviewJdId,
                                  interviewFormat,
                                  interviewerInfo,
                                  specialNotes: interviewNotes,
                                }),
                              })
                              const data = await res.json()
                              if (!res.ok) { setInterviewError(data.error ?? '오류가 발생했습니다.'); return }
                              setInterviewResult(data)
                              setInterviewSavedList(null) // 목록 갱신 트리거
                            } catch {
                              setInterviewError('네트워크 오류가 발생했습니다.')
                            } finally {
                              setInterviewLoading(false)
                            }
                          }}
                        >
                          {interviewLoading ? '생성 중...' : '🎤 면접 가이드 생성'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button className="jd-back-btn" onClick={() => setShowNewInterview(false)}>← 저장된 가이드로</button>
                        <div className="jd-list-title">면접 가이드를 생성할 이력서를 선택하세요</div>
                        {savedListLoading ? (
                          <div className="jd-list-loading">불러오는 중...</div>
                        ) : !analysisList || analysisList.length === 0 ? (
                          <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
                        ) : (
                          <div className="jd-saved-list">
                            {analysisList.map((item) => (
                              <div key={item.id} className="jd-saved-card"
                                onClick={() => { setInterviewSelectedAnalysis(item); setInterviewJdId(null); setInterviewFormat(''); setInterviewerInfo(''); setInterviewNotes('') }}
                              >
                                <div className="jd-saved-card-left">
                                  <span className="jd-saved-company">{item.result.job_title ?? '이력서 분석'}</span>
                                  <span className="jd-saved-resume">{item.result.summary?.slice(0, 60)}…</span>
                                </div>
                                <div className="jd-saved-card-right">
                                  <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    <>
                      <div className="interview-storage-notice">
                        <span>🕐</span>
                        <span>면접 가이드는 생성 후 <strong>10일간 저장</strong>됩니다. 기간 내 HTML로 다운로드해 보관하세요.</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="jd-list-title">저장된 면접 가이드</div>
                        <button className="rewrite-dl-btn" onClick={() => { setShowNewInterview(true); setInterviewSelectedAnalysis(null) }}>
                          + 새 가이드 생성
                        </button>
                      </div>
                      {interviewSavedListLoading ? (
                        <div className="jd-list-loading">불러오는 중...</div>
                      ) : !interviewSavedList || interviewSavedList.length === 0 ? (
                        <div className="jd-no-analysis">저장된 가이드가 없습니다. 새 가이드를 생성해 보세요.</div>
                      ) : (
                        <div className="jd-saved-list">
                          {interviewSavedList.map((saved) => {
                            const days = Math.ceil((new Date(saved.expires_at).getTime() - Date.now()) / 86400000)
                            return (
                              <div key={saved.id} className="jd-saved-card" onClick={() => setInterviewViewingSaved(saved)}>
                                <div className="jd-saved-card-left">
                                  <span className="jd-saved-company">
                                    {saved.result.candidate_name ?? '후보자'}
                                    {saved.result.company && <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>@ {saved.result.company}{saved.result.position ? ` — ${saved.result.position}` : ''}</span>}
                                  </span>
                                  <span className="jd-saved-resume interview-expire-tag">{days > 0 ? `${days}일 후 삭제` : '오늘 삭제 예정'}</span>
                                </div>
                                <div className="jd-saved-card-right">
                                  <span className="jd-saved-date">{new Date(saved.created_at).toLocaleDateString('ko-KR')}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()}

            {/* JD 기반 분석 모드 */}
            {activeMenu === 'jd' && (
              <div className="jd-section" ref={jdTopRef}>
                {jdViewingSaved ? (
                  <JDResults
                    result={jdViewingSaved.result}
                    expiresAt={jdViewingSaved.expires_at ?? undefined}
                    onReset={() => setJdViewingSaved(null)}
                  />
                ) : jdResult ? (
                  <JDResults
                    result={jdResult}
                    analysisItem={jdSelectedAnalysis ?? undefined}
                    expiresAt={jdResult.expires_at}
                    onReset={() => { setJdResult(null); setJdSelectedAnalysis(null) }}
                  />
                ) : jdSelectedAnalysis ? (
                  <>
                    <button className="jd-back-btn" onClick={() => setJdSelectedAnalysis(null)}>
                      ← 이력서 다시 선택
                    </button>
                    <div className="jd-selected-summary">
                      <div className="jd-selected-label">선택된 이력서</div>
                      <div className="jd-selected-title">
                        {jdSelectedAnalysis.result.job_title ?? '이력서 분석'}
                        <span className="jd-selected-date">{new Date(jdSelectedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <p className="jd-selected-summary-text">{jdSelectedAnalysis.result.summary?.slice(0, 100)}…</p>
                    </div>
                    <div className="jd-form">
                      <div className="jd-field">
                        <label className="jd-label">회사명</label>
                        <input
                          className="jd-input"
                          type="text"
                          placeholder="예) 카카오, 현대자동차, 쿠팡..."
                          value={jdCompany}
                          onChange={(e) => setJdCompany(e.target.value)}
                        />
                      </div>
                      <div className="jd-field">
                        <label className="jd-label">포지션 <span className="jd-label-optional">(선택)</span></label>
                        <input
                          className="jd-input"
                          type="text"
                          placeholder="예) 백엔드 개발 리드, 마케팅 매니저..."
                          value={jdPosition}
                          onChange={(e) => setJdPosition(e.target.value)}
                        />
                      </div>
                      <div className="jd-field">
                        <label className="jd-label">채용공고</label>
                        <textarea
                          className="jd-textarea"
                          placeholder={`[담당업무]\n예) 백엔드 서버 개발 및 운영, 대용량 데이터 처리 시스템 설계\n\n[자격요건]\n예) Java/Spring 3년 이상 경력, MSA 환경 경험자\n\n[우대사항]\n예) Kafka, Redis 운영 경험자 우대`}
                          value={jdContent}
                          onChange={(e) => setJdContent(e.target.value)}
                          rows={12}
                        />
                      </div>
                      {jdError && <div className="analyze-error">{jdError}</div>}
                      <button
                        className="btn-hero analyze-btn"
                        onClick={onJDAnalyze}
                        disabled={!jdCompany.trim() || !jdContent.trim() || jdLoading}
                      >
                        {jdLoading ? 'AI 분석 중...' : '적합도 분석하기 →'}
                      </button>
                      {jdLoading && (
                        <div className="analyze-loading">
                          <div className="loading-bar"><div className="loading-fill" /></div>
                          <div className="loading-text">헤드헌터 AI가 JD 적합도를 분석하고 있습니다...</div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* 저장된 JD 분석 목록 */}
                    {(jdSavedList && jdSavedList.length > 0) && (
                      <div className="jd-saved-section">
                        <div className="jd-list-title">이전 JD 분석 결과</div>
                        <div className="jd-saved-list">
                          {jdSavedList.map((item) => {
                            const rec = item.result.recommendation
                            const color = REC_COLOR_HEX[rec] ?? '#888'
                            return (
                              <div
                                key={item.id}
                                className="jd-saved-card"
                                onClick={() => {
                                  setJdViewingSaved(item)
                                  setTimeout(() => jdTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                                }}
                              >
                                <div className="jd-saved-card-left">
                                  <span className="jd-saved-company">{item.result.company}</span>
                                  <span className="jd-saved-resume">{item.result.position ?? item.result.resume_job_title ?? '이력서 분석'}</span>
                                </div>
                                <div className="jd-saved-card-right">
                                  <span className="jd-saved-score" style={{ color }}>{item.result.fit_score}%</span>
                                  <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                                </div>
                                <button
                                  className="saved-delete-btn"
                                  onClick={(e) => handleDeleteJDAnalysis(item.id, e)}
                                  disabled={deletingJdId === item.id}
                                  title="삭제"
                                >
                                  {deletingJdId === item.id ? '…' : '×'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        <div className="jd-saved-divider">새 JD 분석</div>
                      </div>
                    )}
                    {jdSavedListLoading && <div className="jd-list-loading">불러오는 중...</div>}

                    <div className="jd-list-title">분석할 이력서를 선택하세요</div>
                    {analysisListLoading ? (
                      <div className="jd-list-loading">이력서 분석 목록을 불러오는 중...</div>
                    ) : !analysisList || analysisList.length === 0 ? (
                      <div className="jd-no-analysis">
                        저장된 이력서 분석이 없습니다. 먼저 이력서를 분석해 주세요.
                      </div>
                    ) : (
                      <div className="jd-analysis-list">
                        {analysisList.map((item) => (
                          <button
                            key={item.id}
                            className="jd-analysis-card"
                            onClick={() => setJdSelectedAnalysis(item)}
                          >
                            <div className="jd-card-top">
                              <span className="jd-card-title">
                                {item.result.job_title ?? '이력서 분석'}
                              </span>
                              <span className="jd-card-date">
                                {new Date(item.created_at).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                            <div className="jd-card-scores">
                              {[
                                { label: '직무적합', value: item.result.scores?.job_fit },
                                { label: '경쟁력', value: item.result.scores?.market_competitiveness },
                                { label: '성장성', value: item.result.scores?.growth_potential },
                              ].map((s) => (
                                <div key={s.label} className="jd-card-score-item">
                                  <span className="jd-card-score-label">{s.label}</span>
                                  <div className="jd-card-score-bar-wrap">
                                    <div className="jd-card-score-bar" style={{ width: `${s.value ?? 0}%` }} />
                                  </div>
                                  <span className="jd-card-score-val">{s.value ?? '—'}%</span>
                                </div>
                              ))}
                            </div>
                            <p className="jd-card-summary">
                              {item.result.summary?.slice(0, 120)}…
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 업로드 모드 */}
            {activeMenu === 'upload' && !result && (
              <>
                {/* 쿠폰 영역 */}
                <div className="coupon-section">
                  {myCoupons.filter(c => c.feature === 'resume').length > 0 ? (
                    <div className="coupon-active-badge">
                      🎟 이력서 분석 쿠폰 {myCoupons.filter(c => c.feature === 'resume').length}개 보유 — 이번 분석이 무료로 진행됩니다
                    </div>
                  ) : (
                    <div className="coupon-input-row">
                      <input
                        className="coupon-input"
                        placeholder="쿠폰 코드 입력 (예: NH-RS-XXXXXX)"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponMsg(null) }}
                        onKeyDown={e => e.key === 'Enter' && claimCoupon()}
                      />
                      <button className="coupon-claim-btn" onClick={claimCoupon} disabled={!couponInput.trim() || couponClaiming}>
                        {couponClaiming ? '등록 중...' : '등록'}
                      </button>
                    </div>
                  )}
                  {couponMsg && (
                    <div className={`coupon-msg${couponMsg.ok ? ' ok' : ' err'}`}>{couponMsg.text}</div>
                  )}
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
                      <div className="upload-hint upload-hint--warn">Windows 시스템에 따라 DOCX 파일 선택 시 Word 오류 팝업이 뜰 수 있습니다. × 로 닫으면 정상 업로드됩니다.</div>
                    </>
                  )}
                </div>

                {isExpert && (
                  <div className="preserve-info-box">
                    <div className="preserve-info-title">✏️ 이력서 보존 (Re-Writing)</div>
                    <div className="preserve-info-body">
                      업로드한 이력서는 자동으로 보존되어 <strong>Re-Writing</strong> 탭에서 AI가 재작성한 이력서를 DOCX로 다운로드할 수 있습니다.
                    </div>
                    <div className="preserve-info-rule">
                      <span className="preserve-info-free">✓ 첫 번째 이력서 무료 보존</span>
                      <span className="preserve-info-paid">추가 보존은 이력서 보존 쿠폰 1장 필요</span>
                    </div>
                  </div>
                )}

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

            {/* 결과 모드 (새 분석 — upload 탭) */}
            {result && activeMenu === 'upload' && (
              <>
                {!isPro && savedAnalysis && (
                  <div className="free-saved-notice">
                    <span>📂 이전 분석 결과</span>
                    <span className="free-saved-date">분석일: {new Date(savedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                    <button className="free-reanalyze-btn" onClick={() => { setResult(null); setSavedAnalysis(null) }}>
                      새로 분석하기
                    </button>
                  </div>
                )}

                <AnalysisResults result={result} analysisId={analysisId} isPro={isPro} />

                {(result.plan === 'PRO' || result.plan === 'EXPERT') && (
                  <div className="analyze-storage-notice">
                    <span className="storage-icon">🔒</span>
                    <span>분석 결과가 저장되었습니다. <strong>분석 다시 보기</strong> 탭에서 언제든지 확인할 수 있습니다.</span>
                  </div>
                )}

 

                {isExpert && result._rewrite_saved === false && (
                  <div className="analyze-storage-notice rewrite-not-saved-notice">
                    <span className="storage-icon">✏️</span>
                    <span>
                      이 이력서는 보존되지 않아 Re-Writing을 사용할 수 없습니다.
                      <strong> 이력서 보존 쿠폰</strong>을 위 쿠폰 입력창에 등록하면 다음 분석부터 보존됩니다.
                    </span>
                  </div>
                )}               {!isPro && !savedAnalysis && (
                  <div className="analyze-storage-notice">
                    <span className="storage-icon">💡</span>
                    <span>PRO 플랜으로 업그레이드하면 더 상세한 분석과 다중 저장이 가능합니다.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {/* 분석 삭제 확인 모달 */}
      {/* 이력서 보존 방법 선택 모달 */}
      {preserveModal && (() => {
        const preserved = (analysisList ?? []).filter(item => item.result?._file_path)
        const rewriteCouponCount = myCoupons.filter(c => c.feature === 'rewrite').length
        return (
          <div className="withdraw-overlay" onClick={() => resolvePreserve('cancel')}>
            <div className="preserve-choice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preserve-choice-title">이력서 보존 방법 선택</div>
              <div className="preserve-choice-desc">
                이미 보존된 이력서가 {preserved.length}개 있습니다.
              </div>

              <button className="preserve-option-card" onClick={() => resolvePreserve('replace')}>
                <div className="preserve-option-top">
                  <span className="preserve-option-icon">🔄</span>
                  <span className="preserve-option-label">기존 이력서와 교체</span>
                  <span className="preserve-option-badge free">무료</span>
                </div>
                <div className="preserve-option-desc">기존에 보존된 이력서를 삭제하고 이번 이력서로 교체합니다.</div>
                {preserved[0] && (
                  <div className="preserve-option-existing">
                    현재 보존: {preserved[0].result.job_title ?? '(제목 없음)'} · {new Date(preserved[0].created_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </button>

              <button
                className="preserve-option-card"
                onClick={() => resolvePreserve('add')}
                disabled={rewriteCouponCount === 0}
              >
                <div className="preserve-option-top">
                  <span className="preserve-option-icon">➕</span>
                  <span className="preserve-option-label">추가로 보존</span>
                  <span className={`preserve-option-badge${rewriteCouponCount > 0 ? ' coupon' : ' none'}`}>
                    {rewriteCouponCount > 0 ? `쿠폰 ${rewriteCouponCount}장` : '쿠폰 없음'}
                  </span>
                </div>
                <div className="preserve-option-desc">이력서 보존 쿠폰 1장을 사용하여 추가로 보존합니다.</div>
              </button>

              <button className="preserve-option-card skip" onClick={() => resolvePreserve('skip')}>
                <div className="preserve-option-top">
                  <span className="preserve-option-icon">⏭️</span>
                  <span className="preserve-option-label">보존하지 않음</span>
                </div>
                <div className="preserve-option-desc">이번 이력서는 보존하지 않고 분석만 진행합니다.</div>
              </button>

              <button className="withdraw-modal-cancel" style={{marginTop: '8px', width: '100%'}} onClick={() => resolvePreserve('cancel')}>
                취소 (분석 중단)
              </button>
            </div>
          </div>
        )
      })()}


      {/* JD 선택 모달 */}
      {templateUploadModal && (
        <div className="withdraw-overlay" onClick={() => resolveTemplateUpload('cancel')}>
          <div className="preserve-choice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preserve-choice-title">업데이트 이력서 양식 업로드</div>
            <div className="preserve-choice-desc">
              원하는 이력서 양식의 .docx 파일을 업로드해 주세요.<br />
              원본 이력서 내용이 해당 양식에 맞게 채워집니다.
            </div>

            <div
              className={`upload-zone${modalTemplateFile ? ' has-file' : ''}`}
              style={{margin: '12px 0', cursor: 'pointer'}}
              onClick={() => templateInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f && f.name.endsWith('.docx')) setModalTemplateFile(f)
              }}
            >
              {modalTemplateFile ? (
                <>
                  <div className="upload-icon-success" style={{fontSize: '32px'}}>✅</div>
                  <div className="upload-filename">{modalTemplateFile.name}</div>
                  <div className="upload-hint">다른 파일로 교체하려면 클릭하세요</div>
                </>
              ) : (
                <>
                  <div className="upload-icon-main" style={{fontSize: '32px'}}>📄</div>
                  <div className="upload-main-text">클릭하거나 파일을 드래그하세요</div>
                  <div className="upload-hint">.docx 파일만 업로드 가능합니다</div>
                </>
              )}
              <input
                ref={templateInputRef}
                type="file"
                accept=".docx"
                style={{display: 'none'}}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setModalTemplateFile(f)
                  e.target.value = ''
                }}
              />
            </div>

            <button
              className="rewrite-dl-btn"
              style={{width: '100%', marginTop: '4px'}}
              disabled={!modalTemplateFile}
              onClick={() => modalTemplateFile && resolveTemplateUpload(modalTemplateFile)}
            >
              생성 시작
            </button>
            <button className="withdraw-modal-cancel" style={{marginTop: '8px', width: '100%'}} onClick={() => resolveTemplateUpload('cancel')}>
              취소
            </button>
          </div>
        </div>
      )}

      {formatSelectModal && (
        <div className="withdraw-overlay" onClick={() => resolveFormatSelect('cancel')}>
          <div className="preserve-choice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preserve-choice-title">이력서 양식 선택</div>
            <div className="preserve-choice-desc">
              생성할 이력서의 양식을 선택해 주세요.
            </div>

            <button className="preserve-option-card" onClick={() => resolveFormatSelect('original')}>
              <div className="preserve-option-top">
                <span className="preserve-option-icon">📄</span>
                <span className="preserve-option-label">기존 이력서</span>
                <span className="preserve-option-badge none">원본 포맷 유지</span>
              </div>
              <div className="preserve-option-desc">
                원본 이력서의 포맷·서식을 그대로 유지합니다. DOCX는 서식 완전 보존, PDF는 원본 기반 새 DOCX로 생성됩니다.
              </div>
            </button>

            <button className="preserve-option-card" onClick={() => resolveFormatSelect('updated')}>
              <div className="preserve-option-top">
                <span className="preserve-option-icon">✨</span>
                <span className="preserve-option-label">업데이트 이력서</span>
                <span className="preserve-option-badge coupon">양식 업로드</span>
              </div>
              <div className="preserve-option-desc">
                원하는 DOCX 양식을 업로드하면 원본 이력서 내용을 해당 양식에 맞게 채워 생성합니다.
              </div>
            </button>

            <button className="withdraw-modal-cancel" style={{marginTop: '8px', width: '100%'}} onClick={() => resolveFormatSelect('cancel')}>
              취소
            </button>
          </div>
        </div>
      )}

      {jdSelectModal && (() => {
        const now = new Date()
        const validJds = (jdSavedList ?? []).filter(jd => !jd.expires_at || new Date(jd.expires_at) > now)
        return (
          <div className="withdraw-overlay" onClick={() => resolveJdSelect('cancel')}>
            <div className="preserve-choice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preserve-choice-title">JD 선택</div>
              <div className="preserve-choice-desc">
                생성할 이력서에 반영할 JD 분석 결과를 선택해 주세요.
              </div>

              {validJds.map(jd => (
                <button key={jd.id} className="preserve-option-card" onClick={() => resolveJdSelect(jd.id)}>
                  <div className="preserve-option-top">
                    <span className="preserve-option-icon">🎯</span>
                    <span className="preserve-option-label">{jd.result.company}{jd.result.position ? ` · ${jd.result.position}` : ''}</span>
                    <span className={`preserve-option-badge${jd.result.fit_score >= 70 ? ' coupon' : ' none'}`}>
                      적합도 {jd.result.fit_score}%
                    </span>
                  </div>
                  <div className="preserve-option-desc">
                    {jd.result.verdict?.slice(0, 70)}{jd.result.verdict && jd.result.verdict.length > 70 ? '…' : ''}
                  </div>
                  <div className="preserve-option-existing">
                    분석일: {new Date(jd.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </button>
              ))}

              <button className="withdraw-modal-cancel" style={{marginTop: '8px', width: '100%'}} onClick={() => resolveJdSelect('cancel')}>
                취소
              </button>
            </div>
          </div>
        )
      })()}

      {deleteConfirm && (
        <div className="withdraw-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-modal-icon">🗑️</div>
            <div className="withdraw-modal-title">
              {deleteConfirm.type === 'analysis' ? '이력서 분석 결과를 삭제할까요?' : 'JD 적합도 분석 결과를 삭제할까요?'}
            </div>
            <div className="withdraw-modal-warning">
              🚨 삭제된 데이터는 복구가 불가능합니다.
            </div>
            <div className="withdraw-modal-btns">
              <button className="withdraw-modal-cancel" onClick={() => setDeleteConfirm(null)}>취소</button>
              <button className="withdraw-modal-confirm" onClick={confirmDelete}>삭제하기</button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

function RefinementTextView({ text }: { text: string }) {
  if (!text) return <div className="refinement-text-empty">분석 중...</div>
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: string[] = []

  function flushList() {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={`list-${nodes.length}`} className="refinement-list">
        {listItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushList()
      nodes.push(<div key={i} className="refinement-block-label">{line.slice(3)}</div>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      listItems.push(line.slice(2))
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      nodes.push(<p key={i} className="refinement-para">{line}</p>)
    }
  })
  flushList()

  return <div className="refinement-text-wrap">{nodes}</div>
}

function AnalysisResults({
  result,
  analysisId,
  isPro,
}: {
  result: AnalysisResult
  analysisId?: string | null
  isPro?: boolean
}) {
  const [activeCareerTab, setActiveCareerTab] = useState(
    result.career_paths ? Math.min(1, result.career_paths.length - 1) : 0
  )
  const [refined, setRefined] = useState(!!result.refined)
  const [refinementText, setRefinementText] = useState<string>(result.refinement_text ?? '')
  const [userInput, setUserInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)

  async function handleRefine() {
    if (!analysisId || refined || refining || !userInput.trim()) return
    setRefining(true)
    setRefineError(null)
    try {
      const res = await fetch('/api/analyze/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, userInput }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setRefineError(data.error ?? '오류가 발생했습니다.')
        return
      }
      if (!res.body) {
        setRefineError('응답을 받지 못했습니다.')
        return
      }
      setRefined(true)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setRefinementText(text)
      }
    } catch {
      setRefineError('서버 오류가 발생했습니다.')
    } finally {
      setRefining(false)
    }
  }

  const scores = [
    { label: '직무 적합도', value: result.scores?.job_fit },
    { label: '시장 경쟁력', value: result.scores?.market_competitiveness },
    { label: '성장 가능성', value: result.scores?.growth_potential },
  ]

  const paths = Array.isArray(result.career_paths) ? result.career_paths : undefined
  const active = paths?.[activeCareerTab]

  const globalMax = paths && paths.length > 0
    ? Math.max(...paths.flatMap((p) => (p.salary_bands ?? []).map((b) => b.max || b.min)))
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
            {toArr(result.keywords).map((k, i) => <span key={i} className="keyword-chip">{k}</span>)}
          </div>
        </div>
        <div className="results-section">
          <div className="results-label">✦ 강점</div>
          <ul className="result-list">
            {toArr(result.strengths).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="results-section">
          <div className="results-label">개선 포인트</div>
          <ul className="result-list improvement-list">
            {toArr(result.improvements).map((s, i) => <li key={i}>{s}</li>)}
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
                className={`career-card${i === activeCareerTab ? ' active' : ''} career-card--${p.type.toLowerCase()}`}
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
            {(active.salary_bands ?? []).map((b) => (
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

          {paths.length === 1 && (
            <div className="career-upsell">
              <div className="career-upsell-title">
                지금 보고 계신 건 <strong>현재 경로(BASELINE)</strong> 하나뿐입니다.
              </div>
              <div className="career-upsell-paths">
                <div className="career-upsell-path recommended">
                  <span className="career-upsell-badge">RECOMMENDED</span>
                  <span>강점을 최대로 활용한 헤드헌터 추천 경로 — 지금보다 높은 연봉과 포지션이 현실적으로 가능한 방향</span>
                </div>
                <div className="career-upsell-path stretch">
                  <span className="career-upsell-badge">STRETCH</span>
                  <span>2~3년 준비 시 도달 가능한 고성장 경로 — 시장에서 희소성이 높은 포지션과 연봉 상단</span>
                </div>
              </div>
              <div className="career-upsell-cta">
                PRO 플랜으로 전환하면 두 가지 경로와 구체적인 전략을 모두 확인할 수 있습니다.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="results-section">
          <div className="results-label">💡 추천 커리어 방향</div>
          <ul className="result-list career-list">
            {(result.careers ?? []).map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      {isPro && analysisId && (
        <div className="refine-section">
          {!refined ? (
            <>
              <div className="refine-intro">
                <div className="refine-intro-title">보완 재분석</div>
                <div className="refine-intro-desc">
                  이력서에 빠진 정보를 직접 입력하면 AI가 반영해서 다시 분석합니다.
                  <span className="refine-free-badge">1회 무료 · 기존 횟수 차감 없음</span>
                </div>
              </div>
              <textarea
                className="refine-textarea"
                rows={5}
                placeholder="이력서에 포함되지 않은 추가 정보를 자유롭게 입력하세요.

예) AWS Solutions Architect 자격증 보유 / 스타트업 3년 경험 (팀 리드) / 영어 비즈니스 레벨 / 사이드 프로젝트로 월 1만 DAU 서비스 운영 중"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={refining}
              />
              <button
                className="refine-btn"
                onClick={handleRefine}
                disabled={refining || !userInput.trim()}
              >
                {refining ? '보완 분석 중...' : '보완 재분석 시작하기 →'}
              </button>
              {refining && (
                <div className="analyze-loading">
                  <div className="loading-bar"><div className="loading-fill" /></div>
                  <div className="loading-text">추가 정보를 반영해 재분석하고 있습니다...</div>
                </div>
              )}
              {refineError && <div className="refine-error">{refineError}</div>}
            </>
          ) : (
            <div className="refinement-result">
              <div className="refinement-header">보완 재분석 결과</div>
              <RefinementTextView text={refinementText} />
            </div>
          )}
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

function JDResults({
  result,
  analysisItem,
  expiresAt,
  onReset,
}: {
  result: JDResult
  analysisItem?: AnalysisListItem
  expiresAt?: string
  onReset: () => void
}) {
  const color = REC_COLOR_HEX[result.recommendation] ?? '#888'
  const label = REC_LABEL_CONST[result.recommendation] ?? result.recommendation

  const resumeTitle = analysisItem?.result.job_title ?? result.resume_job_title ?? '이력서 분석'
  const resumeDate = analysisItem
    ? new Date(analysisItem.created_at).toLocaleDateString('ko-KR')
    : result.resume_analyzed_at
    ? new Date(result.resume_analyzed_at).toLocaleDateString('ko-KR')
    : ''

  return (
    <div className="jd-results">
      <div className="jd-results-header">
        <div className="jd-company-name">
          {result.company}
          {result.position && <span className="jd-position-tag">{result.position}</span>}
        </div>
        <div className="jd-score-row">
          <span className="jd-score" style={{ color }}>{result.fit_score}%</span>
          <span className="jd-rec-badge" style={{ borderColor: color, color }}>{label}</span>
        </div>
        <p className="jd-verdict">{result.verdict}</p>
      </div>

      <div className="jd-ref-bar">
        기반 이력서: <strong>{resumeTitle}</strong>
        {resumeDate && <span className="jd-ref-date">{resumeDate}</span>}
      </div>

      <div className="results-section jd-pitch-section">
        <div className="results-label">어필 전략 · 제안 포인트</div>
        <ul className="jd-pitch-list">
          {toArr(result.pitch_points).map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <div className="jd-grid">
        <div className="results-section">
          <div className="results-label">매칭 강점</div>
          <ul className="jd-match-list">
            {toArr(result.matching_points).map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div className="results-section">
          <div className="results-label">부족한 점 · 리스크</div>
          <ul className="jd-gap-list">
            {toArr(result.gaps).map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      </div>

      <div className="jd-disclaimer">
        ※ 본 분석 결과는 입력된 채용공고(JD) 기준으로 AI가 평가한 것이며, 실제 채용 회사의 내부 기준 및 평가에 따라 결과가 다를 수 있습니다.
      </div>

      <div className="analyze-storage-notice">
        <span className="storage-icon">🔒</span>
        <span>이 분석 결과는 영구적으로 저장됩니다.</span>
      </div>

      <div className="jd-result-actions">
        <button className="jd-reset-btn" onClick={onReset}>
          {analysisItem ? '← 다른 JD 분석하기' : '← 목록으로'}
        </button>
        {analysisItem && (
          <button className="analyze-download-btn" onClick={() => downloadJDReport(result, analysisItem)}>
            ↓ HTML 리포트 다운로드
          </button>
        )}
      </div>
    </div>
  )
}
