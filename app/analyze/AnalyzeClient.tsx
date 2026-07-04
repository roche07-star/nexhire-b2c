'use client'

import { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { generateInterviewHTML } from '@/lib/interviewHTMLTemplate'
import { generateProposalHTML } from '@/lib/proposalHTMLTemplate'
import type {
  CareerPath,
  AnalysisResult,
  SavedAnalysis,
  JDResult,
  InterviewGuideResult,
  SavedInterviewGuide,
  AnalysisListItem,
  SavedJDAnalysis,
  RewriteResult,
  JDTemplate,
  SidebarMenu,
} from '@/types/analyze'
import { toArr } from '@/types/analyze'
import {
  FEATURE_LABEL,
  CAREER_COLORS,
  CAREER_COLORS_HEX,
  REC_LABEL_CONST,
  REC_COLOR_HEX,
  LOADING_STEPS,
  JD_LOADING_STEPS,
  REWRITE_LOADING_STEPS,
  INTERVIEW_LOADING_STEPS,
} from '@/constants/analyze'

function generateReportHTML(result: AnalysisResult, date?: string): string{
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
    <div class="report-logo">JOBIZIC, AI 이력서 분석</div>
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
  <div class="footer">Generated by Jobizic &nbsp;/&nbsp; jobizic.io &nbsp;/&nbsp; ${dateStr}</div>
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

  const listHTML = (arr: unknown, bullet = '›', color = '#fbbf24') =>
    toArr(arr).map((s) => `<li><span class="bullet" style="color:${color}">${bullet}</span>${s}</li>`).join('')

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
    <div class="logo">JOBIZIC, JD 적합도 분석</div>
    <div class="company">${jd.company}${jd.position ? ` <span style="font-size:14px;font-weight:500;opacity:0.7">/ ${jd.position}</span>` : ''}</div>
    <div class="score-row">
      <span class="score">${jd.fit_score}%</span>
      <span class="badge">${label}</span>
    </div>
    <p class="verdict">${jd.verdict}</p>
  </div>
  <div class="resume-ref">
    기반 이력서 분석: <strong>${item.result.job_title ?? '이력서 분석'}</strong> &nbsp;/&nbsp; ${analysisDate}
  </div>
  <div class="section" style="margin-bottom:32px">
    <div class="label">💬 어필 전략, 제안 포인트</div>
    <ul>${listHTML(jd.pitch_points, '›', '#fbbf24')}</ul>
  </div>
  <div class="grid">
    <div class="section">
      <div class="label">✅ 매칭 강점</div>
      <ul>${listHTML(jd.matching_points, '✓', '#fbbf24')}</ul>
    </div>
    <div class="section">
      <div class="label">⚠️ 부족한 점</div>
      <ul>${toArr(jd.gaps).map((s) => `<li><span class="bullet" style="color:#ef4444;font-size:15px">⚠</span>${s}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="footer">Generated by Jobizic &nbsp;/&nbsp; jobizic.io &nbsp;/&nbsp; ${dateStr}</div>
</div>
</body>
</html>`
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

export default function AnalyzeClient({ initialIsPro, initialIsExpert, userEmail, userType }: { initialIsPro: boolean; initialIsExpert?: boolean; userEmail: string | null; userType?: string | null }) {
  const {
    state: analysisState,
    startAnalysis,
    completeAnalysis,
    clearAnalysis,
    addToQueue,
    processQueue,
    startJdAnalysis,
    completeJdAnalysis,
    clearJdAnalysis,
    startRewrite,
    completeRewrite,
    clearRewrite
  } = useAnalysis()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAnalysis | null>(null)
  const [isPro] = useState(initialIsPro)
  const [isExpert] = useState(!!initialIsExpert)
  const [activeMenu, setActiveMenu] = useState<SidebarMenu>('upload')
  const searchParams = useSearchParams()
  const [rewritingId, setRewritingId] = useState<string | null>(null)
  const [rewriteLoadingMsg, setRewriteLoadingMsg] = useState<string>('')
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  const [rewriteChanges, setRewriteChanges] = useState<string[]>([])
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [resumeText, setResumeText] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('')
  const [progress, setProgress] = useState(0) // 진행률 (0-100)
  const [estimatedTime, setEstimatedTime] = useState(30) // 예상 시간 (초)
  const loadingStepRef = useRef(0)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const jdTopRef = useRef<HTMLDivElement>(null)
  const [jdCompany, setJdCompany] = useState('')
  const [jdPosition, setJdPosition] = useState('')
  const [jdContent, setJdContent] = useState('')
  const [jdClientComment, setJdClientComment] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null) // 선택한 템플릿 ID
  const [jdResult, setJdResult] = useState<JDResult | null>(null)
  const [jdLoading, setJdLoading] = useState(false)
  const [jdLoadingMsg, setJdLoadingMsg] = useState('')
  const jdLoadingStepRef = useRef(0)
  const jdLoadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
  const [myCoupons, setMyCoupons] = useState<{ id: string; code: string; feature: string; status?: string }[]>([])
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'analysis' | 'jd'; id: string } | null>(null)
  const [preserveChecked, setPreserveChecked] = useState(true)
  const [preserveAddWithCoupon, setPreserveAddWithCoupon] = useState(false)
  const [jdSelectModal, setJdSelectModal] = useState(false)
  const jdSelectResolveRef = useRef<((jdId: string | null | 'cancel') => void) | null>(null)
  const [formatSelectModal, setFormatSelectModal] = useState(false)
  const [isTextPasteRewrite, setIsTextPasteRewrite] = useState(false)
  const [savedJDTemplates, setSavedJDTemplates] = useState<JDTemplate[]>([])
  const [showJDInput, setShowJDInput] = useState(false)
  const [editingCandidateName, setEditingCandidateName] = useState(false)
  const [candidateNameInput, setCandidateNameInput] = useState('')
  const [savingCandidateName, setSavingCandidateName] = useState(false)
  const formatSelectResolveRef = useRef<((choice: 'original' | 'standard' | 'cancel') => void) | null>(null)
  const [templateUploadModal, setTemplateUploadModal] = useState(false)
  const templateUploadResolveRef = useRef<((file: File | 'cancel') => void) | null>(null)
  const [modalTemplateFile, setModalTemplateFile] = useState<File | null>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)
  const [sharingId, setSharingId] = useState<string | null>(null) // 공유 중인 분석 ID
  const [shareUrl, setShareUrl] = useState<string | null>(null) // 생성된 공유 URL
  const [searchQuery, setSearchQuery] = useState('') // 분석 목록 검색어
  const [minScore, setMinScore] = useState(0) // 최소 점수 필터
  const [fileQueue, setFileQueue] = useState<File[]>([]) // 파일 큐

  // ── 채용 프로세스
  const [showHiringModal, setShowHiringModal] = useState(false)
  const [hiringProcessCreating, setHiringProcessCreating] = useState(false)
  const [hiringModalTop, setHiringModalTop] = useState(100)
  const hiringButtonRef = useRef<HTMLButtonElement | null>(null)
  const [hiringJDInfo, setHiringJDInfo] = useState<{candidateName: string; companyName: string; positionTitle: string}>({
    candidateName: '',
    companyName: '',
    positionTitle: ''
  })

  // ── 면접 가이드
  const [interviewSelectedAnalysis, setInterviewSelectedAnalysis] = useState<AnalysisListItem | null>(null)
  const [interviewJdId, setInterviewJdId] = useState<string | null>(null)
  const [interviewFormat, setInterviewFormat] = useState('')
  const [interviewerInfo, setInterviewerInfo] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [interviewResult, setInterviewResult] = useState<InterviewGuideResult | null>(null)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewLoadingMsg, setInterviewLoadingMsg] = useState('')
  const interviewLoadingStepRef = useRef(0)
  const interviewLoadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  // 쿠폰은 필요 시에만 로드 (초기 로딩 최적화 - lazy loading)
  const loadCouponsOnce = useCallback(() => {
    if (myCoupons.length === 0) {
      fetch('/api/coupons/mine')
        .then((r) => r.json())
        .then(({ coupons }) => { if (coupons) setMyCoupons(coupons) })
        .catch(() => {})
    }
  }, [myCoupons.length])

  // 자동 큐 처리: 분석 완료 후 다음 파일 자동 분석
  useEffect(() => {
    // 조건: 분석 중이 아니고, 큐에 파일이 있고, 현재 파일이 없을 때
    if (!loading && fileQueue.length > 0 && !file && !result) {
      const timer = setTimeout(() => {
        const [nextFile, ...remainingQueue] = fileQueue
        setFileQueue(remainingQueue)
        setFile(nextFile)
        setAgreed(true)

        // 다음 분석 자동 시작
        setTimeout(() => {
          if (!loading) { // 다시 한 번 체크
            onAnalyze()
          }
        }, 1000)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [loading, fileQueue, file, result])

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // JD 템플릿은 JD 탭 열 때 로드 (초기 로딩 최적화)
  useEffect(() => {
    if (activeMenu === 'jd' && savedJDTemplates.length === 0) {
      fetch('/api/jd-templates')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSavedJDTemplates(data)
          }
        })
        .catch(() => {})
    }
  }, [activeMenu])

  // 분석 목록은 PRO 플랜만 초기 로드 (초기 로딩 최적화)
  useEffect(() => {
    if (initialIsPro) {
      fetch('/api/analyze/list')
        .then((r) => r.json())
        .then(({ analyses }) => setAnalysisList(analyses ?? []))
        .catch(() => setAnalysisList([]))
    }
  }, [initialIsPro])

  // URL parameter로 JD 탭으로 직접 진입
  useEffect(() => {
    const tab = searchParams.get('tab')
    const id = searchParams.get('id')

    if (tab === 'jd') {
      setActiveMenu('jd')
      // JD ID가 있으면 해당 JD 분석 로드
      if (id) {
        // JD 목록 로드 후 해당 JD 선택
        fetch('/api/analyze/jd/list')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data.analyses)) {
              setJdSavedList(data.analyses)
              const foundJd = data.analyses.find((jd: any) => jd.id === id)
              if (foundJd) {
                setJdViewingSaved(foundJd)
                setJdResult(foundJd.result)
              }
            }
          })
          .catch(() => {})
      }
    }
  }, [searchParams])

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

  async function handleShare(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSharingId(id)
    setShareUrl(null)
    try {
      const res = await fetch(`/api/analyze/${id}/share`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '공유 URL 생성 실패')
        return
      }
      setShareUrl(data.shareUrl)
      // 클립보드에 복사
      await navigator.clipboard.writeText(data.shareUrl)
      alert('🔗 공유 URL이 클립보드에 복사되었습니다!\n\n' + data.shareUrl + '\n\n30일 후 자동 만료됩니다.')
    } catch (err) {
      console.error('[share] Error:', err)
      alert('공유 URL 생성 중 오류가 발생했습니다.')
    } finally {
      setSharingId(null)
    }
  }

  async function saveCandidateName() {
    const name = candidateNameInput.trim()
    if (!name) {
      alert('후보자 이름을 입력해 주세요.')
      return
    }

    // upload 메뉴: analysisId 사용, saved 메뉴: savedSelectedItem.id 사용
    const targetId = analysisId || savedSelectedItem?.id
    if (!targetId) {
      alert('분석 ID를 찾을 수 없습니다.')
      return
    }

    setSavingCandidateName(true)
    try {
      const res = await fetch(`/api/analyze/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_name: name })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '저장 실패')
        return
      }

      // 로컬 state 업데이트
      if (result) {
        setResult({ ...result, candidate_name: name })
      }
      if (savedSelectedItem) {
        setSavedSelectedItem({
          ...savedSelectedItem,
          result: { ...savedSelectedItem.result, candidate_name: name }
        })
      }

      setEditingCandidateName(false)
      alert('✅ 후보자 이름이 저장되었습니다.')
    } catch (err) {
      console.error('[saveCandidateName] Error:', err)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSavingCandidateName(false)
    }
  }

  // 브라우저 알림 표시
  function showNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png', // 알림 아이콘 (없으면 기본)
        badge: '/icon-192.png',
        tag: 'analysis-complete', // 중복 알림 방지
        requireInteraction: false, // 자동으로 사라짐
      })
      notification.onclick = () => {
        window.focus() // 창 포커스
        notification.close()
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

  function openFormatSelectModal(): Promise<'original' | 'standard' | 'cancel'> {
    return new Promise(resolve => {
      formatSelectResolveRef.current = resolve
      setFormatSelectModal(true)
    })
  }

  function resolveFormatSelect(choice: 'original' | 'standard' | 'cancel') {
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

  async function handleRewrite(analysisId: string, filePath?: string | null) {
    setRewriteError(null)
    setIsTextPasteRewrite(filePath?.endsWith('.txt') ?? false)

    // 원본 이력서 summary 가져오기 (비교 표시용)
    const originalAnalysis = analysisList?.find(a => a.id === analysisId)
    const originalSummary = originalAnalysis?.result?.summary ?? null

    // 양식 선택 모달
    const formatChoice = await openFormatSelectModal()
    if (formatChoice === 'cancel') return

    // 기본 이력서는 템플릿 없이 생성
    const templateFile: File | null = null

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

    // 백그라운드 분석 시작
    startRewrite()

    setRewritingId(analysisId)
    setRewriteChanges([])
    setRewriteError(null)

    // 로딩 메시지 단계별 표시
    let rewriteStepIndex = 0
    setRewriteLoadingMsg(REWRITE_LOADING_STEPS[0])
    const rewriteInterval = setInterval(() => {
      rewriteStepIndex = Math.min(rewriteStepIndex + 1, REWRITE_LOADING_STEPS.length - 1)
      setRewriteLoadingMsg(REWRITE_LOADING_STEPS[rewriteStepIndex])
    }, 8000)

    try {
      const fd = new FormData()
      fd.append('analysisId', analysisId)
      if (jdAnalysisId) fd.append('jdAnalysisId', jdAnalysisId)
      fd.append('formatMode', formatChoice)
      if (templateFile) fd.append('templateFile', templateFile)

      // 기존 제안서 확인 및 전달
      if (jdAnalysisId && typeof window !== 'undefined') {
        const proposalKey = `proposal_resume_${analysisId}_jd_${jdAnalysisId}`
        const savedProposal = localStorage.getItem(proposalKey)
        if (savedProposal) {
          try {
            const proposalData = JSON.parse(savedProposal)
            fd.append('proposalData', JSON.stringify(proposalData.proposal))
          } catch (e) {
            console.error('Failed to parse proposal:', e)
          }
        }
      }

      const res = await fetch('/api/analyze/rewrite', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRewriteError(data.error ?? '오류가 발생했습니다.')
        clearRewrite() // 에러 시 백그라운드 분석 취소
        return
      }

      // 결과 저장 (미리보기용)
      const result: RewriteResult = {
        preview: data.preview ?? '미리보기를 사용할 수 없습니다.',
        docx: data.docx ?? '',  // FREE: docx 없음
        filename: data.filename ?? 'rewrite.docx',
        changes: Array.isArray(data.changes) ? data.changes : [],
        plan: data.plan ?? 'FREE',
      }
      setRewriteResult(result)

      // 백그라운드 분석 완료
      completeRewrite('rewrite-temp') // 이력서 생성은 별도 저장 없으므로 임시 ID

      // localStorage에 저장 (재접속 시 표시용) - 사용자별로 구분
      try {
        const storageKey = `jobizic_last_rewrite_${userEmail || 'guest'}`
        localStorage.setItem(storageKey, JSON.stringify({
          preview: result.preview,
          plan: result.plan,
          originalPreview: data.originalPreview ?? originalSummary ?? '',
          changes: result.changes,
          userEmail: userEmail,
          timestamp: Date.now(),
          // PRO/EXPERT: DOCX 데이터도 저장 (다운로드 버튼용)
          docx: result.docx || null,
          filename: result.filename || null,
        }))
      } catch (e) {
        console.error('localStorage 저장 실패:', e)
      }

      if (Array.isArray(data.changes) && data.changes.length > 0) {
        setRewriteChanges(data.changes)
      }

      // 새 창에서 미리보기 열기 (원본과 비교)
      window.open(`/analyze/preview?email=${encodeURIComponent(userEmail || '')}`, '_blank')

      // PRO+ 자동 다운로드
      if (data.plan === 'PRO' || data.plan === 'EXPERT') {
        const bytes = Uint8Array.from(atob(data.docx), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.download = data.filename ?? 'rewrite.docx'
        a.href = url
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      setRewriteError('서버 오류가 발생했습니다.')
      clearRewrite() // 에러 시 백그라운드 분석 취소
    } finally {
      clearInterval(rewriteInterval)
      setRewritingId(null)
      setRewriteLoadingMsg('')
    }
  }

  function downloadRewriteResult() {
    if (!rewriteResult || !rewriteResult.docx) return
    const bytes = Uint8Array.from(atob(rewriteResult.docx), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = rewriteResult.filename
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  function openRewritePreview(preview: string, plan: string, originalSummary?: string, changes?: string[]) {
    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) {
      alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.')
      return
    }

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>생성된 이력서 - Jobizic</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.8;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    .container {
      max-width: ${originalSummary ? '1600px' : '900px'};
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .compare-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 30px;
    }
    .compare-panel {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      background: #fafafa;
    }
    .compare-panel h2 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
      color: #666;
    }
    .compare-panel.original h2 {
      border-bottom-color: #999;
      color: #999;
    }
    .compare-panel.modified h2 {
      border-bottom-color: #e8ff47;
      color: #1a1a1a;
    }
    .changes-box {
      background: #fff9e6;
      border: 1px solid #e8ff47;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .changes-box h3 {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .changes-box ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .changes-box li {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
      line-height: 1.6;
      color: #444;
    }
    .changes-box li:last-child {
      border-bottom: none;
    }
    .changes-box li:before {
      content: '✏️ ';
      margin-right: 8px;
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 2px solid #e8ff47;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .header .badge {
      display: inline-block;
      padding: 6px 16px;
      background: ${plan === 'FREE' ? '#e0e0e0' : '#e8ff47'};
      color: ${plan === 'FREE' ? '#666' : '#000'};
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 12px;
    }
    .content {
      font-size: 15px;
    }
    .content h2, .content h3 {
      margin-top: 32px;
      margin-bottom: 12px;
      color: #1a1a1a;
    }
    .content h2 {
      font-size: 20px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .content h3 {
      font-size: 17px;
    }
    .content p {
      margin-bottom: 12px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 13px;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #e8ff47;
      color: #000;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .print-btn:hover {
      background: #d4e840;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 40px; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ 인쇄하기</button>
  <div class="container">
    <div class="header">
      <h1>✨ 생성된 이력서</h1>
      <div class="badge">${plan === 'FREE' ? 'FREE 플랜 - HTML 미리보기' : 'PRO+ 플랜'}</div>
    </div>
    <div class="content">
      ${changes && changes.length > 0 ? `
        <div class="changes-box">
          <h3>✨ 주요 변경사항</h3>
          <ul>
            ${changes.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${originalSummary ? `
        <div class="compare-wrapper">
          <div class="compare-panel original">
            <h2>📄 이전 이력서 (원본)</h2>
            <div style="white-space: pre-wrap; line-height: 1.8; color: #666;">
              ${originalSummary}
            </div>
          </div>
          <div class="compare-panel modified">
            <h2>✨ 수정된 이력서 (AI 생성)</h2>
            ${preview}
          </div>
        </div>
      ` : preview}
    </div>
    <div class="footer">
      Generated by Jobizic, AI Resume Generator
    </div>
  </div>
</body>
</html>
    `

    win.document.write(html)
    win.document.close()
  }

  function handleFile(f: File) {
    setFile(f)
    setError(null)
  }

  function handleMultipleFiles(files: FileList) {
    const filesArray = Array.from(files)

    if (filesArray.length === 0) return

    // 첫 번째 파일은 바로 설정
    setFile(filesArray[0])
    setError(null)

    // 나머지 파일들은 큐에 추가
    if (filesArray.length > 1) {
      const remainingFiles = filesArray.slice(1)
      setFileQueue(prev => [...prev, ...remainingFiles])

      // AnalysisContext 큐에도 추가
      remainingFiles.forEach(file => {
        addToQueue(file.name)
      })

      // 알림
      alert(`${filesArray[0].name} 외 ${remainingFiles.length}개 파일이 큐에 추가되었습니다.\n순차적으로 자동 분석됩니다.`)
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleMultipleFiles(files)
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      handleMultipleFiles(files)
    }
  }

  async function onAnalyze() {
    if (inputMode === 'file' ? !file : !resumeText.trim()) return
    setError(null)
    setResult(null)

    // 파일 보존 모드 결정 (모든 플랜)
    let preserveMode = 'skip'
    const preservedCount = (analysisList ?? []).filter(item => item.result?._file_path).length

    if (isPro || isExpert) {
      // PRO/EXPERT: 체크박스 값으로 결정
      if (preserveChecked) {
        if (preserveAddWithCoupon && preservedCount > 0) {
          preserveMode = 'add'
        } else if (preservedCount > 0) {
          preserveMode = 'replace'
        } else {
          preserveMode = 'auto'
        }
      }
    } else {
      // FREE: 항상 보존 (1개 제한, 교체 방식)
      if (preservedCount > 0) {
        preserveMode = 'replace'  // 기존 이력서 교체
      } else {
        preserveMode = 'auto'  // 첫 보존
      }
    }

    // 예상 시간 설정 (PDF는 더 오래 걸림)
    const isPdf = file?.type === 'application/pdf'
    const estimatedSeconds = isPdf ? 90 : 40 // PDF: 90초, DOCX/텍스트: 40초
    setEstimatedTime(estimatedSeconds)
    setProgress(0)

    setLoading(true)
    startAnalysis() // 백그라운드 분석 뱃지 표시
    loadingStepRef.current = 0
    setLoadingMsg(LOADING_STEPS[0])

    // 진행률 업데이트 (0.5초마다)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // 2단계 진행률: 0-90%는 정상 속도, 90-99%는 느리게
        if (prev >= 99) return 99 // 99%에서 대기
        if (prev >= 90) {
          // 90-99%: 매우 느리게 (1분에 9% 증가)
          return prev + 0.15 // 0.5초마다 0.15% 증가
        }
        // 0-90%: 정상 속도
        return prev + (90 / (estimatedSeconds * 2)) // 예상 시간의 90%까지
      })
    }, 500)

    // 메시지 업데이트 (7초마다)
    loadingIntervalRef.current = setInterval(() => {
      loadingStepRef.current = Math.min(loadingStepRef.current + 1, LOADING_STEPS.length - 1)
      setLoadingMsg(LOADING_STEPS[loadingStepRef.current])
    }, 7000)

    try {
      const fd = new FormData()
      if (inputMode === 'text') {
        fd.append('resumeText', resumeText)
      } else {
        fd.append('resume', file!)
      }
      fd.append('preserveMode', preserveMode)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '알 수 없는 오류가 발생했습니다.')
        clearAnalysis() // 에러 시 뱃지 제거
      } else {
        setProgress(100) // 완료!

        // 브라우저 알림 (백그라운드에서도 알림)
        showNotification(
          '✅ 이력서 분석 완료!',
          `${data.job_title || '이력서'} 분석이 완료되었습니다. 직무 적합도 ${data.scores?.job_fit || '-'}%`
        )

        setResult(data)
        setAnalysisId(data._id ?? null)
        if (data._id) {
          completeAnalysis(data._id) // 백그라운드 분석 완료 표시
          // 보안: candidate_name은 localStorage에 저장하지 않음
          // 대신 분석 결과 객체에서 직접 사용
        }

        // 파일 초기화 (큐 처리는 useEffect에서)
        setFile(null)
        setResumeText('')
        setAgreed(false)
        fetch('/api/coupons/mine').then(r => r.json()).then(({ coupons }) => { if (coupons) setMyCoupons(coupons) }).catch(() => {})
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
      clearAnalysis() // 에러 시 뱃지 제거
    } finally {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
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
      setJdSavedListLoading(true)
      fetch('/api/analyze/jd/list')
        .then((r) => r.json())
        .then(({ analyses }) => setJdSavedList(analyses ?? []))
        .catch(() => {})
        .finally(() => setJdSavedListLoading(false))
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

  async function saveJDTemplate() {
    if (!jdCompany.trim() || !jdContent.trim()) return
    try {
      const res = await fetch('/api/jd-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: jdCompany,
          position: jdPosition || null,
          content: jdContent,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(errorData.error || 'JD 템플릿 저장 중 오류가 발생했습니다.')
        throw new Error(errorData.error || '저장 실패')
      }

      const newTemplate = await res.json()
      setSavedJDTemplates([newTemplate, ...savedJDTemplates])
    } catch (e) {
      // 에러는 이미 alert로 표시했으므로 여기서는 로그만
      console.error('[saveJDTemplate]', e)
    }
  }

  async function deleteJDTemplate(id: string) {
    if (!confirm('이 JD를 삭제할까요?')) return
    try {
      const res = await fetch(`/api/jd-templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      setSavedJDTemplates(savedJDTemplates.filter(t => t.id !== id))
    } catch (e) {
      alert('JD 템플릿 삭제 중 오류가 발생했습니다.')
    }
  }

  function selectJDTemplate(template: JDTemplate) {
    setJdCompany(template.company)
    setJdPosition(template.position || '')
    setJdContent(template.content)
    setJdClientComment('')
    setShowJDInput(true)
    setSelectedTemplateId(template.id) // 선택한 템플릿 ID 저장
  }

  async function onJDAnalyze() {
    if (!jdCompany.trim() || !jdContent.trim()) return

    // 백그라운드 분석 시작
    startJdAnalysis()

    setJdLoading(true)
    setJdError(null)
    setJdResult(null)
    jdLoadingStepRef.current = 0
    setJdLoadingMsg(JD_LOADING_STEPS[0])
    jdLoadingIntervalRef.current = setInterval(() => {
      jdLoadingStepRef.current = Math.min(jdLoadingStepRef.current + 1, JD_LOADING_STEPS.length - 1)
      setJdLoadingMsg(JD_LOADING_STEPS[jdLoadingStepRef.current])
    }, 8000)
    try {
      const res = await fetch('/api/analyze/jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: jdCompany,
          position: jdPosition,
          jd: jdContent,
          analysisResult: jdSelectedAnalysis?.result,
          client_comment: jdClientComment.trim() || undefined
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setJdError(data.error || '알 수 없는 오류가 발생했습니다.')
        clearJdAnalysis() // 에러 시 백그라운드 분석 취소
      } else {
        setJdResult(data)
        // 백그라운드 분석 완료
        completeJdAnalysis('jd-temp') // JD 분석은 별도 저장 없으므로 임시 ID
        setTimeout(() => jdTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        // 저장 목록 갱신
        fetch('/api/analyze/jd/list')
          .then((r) => r.json())
          .then(({ analyses }) => setJdSavedList(analyses ?? []))
          .catch(() => {})
      }
    } catch {
      setJdError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
      clearJdAnalysis() // 에러 시 백그라운드 분석 취소
    } finally {
      if (jdLoadingIntervalRef.current) {
        clearInterval(jdLoadingIntervalRef.current)
        jdLoadingIntervalRef.current = null
      }
      setJdLoading(false)
    }
  }

  return (
    <main className="analyze-page">
      <div className="analyze-layout">

        {/* 메인 콘텐츠 */}
        <div className="analyze-main">
          <div className="analyze-container">

            {/* 상단 탭 */}
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
                  {jdSavedList && jdSavedList.length > 0 && <span className="tab-badge">{jdSavedList.length}개</span>}
                </button>
                <button
                  className={`analyze-tab-btn${activeMenu === 'rewrite' ? ' active' : ''}`}
                  onClick={() => onMenuClick('rewrite')}
                >
                  <span>✏️</span> 이력서 생성
                </button>
                {isExpert ? (
                  <button
                    className={`analyze-tab-btn${activeMenu === 'interview' ? ' active' : ''}`}
                    onClick={() => onMenuClick('interview')}
                  >
                    <span>🎤</span> 면접 가이드 <span className="tab-expert-badge">EXPERT</span>
                  </button>
                ) : (
                  <button className="analyze-tab-btn disabled" disabled>
                    <span>🎤</span> 면접 가이드 <span className="tab-soon">EXPERT</span>
                  </button>
                )}
              </div>
            <div className={`analyze-header${(activeMenu === 'saved' || (activeMenu === 'upload' && result)) && result ? ' analyze-header--saved' : ''}`}>
              {(activeMenu === 'saved' || activeMenu === 'upload') && result && (result?.candidate_name || editingCandidateName) ? (
                <div className="analyze-candidate-header">
                  {editingCandidateName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={candidateNameInput}
                        onChange={(e) => setCandidateNameInput(e.target.value)}
                        placeholder="후보자 이름 입력"
                        disabled={savingCandidateName}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCandidateName()
                          if (e.key === 'Escape') {
                            setEditingCandidateName(false)
                            setCandidateNameInput('')
                          }
                        }}
                        style={{
                          fontSize: '36px',
                          fontWeight: 800,
                          color: '#fff',
                          background: 'rgba(255,255,255,0.05)',
                          border: '2px solid #a78bfa',
                          borderRadius: '12px',
                          padding: '8px 16px',
                          outline: 'none',
                          flex: 1,
                        }}
                      />
                      <button
                        onClick={saveCandidateName}
                        disabled={savingCandidateName}
                        style={{
                          padding: '8px 16px',
                          background: '#a78bfa',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: savingCandidateName ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          opacity: savingCandidateName ? 0.5 : 1,
                        }}
                      >
                        {savingCandidateName ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCandidateName(false)
                          setCandidateNameInput('')
                        }}
                        disabled={savingCandidateName}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          cursor: savingCandidateName ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="analyze-candidate-name">{result?.candidate_name || '후보자 미상'}</div>
                      <button
                        onClick={() => {
                          setEditingCandidateName(true)
                          setCandidateNameInput(result?.candidate_name || '')
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(167, 139, 250, 0.2)',
                          color: '#a78bfa',
                          border: '1px solid rgba(167, 139, 250, 0.4)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        ✏️ 수정
                      </button>
                    </div>
                  )}
                  {!editingCandidateName && result?.job_title && <div className="analyze-candidate-job">{result.job_title}</div>}
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
                    <AnalysisResults
                      result={savedSelectedItem.result}
                      analysisId={savedSelectedItem.id}
                      isPro={isPro}
                      userType={userType}
                      userEmail={userEmail}
                      showHiringModal={showHiringModal}
                      setShowHiringModal={setShowHiringModal}
                      hiringProcessCreating={hiringProcessCreating}
                      setHiringProcessCreating={setHiringProcessCreating}
                      hiringModalTop={hiringModalTop}
                      setHiringModalTop={setHiringModalTop}
                      hiringButtonRef={hiringButtonRef}
                      hiringJDInfo={hiringJDInfo}
                      setHiringJDInfo={setHiringJDInfo}
                    />
                  </>
                ) : (
                  <>
                    <div className="jd-list-title">분석 결과를 선택하세요</div>

                    {/* 검색/필터 */}
                    {analysisList && analysisList.length > 0 && (
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="직무명 또는 요약 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <select
                          className="form-input"
                          value={minScore}
                          onChange={(e) => setMinScore(Number(e.target.value))}
                          style={{ width: 150 }}
                        >
                          <option value={0}>전체 점수</option>
                          <option value={70}>70점 이상</option>
                          <option value={80}>80점 이상</option>
                          <option value={90}>90점 이상</option>
                        </select>
                      </div>
                    )}

                    {savedListLoading ? (
                      <div className="jd-list-loading">불러오는 중...</div>
                    ) : !analysisList || analysisList.length === 0 ? (
                      <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
                    ) : (() => {
                        const filteredList = analysisList.filter(item => {
                          // 검색어 필터
                          const searchLower = searchQuery.toLowerCase()
                          const matchesSearch = !searchQuery ||
                            (item.result.job_title?.toLowerCase().includes(searchLower)) ||
                            (item.result.summary?.toLowerCase().includes(searchLower))

                          // 점수 필터
                          const matchesScore = !minScore || (item.result.scores?.job_fit ?? 0) >= minScore

                          return matchesSearch && matchesScore
                        })

                        return filteredList.length === 0 ? (
                          <div className="jd-no-analysis">검색 조건에 맞는 분석 결과가 없습니다.</div>
                        ) : (
                          <div className="jd-saved-list">
                            {filteredList.map((item) => (
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
                              className="saved-share-btn"
                              onClick={(e) => handleShare(item.id, e)}
                              disabled={sharingId === item.id}
                              title="공유 URL 복사"
                              style={{ marginRight: 8 }}
                            >
                              {sharingId === item.id ? '⏳' : '🔗'}
                            </button>
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
                        )
                      })()
                    }
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

                <div className="jd-list-title">이력서 생성</div>
                <p className="rewrite-desc">
                  JOBIZIC이 추천하는 <strong>깔끔하고 전문적인 포맷</strong>으로 이력서를 생성합니다.<br />
                  가독성이 뛰어나고 채용 담당자가 선호하는 구조로 자동 구성되며, 최신 업무 활동 내역도 자동으로 반영됩니다.<br />
                  JD 적합도 분석을 선택하여 해당 채용사에 맞게 전략적으로 최적화됩니다. 완료 시 <strong>.docx</strong> 파일로 다운로드됩니다.
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

                {/* 최근 생성된 이력서 다시 보기 */}
                {(() => {
                  try {
                    const storageKey = `jobizic_last_rewrite_${userEmail || 'guest'}`
                    let saved = localStorage.getItem(storageKey)

                    // 마이그레이션: 이전 키에서 데이터 가져오기
                    if (!saved) {
                      const oldKey = 'jobizic_last_rewrite'
                      const oldSaved = localStorage.getItem(oldKey)
                      if (oldSaved) {
                        try {
                          const oldData = JSON.parse(oldSaved)
                          // 새 키로 저장 (userEmail 추가)
                          localStorage.setItem(storageKey, JSON.stringify({
                            ...oldData,
                            userEmail: userEmail
                          }))
                          // 이전 키 삭제
                          localStorage.removeItem(oldKey)
                          saved = localStorage.getItem(storageKey)
                        } catch (e) {
                          console.error('마이그레이션 실패:', e)
                        }
                      }
                    }

                    if (!saved) return null
                    const data = JSON.parse(saved)
                    const ageMinutes = Math.floor((Date.now() - data.timestamp) / 60000)
                    if (ageMinutes > 60) return null // 1시간 이상 지나면 숨김

                    // 사용자 검증 (마이그레이션된 데이터는 userEmail이 없을 수 있음)
                    if (data.userEmail && data.userEmail !== userEmail) return null

                    return (
                      <div style={{
                        background: 'rgba(232,255,71,0.08)',
                        border: '1px solid rgba(232,255,71,0.2)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                            📄 최근 생성된 이력서
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--muted2)' }}>
                            {ageMinutes < 1 ? '방금 전' : `${ageMinutes}분 전`}, {data.plan} 플랜
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn-primary"
                            onClick={() => window.open(`/analyze/preview?email=${encodeURIComponent(userEmail || '')}`, '_blank')}
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                          >
                            다시 보기 →
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('생성된 이력서를 삭제하시겠습니까?')) {
                                const storageKey = `jobizic_last_rewrite_${userEmail || 'guest'}`
                                localStorage.removeItem(storageKey)
                                // 강제 리렌더링
                                window.location.reload()
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'var(--muted)',
                              fontSize: '18px',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,0,0,0.1)'
                              e.currentTarget.style.borderColor = 'rgba(255,0,0,0.3)'
                              e.currentTarget.style.color = '#ff5555'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                              e.currentTarget.style.color = 'var(--muted)'
                            }}
                            title="삭제"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  } catch {
                    return null
                  }
                })()}

                {savedListLoading ? (
                  <div className="jd-list-loading">불러오는 중...</div>
                ) : !analysisList || analysisList.length === 0 ? (
                  <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
                ) : (
                  <div className="jd-saved-list">
                    {analysisList.map((item) => {
                        const now2 = new Date()
                        const hasValidJd = (jdSavedList ?? []).some(jd => !jd.expires_at || new Date(jd.expires_at) > now2)
                        const filePath = item.result._file_path as string | undefined
                        const isTextPaste = filePath?.endsWith('.txt') ?? false
                        const noFile = !filePath
                        const disabledTitle = noFile
                          ? '원본 파일이 보존되지 않은 이력서입니다'
                          : !hasValidJd
                          ? 'JD 적합도 분석을 먼저 진행해 주세요'
                          : undefined
                        return (
                          <div key={item.id} className="jd-saved-card rewrite-card">
                            <div className="jd-saved-card-left">
                              <span className="jd-saved-company">
                                {item.result.job_title ?? '이력서 분석'}
                                {isTextPaste
                                  ? <span className="preserve-badge text-paste">텍스트 입력</span>
                                  : filePath
                                  ? <span className="preserve-badge saved">보존됨</span>
                                  : <span className="preserve-badge unsaved">미보존</span>
                                }
                              </span>
                              {(() => {
                                // 보안: localStorage에서 읽지 않고 result에서 직접 사용
                                const candidateName = item.result.candidate_name
                                return candidateName ? (
                                  <div className="candidate-name-badge" style={{
                                    display: 'inline-block',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    marginTop: '6px',
                                    marginBottom: '4px',
                                  }}>
                                    👤 후보자: {candidateName}
                                  </div>
                                ) : null
                              })()}
                              <span className="jd-saved-resume">
                                {isTextPaste
                                  ? '양식 업로드 또는 자율 포맷으로 이력서 생성 가능'
                                  : item.result.summary?.slice(0, 60) + '…'
                                }
                              </span>
                            </div>
                            <div className="jd-saved-card-right">
                              <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <button
                              className="rewrite-dl-btn"
                              onClick={() => handleRewrite(item.id, filePath)}
                              disabled={rewritingId === item.id || noFile || !hasValidJd}
                              title={disabledTitle}
                            >
                              {rewritingId === item.id ? '생성 중...' : '✏️ 이력서 생성'}
                            </button>
                            {rewritingId === item.id && rewriteLoadingMsg && (
                              <div className="rewrite-loading-msg">{rewriteLoadingMsg}</div>
                            )}
                          </div>
                        )
                      })}
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

                    // 파일명: {이름}_{회사}_{포지션}_면접가이드.html
                    const parts = [
                      g.candidate_name ?? '후보자',
                      g.company,
                      g.position,
                    ].filter(Boolean)

                    a.href = url
                    a.download = `${parts.join('_')}_면접가이드.html`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  ⬇ HTML 다운로드
                </button>
              )

              const renderGuide = (g: InterviewGuideResult) => {
                // 디버깅: 데이터 확인
                console.log('🎤 Interview Guide Data:', {
                  candidate_name: g.candidate_name,
                  company: g.company,
                  position: g.position,
                  strengths: g.strengths,
                  reverse_questions: g.reverse_questions,
                  checklist: g.checklist,
                  qa_salary: g.qa_salary,
                  risks: g.risks,
                  fullData: g
                })

                return (
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
                      <div className="interview-qa-label">D. 프로젝트 경험 심화 질문</div>
                      <div className="interview-text">{(g.qa_project_experience ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                    </div>
                    <div className="interview-qa-block">
                      <div className="interview-qa-label">E. 입사 후 계획</div>
                      <div className="interview-text">{(g.qa_post_join ?? '').split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
                    </div>
                    <div className="interview-qa-block">
                      <div className="interview-qa-label">F. 희망 연봉</div>
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
              }

              return (
                <div className="jd-section">
                  {guide ? renderGuide(guide)
                  : showNewInterview ? (
                    interviewSelectedAnalysis ? (
                      <div className="interview-form-wrap">
                        <button className="jd-back-btn" onClick={() => setInterviewSelectedAnalysis(null)}>
                          ← 이력서 다시 선택
                        </button>

                        <div style={{
                          background: 'rgba(232, 255, 71, 0.05)',
                          border: '1px solid rgba(232, 255, 71, 0.2)',
                          borderRadius: '12px',
                          padding: '20px 24px',
                          marginBottom: '24px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#e8ff47',
                            marginBottom: '8px'
                          }}>
                            🎤 면접 가이드 생성
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                            선택한 이력서를 기반으로 맞춤형 면접 준비 가이드를 AI가 생성합니다
                          </div>
                        </div>

                        <div className="jd-selected-summary">
                          <div className="jd-selected-label">✅ STEP 1. 선택된 이력서</div>
                          <div className="jd-selected-title">
                            {interviewSelectedAnalysis.result.job_title ?? '이력서 분석'}
                            <span className="jd-selected-date">{new Date(interviewSelectedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <p className="jd-selected-summary-text">{interviewSelectedAnalysis.result.summary?.slice(0, 100)}…</p>
                        </div>

                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--muted2)',
                          marginBottom: '16px',
                          marginTop: '24px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          📝 STEP 2. 면접 정보 입력 (선택사항)
                        </div>

                        <div className="jd-form">
                          <div className="jd-field">
                            <label className="jd-label">
                              💼 JD 기반 분석 연결
                              <span className="jd-label-optional">(선택)</span>
                            </label>
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
                            <label className="jd-label">
                              📋 면접 형식
                              <span className="jd-label-optional">(선택)</span>
                            </label>
                            <input className="jd-input" type="text" placeholder="예) 1차 실무 → 2차 임원, PT 발표 포함" value={interviewFormat} onChange={(e) => setInterviewFormat(e.target.value)} />
                          </div>
                          <div className="jd-field">
                            <label className="jd-label">
                              👥 면접관 정보
                              <span className="jd-label-optional">(선택)</span>
                            </label>
                            <input className="jd-input" type="text" placeholder="예) 인사팀 + 현업 팀장, C-level" value={interviewerInfo} onChange={(e) => setInterviewerInfo(e.target.value)} />
                          </div>
                          <div className="jd-field">
                            <label className="jd-label">
                              ⚠️ 특이사항
                              <span className="jd-label-optional">(선택)</span>
                            </label>
                            <input className="jd-input" type="text" placeholder="예) 단기 재직 이력, 도메인 갭, 연봉 Gap" value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} />
                          </div>
                        </div>
                        {interviewError && <div className="analyze-error">{interviewError}</div>}

                        <div style={{
                          marginTop: '32px',
                          paddingTop: '24px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--muted)',
                            marginBottom: '16px'
                          }}>
                            💡 AI가 약 60-90초 동안 맞춤형 면접 가이드를 생성합니다
                          </div>
                          <button
                            className="jd-analyze-btn"
                            style={{
                              background: interviewLoading ? 'var(--muted)' : 'linear-gradient(135deg, #e8ff47 0%, #d4eb33 100%)',
                              color: '#000',
                              fontSize: '16px',
                              fontWeight: 700,
                              padding: '16px 32px',
                              width: '100%',
                              maxWidth: '400px'
                            }}
                            disabled={interviewLoading}
                          onClick={async () => {
                            setInterviewLoading(true)
                            setInterviewError(null)
                            // 진행 상황 표시 시작
                            interviewLoadingStepRef.current = 0
                            setInterviewLoadingMsg(INTERVIEW_LOADING_STEPS[0])
                            interviewLoadingIntervalRef.current = setInterval(() => {
                              interviewLoadingStepRef.current = Math.min(interviewLoadingStepRef.current + 1, INTERVIEW_LOADING_STEPS.length - 1)
                              setInterviewLoadingMsg(INTERVIEW_LOADING_STEPS[interviewLoadingStepRef.current])
                            }, 15000) // 약 105초 (7단계 × 15초)
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
                              // 진행 상황 표시 종료
                              if (interviewLoadingIntervalRef.current) {
                                clearInterval(interviewLoadingIntervalRef.current)
                                interviewLoadingIntervalRef.current = null
                              }
                              setInterviewLoading(false)
                            }
                          }}
                        >
                          {interviewLoading ? '생성 중...' : '🎤 면접 가이드 생성'}
                          </button>
                        </div>

                        {interviewLoading && (
                          <div className="jd-loading-indicator">
                            <div className="loading-spinner"></div>
                            <div className="loading-text">{interviewLoadingMsg}</div>
                          </div>
                        )}
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
                                  {(() => {
                                    // 보안: localStorage에서 읽지 않고 result에서 직접 사용
                                    const candidateName = item.result.candidate_name
                                    return candidateName ? (
                                      <div className="candidate-name-badge" style={{
                                        display: 'inline-block',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        marginTop: '6px',
                                        marginBottom: '4px',
                                      }}>
                                        👤 후보자: {candidateName}
                                      </div>
                                    ) : null
                                  })()}
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
                                    {saved.result.job_title || saved.result.candidate_name || '후보자'}
                                    {saved.result.company && <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>@ {saved.result.company}{saved.result.position ? ` — ${saved.result.position}` : ''}</span>}
                                  </span>
                                  <span className="jd-saved-resume interview-expire-tag">{days > 0 ? `${days}일 후 삭제` : '오늘 삭제 예정'}</span>
                                </div>
                                <div className="jd-saved-card-right">
                                  <span className="jd-saved-date">{new Date(saved.created_at).toLocaleDateString('ko-KR')}</span>
                                </div>
                                <button
                                  className="saved-delete-btn"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    if (!confirm('면접 가이드를 삭제하시겠습니까?')) return
                                    try {
                                      const res = await fetch(`/api/analyze/interview/${saved.id}`, { method: 'DELETE' })
                                      if (res.ok) {
                                        setInterviewSavedList(prev => prev ? prev.filter(g => g.id !== saved.id) : prev)
                                        if (interviewViewingSaved?.id === saved.id) setInterviewViewingSaved(null)
                                      }
                                    } catch (err) {
                                      console.error('Delete error:', err)
                                    }
                                  }}
                                  title="삭제"
                                >
                                  ×
                                </button>
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
                  <>
                    <JDResults
                      result={jdViewingSaved.result}
                      expiresAt={jdViewingSaved.expires_at ?? undefined}
                      onReset={() => setJdViewingSaved(null)}
                      userType={userType}
                    />
                    {/* 헤드헌터: 채용 프로세스 추가 버튼 */}
                    {userType === 'HEADHUNTER' && isPro && (
                      <div style={{ marginBottom: '16px', marginTop: '16px', position: 'relative', zIndex: 10 }}>
                        <button
                          ref={hiringButtonRef}
                          className="analyze-download-btn"
                          onClick={(e) => {
                            console.log('🚨 [채용 프로세스] 버튼 클릭 시작!')
                            e.preventDefault()
                            e.stopPropagation()

                            try {
                              // JD 정보를 state에 저장
                              setHiringJDInfo({
                                candidateName: '',
                                companyName: jdViewingSaved.result.company || '',
                                positionTitle: jdViewingSaved.result.position || ''
                              })
                              console.log('✅ JD 정보 저장 완료')

                              // 모달 위치 계산
                              if (hiringButtonRef.current) {
                                const rect = hiringButtonRef.current.getBoundingClientRect()
                                const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                                setHiringModalTop(rect.top + scrollTop - 400)
                              }

                              // 모달 표시
                              setShowHiringModal(true)
                              console.log('✅ 모달 표시 완료')
                            } catch (error) {
                              console.error('❌ 에러 발생:', error)
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            color: '#ffffff',
                            fontWeight: 600,
                            position: 'relative',
                            zIndex: 100,
                            cursor: 'pointer',
                            pointerEvents: 'auto'
                          }}
                        >
                          📊 채용 프로세스 추가
                        </button>
                      </div>
                    )}
                  </>
                ) : jdResult ? (
                  <>
                    <JDResults
                      result={jdResult}
                      analysisItem={jdSelectedAnalysis ?? undefined}
                      expiresAt={jdResult.expires_at}
                      onReset={() => { setJdResult(null); setJdSelectedAnalysis(null) }}
                      userType={userType}
                    />
                    {/* 헤드헌터: 채용 프로세스 추가 버튼 */}
                    {userType === 'HEADHUNTER' && isPro && (
                      <div style={{ marginBottom: '16px', marginTop: '16px', position: 'relative', zIndex: 10 }}>
                        <button
                          ref={hiringButtonRef}
                          className="analyze-download-btn"
                          onClick={(e) => {
                            console.log('🚨 [채용 프로세스] 버튼 클릭 시작!')
                            e.preventDefault()
                            e.stopPropagation()

                            try {
                              // JD 정보를 state에 저장
                              setHiringJDInfo({
                                candidateName: jdSelectedAnalysis?.result.candidate_name || '',
                                companyName: jdResult.company || '',
                                positionTitle: jdResult.position || ''
                              })
                              console.log('✅ JD 정보 저장 완료')

                              // 모달 위치 계산
                              if (hiringButtonRef.current) {
                                const rect = hiringButtonRef.current.getBoundingClientRect()
                                const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                                setHiringModalTop(rect.top + scrollTop - 400)
                              }

                              // 모달 표시
                              setShowHiringModal(true)
                              console.log('✅ 모달 표시 완료')
                            } catch (error) {
                              console.error('❌ 에러 발생:', error)
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            color: '#ffffff',
                            fontWeight: 600,
                            position: 'relative',
                            zIndex: 100,
                            cursor: 'pointer',
                            pointerEvents: 'auto'
                          }}
                        >
                          📊 채용 프로세스 추가
                        </button>
                      </div>
                    )}
                  </>
                ) : jdSelectedAnalysis ? (
                  <>
                    <button className="jd-back-btn" onClick={() => { setJdSelectedAnalysis(null); setShowJDInput(false) }}>
                      ← 이력서 다시 선택
                    </button>
                    <div className="jd-selected-summary">
                      <div className="jd-selected-label">선택된 이력서</div>
                      <div className="jd-selected-title">
                        {jdSelectedAnalysis.result.job_title ?? '이력서 분석'}
                        <span className="jd-selected-date">{new Date(jdSelectedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {(() => {
                        // 보안: localStorage에서 읽지 않고 result에서 직접 사용
                        const candidateName = jdSelectedAnalysis.result.candidate_name
                        return candidateName ? (
                          <div className="candidate-name-badge" style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            marginBottom: '8px',
                          }}>
                            👤 후보자: {candidateName}
                          </div>
                        ) : null
                      })()}
                      <p className="jd-selected-summary-text">{jdSelectedAnalysis.result.summary?.slice(0, 100)}…</p>
                    </div>

                    {!showJDInput ? (
                      <>
                        {savedJDTemplates.length > 0 && (
                          <div className="jd-template-section">
                            <div className="jd-list-title">📁 저장된 JD</div>
                            <div className="jd-template-list">
                              {savedJDTemplates.map((template) => (
                                <div
                                  key={template.id}
                                  className="jd-template-card"
                                  onClick={() => selectJDTemplate(template)}
                                >
                                  <div className="jd-template-info">
                                    <span className="jd-template-company">{template.company}</span>
                                    {template.position && <span className="jd-template-position">{template.position}</span>}
                                  </div>
                                  <button
                                    className="jd-template-delete"
                                    onClick={(e) => { e.stopPropagation(); deleteJDTemplate(template.id) }}
                                    title="삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          className="btn-hero"
                          onClick={() => {
                            setJdCompany('');
                            setJdPosition('');
                            setJdContent('');
                            setSelectedTemplateId(null); // 새 입력 시 템플릿 ID 초기화
                            setShowJDInput(true)
                          }}
                          style={{ width: '100%', marginTop: savedJDTemplates.length > 0 ? 16 : 0 }}
                        >
                          + 새 JD 입력
                        </button>
                      </>
                    ) : (
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
                          rows={10}
                        />
                      </div>
                      <div className="jd-field">
                        <label className="jd-label">클라이언트 코멘트 <span className="jd-label-optional">(선택)</span></label>
                        <textarea
                          className="jd-textarea"
                          placeholder="예) 개발직군 채용 경험 필수, 스타트업 경험자 우대, 영어 실무 가능자만&#10;요건 완화/강화, 우선순위 변경, 기피 프로파일 등을 입력하세요."
                          value={jdClientComment}
                          onChange={(e) => setJdClientComment(e.target.value)}
                          rows={3}
                        />
                      </div>
                      {jdError && <div className="analyze-error">{jdError}</div>}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                        <button
                          className="btn-ghost"
                          onClick={() => setShowJDInput(false)}
                          style={{ flex: '0 0 auto' }}
                        >
                          ← 목록으로
                        </button>
                        <button
                          className="btn-hero analyze-btn"
                          onClick={async () => {
                            // 저장된 JD를 선택한 경우 저장 스킵
                            if (!selectedTemplateId) {
                              await saveJDTemplate()
                            }
                            onJDAnalyze()
                          }}
                          disabled={!jdCompany.trim() || !jdContent.trim() || jdLoading}
                          style={{ flex: 1 }}
                        >
                          {jdLoading ? 'AI 분석 중...' : selectedTemplateId ? '분석하기 →' : '저장 & 분석하기 →'}
                        </button>
                      </div>
                      {jdLoading && (
                        <div className="analyze-loading">
                          <div className="loading-bar"><div className="loading-fill" /></div>
                          <div className="loading-text">{jdLoadingMsg}</div>
                        </div>
                      )}
                    </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* 저장된 JD 분석 목록 */}
                    {(jdSavedList && jdSavedList.length > 0) && (
                      <div className="jd-saved-section">
                        <div className="jd-list-title">📊 이전 JD 분석 결과 ({jdSavedList.length}건)</div>
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
                                  <span className="jd-saved-score" style={{ color }}>{item.result.fit_score ?? 0}%</span>
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

                    <div className="jd-list-title">📄 분석할 이력서를 선택하세요</div>
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
                                {item.result.candidate_name && (
                                  <span style={{ color: '#a78bfa', marginRight: '8px' }}>
                                    👤 {item.result.candidate_name}
                                  </span>
                                )}
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
                {/* 이력서 분석 쿠폰 보유 배지 */}
                {myCoupons.filter(c => c.feature === 'resume' && c.status === 'active').length > 0 && (
                  <div className="coupon-active-badge">
                    🎟 이력서 분석 쿠폰 {myCoupons.filter(c => c.feature === 'resume' && c.status === 'active').length}개 보유 — 이번 분석이 무료로 진행됩니다
                  </div>
                )}

                <div className="upload-mode-tabs">
                  <button
                    className={`upload-mode-tab${inputMode === 'file' ? ' active' : ''}`}
                    onClick={() => { setInputMode('file'); setResumeText('') }}
                  >📎 파일 업로드</button>
                  <button
                    className={`upload-mode-tab${inputMode === 'text' ? ' active' : ''}`}
                    onClick={() => { setInputMode('text'); setFile(null) }}
                  >📋 텍스트 붙여넣기</button>
                </div>

                {inputMode === 'file' ? (
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
                      multiple
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
                        <div className="upload-hint">PDF, DOCX, 최대 10MB</div>
                        <div className="upload-hint upload-hint--warn">Windows 시스템에 따라 DOCX 파일 선택 시 Word 오류 팝업이 뜰 수 있습니다. × 로 닫으면 정상 업로드됩니다.</div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="resume-text-wrap">
                    <textarea
                      className="resume-textarea"
                      placeholder="이력서 내용을 여기에 붙여넣기 하세요.&#10;&#10;경력, 학력, 기술 스택, 프로젝트 등 이력서 전체 내용을 복사해서 붙여넣으면 됩니다."
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      rows={10}
                    />
                    <div className="resume-textarea-hint">{resumeText.length.toLocaleString()}자</div>
                  </div>
                )}

                {/* FREE 플랜: 자동 보존 안내 */}
                {!isPro && !isExpert && (
                  <div className="preserve-checkbox-section">
                    <div className="preserve-checkbox-wrap" style={{ cursor: 'default', background: 'rgba(232,255,71,0.05)' }}>
                      <div className="preserve-checkbox-body">
                        <div className="preserve-checkbox-label">
                          📂 이력서 파일 자동 저장
                          <span className="preserve-option-badge free">무료 1개</span>
                        </div>
                        <div className="preserve-checkbox-desc">
                          FREE 플랜은 이력서 1개가 자동으로 저장됩니다. 저장된 이력서로 <strong>이력서 생성</strong> 기능을 사용할 수 있습니다.
                          {inputMode === 'text' && ' (텍스트는 .txt 파일로 저장됩니다)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PRO/EXPERT: 체크박스로 선택 */}
                {(isPro || isExpert) && (() => {
                  const preserved = (analysisList ?? []).filter(item => item.result?._file_path)
                  const rewriteCouponCount = myCoupons.filter(c => c.feature === 'rewrite').length
                  return (
                    <div className="preserve-checkbox-section">
                      <label className="preserve-checkbox-wrap">
                        <input
                          type="checkbox"
                          className="consent-checkbox"
                          checked={preserveChecked}
                          onChange={e => { setPreserveChecked(e.target.checked); setPreserveAddWithCoupon(false) }}
                        />
                        <div className="preserve-checkbox-body">
                          <div className="preserve-checkbox-label">
                            이력서 파일 저장
                            {preserved.length === 0
                              ? <span className="preserve-option-badge free">무료</span>
                              : <span className="preserve-option-badge free">교체, 무료</span>
                            }
                          </div>
                          <div className="preserve-checkbox-desc">
                            저장해두면 <strong>이력서 생성</strong> 탭에서 AI가 JD 맞춤으로 재작성해 드립니다.
                            {inputMode === 'text' && ' (텍스트는 .txt 파일로 저장됩니다)'}
                            {preserved.length > 0 && (
                              <span className="preserve-checkbox-replace">
                                {' '}현재 저장: {preserved[0].result.job_title ?? '(제목 없음)'} → 새 이력서로 교체됩니다.
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  )
                })()}

                <label className="consent-wrap">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="consent-checkbox"
                  />
                  <span className="consent-text">
                    이력서 내 직무 정보가 AI 분석에 활용됨에 동의합니다.
                    성명/연락처/이메일은 분석 전 자동 마스킹 처리됩니다.{' '}
                    <Link href="/privacy" target="_blank" className="consent-link">개인정보처리방침</Link>
                  </span>
                </label>

                {error && (
                  <div className="analyze-error-wrap">
                    <div className="analyze-error">{error}</div>
                    <button className="analyze-retry-btn" onClick={onAnalyze}>다시 시도</button>
                  </div>
                )}

                <button
                  className="btn-hero analyze-btn"
                  onClick={onAnalyze}
                  disabled={(inputMode === 'file' ? !file : !resumeText.trim()) || loading || !agreed}
                >
                  {loading ? 'AI 분석 중...' : '분석 시작하기 →'}
                </button>

                {loading && (
                  <div className="analyze-loading">
                    <div className="loading-progress-container">
                      <div className="loading-progress-bar">
                        <div className="loading-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="loading-progress-text">{Math.round(progress)}%</div>
                    </div>
                    <div className="loading-text">{loadingMsg || '헤드헌터 AI가 이력서를 검토하고 있습니다...'}</div>
                    <div className="loading-time">약 {estimatedTime}초 소요 예상</div>
                    <div className="loading-background-notice">
                      💡 <strong>백그라운드로 실행 중</strong> - 다른 탭으로 이동하셔도 됩니다. 완료 시 알림을 보내드립니다.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 결과 모드 (새 분석 — upload 탭) */}
            {result && activeMenu === 'upload' && (
              <>
                <div className="free-saved-notice">
                  {!isPro && savedAnalysis && (
                    <>
                      <span>📂 이전 분석 결과</span>
                      <span className="free-saved-date">분석일: {new Date(savedAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                    </>
                  )}
                  <button className="free-reanalyze-btn" onClick={() => { setResult(null); setSavedAnalysis(null) }}>
                    {!isPro && savedAnalysis ? '새로 분석하기' : '← 돌아가기'}
                  </button>
                </div>

                <AnalysisResults
                  result={result}
                  analysisId={analysisId}
                  isPro={isPro}
                  userType={userType}
                  userEmail={userEmail}
                  showHiringModal={showHiringModal}
                  setShowHiringModal={setShowHiringModal}
                  hiringProcessCreating={hiringProcessCreating}
                  setHiringProcessCreating={setHiringProcessCreating}
                  hiringModalTop={hiringModalTop}
                  setHiringModalTop={setHiringModalTop}
                  hiringButtonRef={hiringButtonRef}
                  hiringJDInfo={hiringJDInfo}
                  setHiringJDInfo={setHiringJDInfo}
                />

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
                      이 이력서는 저장되지 않아 이력서 생성을 사용할 수 없습니다.
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
            <div className="preserve-choice-title">이력서 생성</div>
            <div className="preserve-choice-desc">
              JOBIZIC이 추천하는 깔끔하고 전문적인 포맷으로 이력서를 생성합니다.
            </div>

            <button className="preserve-option-card" onClick={() => resolveFormatSelect('standard')}>
              <div className="preserve-option-top">
                <span className="preserve-option-icon">✨</span>
                <span className="preserve-option-label">이력서 생성</span>
                <span className="preserve-option-badge coupon">JOBIZIC 추천</span>
              </div>
              <div className="preserve-option-desc">
                가독성이 뛰어나고 채용 담당자가 선호하는 구조로 작성되며, 최신 업무 활동 내역도 자동으로 반영됩니다.
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
                    <span className="preserve-option-label">{jd.result.company}{jd.result.position ? `, ${jd.result.position}` : ''}</span>
                    <span className={`preserve-option-badge${(jd.result.fit_score ?? 0) >= 70 ? ' coupon' : ' none'}`}>
                      적합도 {jd.result.fit_score ?? 0}%
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

      {/* 채용 프로세스 추가 모달 (AnalyzeClient 레벨) */}
      {showHiringModal && (
        <div className="demo-modal-overlay" onClick={() => !hiringProcessCreating && setShowHiringModal(false)} style={{ alignItems: 'flex-start', paddingTop: `${hiringModalTop}px` }}>
          <div className="demo-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
            <button
              className="demo-modal-close"
              onClick={() => !hiringProcessCreating && setShowHiringModal(false)}
              disabled={hiringProcessCreating}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
              📊 채용 프로세스 추가
            </h2>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const candidateName = formData.get('candidate_name') as string
              const positionTitle = formData.get('position_title') as string
              const companyName = formData.get('company_name') as string
              const nextAction = formData.get('next_action') as string

              if (!candidateName || !positionTitle || !companyName) {
                alert('후보자명, 포지션명, 회사명은 필수입니다.')
                return
              }

              setHiringProcessCreating(true)
              try {
                const res = await fetch('/api/hiring-process', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    analysis_id: analysisId || null,
                    position_title: positionTitle,
                    company_name: companyName,
                    candidate_name: candidateName,
                    next_action: nextAction || '서류 검토',
                    current_stage: 0,
                    status: 'ACTIVE'
                  })
                })

                if (res.ok) {
                  alert('채용 프로세스가 추가되었습니다!')
                  setShowHiringModal(false)
                  window.location.href = '/hiring-process'
                } else {
                  const data = await res.json()
                  alert(data.error || '추가 실패')
                }
              } catch (err) {
                console.error('채용 프로세스 추가 에러:', err)
                alert('서버 오류가 발생했습니다.')
              } finally {
                setHiringProcessCreating(false)
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  후보자명 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="candidate_name"
                  defaultValue={hiringJDInfo.candidateName || '후보자'}
                  required
                  placeholder="예: 김대리"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  회사명 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  defaultValue={hiringJDInfo.companyName}
                  required
                  placeholder="예: 네이버"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  포지션명 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="position_title"
                  defaultValue={hiringJDInfo.positionTitle}
                  required
                  placeholder="예: Product Manager"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  다음 액션 (선택)
                </label>
                <input
                  type="text"
                  name="next_action"
                  placeholder="예: 서류 검토"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowHiringModal(false)}
                  disabled={hiringProcessCreating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: hiringProcessCreating ? 'not-allowed' : 'pointer',
                    opacity: hiringProcessCreating ? 0.5 : 1
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={hiringProcessCreating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#22d3ee',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: hiringProcessCreating ? 'not-allowed' : 'pointer',
                    opacity: hiringProcessCreating ? 0.5 : 1
                  }}
                >
                  {hiringProcessCreating ? '추가 중...' : '추가하기'}
                </button>
              </div>
            </form>
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
  userType,
  userEmail,
  showHiringModal,
  setShowHiringModal,
  hiringProcessCreating,
  setHiringProcessCreating,
  hiringModalTop,
  setHiringModalTop,
  hiringButtonRef,
  hiringJDInfo,
  setHiringJDInfo,
}: {
  result: AnalysisResult
  analysisId?: string | null
  isPro?: boolean
  userType?: string | null
  userEmail?: string | null
  showHiringModal: boolean
  setShowHiringModal: (value: boolean) => void
  hiringProcessCreating: boolean
  setHiringProcessCreating: (value: boolean) => void
  hiringModalTop: number
  setHiringModalTop: (value: number) => void
  hiringButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  hiringJDInfo: {candidateName: string; companyName: string; positionTitle: string}
  setHiringJDInfo: (value: {candidateName: string; companyName: string; positionTitle: string}) => void
}) {
  const [activeCareerTab, setActiveCareerTab] = useState(
    result.career_paths && result.career_paths.length > 0 ? Math.min(1, result.career_paths.length - 1) : 0
  )
  const [lockedTab, setLockedTab] = useState<'RECOMMENDED' | 'STRETCH' | null>(null)
  const [expandedPaths, setExpandedPaths] = useState<CareerPath[] | undefined>(
    Array.isArray(result.career_paths) ? result.career_paths : undefined
  )
  const [expanding, setExpanding] = useState(false)
  const [expandError, setExpandError] = useState<string | null>(null)
  const [refined, setRefined] = useState(!!result.refined)

  // PRO 분석 후 커리어 경로가 없으면 자동으로 expand 호출 (504 방지용 분리 설계)
  useEffect(() => {
    if (!isPro || !analysisId) return
    if (expandedPaths && expandedPaths.length >= 3) return
    setExpanding(true)
    setExpandError(null)
    fetch(`/api/analyze/${analysisId}/expand`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.career_paths) {
          setExpandedPaths(data.career_paths)
          setActiveCareerTab(Math.min(1, data.career_paths.length - 1))
        } else {
          setExpandError(data.error ?? '커리어 경로를 불러오지 못했습니다.')
        }
      })
      .catch(() => setExpandError('커리어 경로 로딩 중 오류가 발생했습니다.'))
      .finally(() => setExpanding(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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

  const paths = expandedPaths
  const active = paths?.[activeCareerTab]

  const globalMax = paths && paths.length > 0
    ? Math.max(...paths.flatMap((p) => (p.salary_bands ?? []).map((b) => b.max || b.min)))
    : 0

  function bandPct(b: { min: number; max: number }) {
    const val = b.max || b.min
    if (!globalMax || !val) return 0
    return Math.min(100, Math.round((val / globalMax) * 100))
  }

  async function handleExpandPaths(clickedType: 'RECOMMENDED' | 'STRETCH') {
    if (!isPro || !analysisId) { setLockedTab(clickedType); return }
    // 이미 확장된 경우 바로 탭 전환
    if (expandedPaths && expandedPaths.length >= 3) {
      const idx = expandedPaths.findIndex((p) => p.type === clickedType)
      if (idx >= 0) { setActiveCareerTab(idx); setLockedTab(null) }
      return
    }
    setLockedTab(clickedType)
    setExpanding(true)
    setExpandError(null)
    try {
      const res = await fetch(`/api/analyze/${analysisId}/expand`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setExpandError(data.error ?? '오류가 발생했습니다.'); return }
      const newPaths: CareerPath[] = data.career_paths
      setExpandedPaths(newPaths)
      const idx = newPaths.findIndex((p) => p.type === clickedType)
      if (idx >= 0) { setActiveCareerTab(idx); setLockedTab(null) }
    } catch {
      setExpandError('서버 오류가 발생했습니다.')
    } finally {
      setExpanding(false)
    }
  }

  return (
    <div className="results-wrap">
      <div className="results-section">
        <div className="results-label">MATCH SCORE</div>
        {result.candidate_name && (
          <div style={{
            fontSize: 16,
            color: '#a78bfa',
            marginBottom: 8,
            fontWeight: 700,
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            display: 'inline-block',
          }}>
            👤 {result.candidate_name}
          </div>
        )}
        {result.job_title && (
          <div style={{
            fontSize: 14,
            color: '#8b8b7a',
            marginBottom: 12,
            marginTop: result.candidate_name ? 8 : 0,
            fontWeight: 500
          }}>
            📌 분석 직무: {result.job_title}
          </div>
        )}
        {scores.map((s) => (
          <div key={s.label} className="result-score-row">
            <div className="score-meta">
              <span className="score-name">{s.label}</span>
              <span className="score-val">{s.value != null ? `${s.value}%` : '—'}</span>
            </div>
            <div className="score-bar-wrap">
              <div className="score-bar" style={{ width: `${s.value ?? 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="results-section">
        <div className="results-label">종합 요약</div>
        <div className="result-summary">
          {(() => {
            const labels = ['포지셔닝', '핵심 강점', '커리어 패턴', '시장 제안']
            const lines = (result.summary ?? '').split(/\n/).map(s => s.trim()).filter(Boolean)

            return lines.map((line, idx) => {
              // 레이블로 시작하는지 확인
              const matchedLabel = labels.find(label => line.startsWith(label))
              if (matchedLabel) {
                const content = line.substring(matchedLabel.length).trim()
                return (
                  <p key={idx} style={{ marginBottom: 8 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{matchedLabel}</span>
                    {' '}{content}
                  </p>
                )
              }
              return <p key={idx} style={{ marginBottom: 8 }}>{line}</p>
            })
          })()}
        </div>
      </div>

      <div className="results-grid">
        <div className="results-section">
          <div className="results-label">핵심 키워드</div>
          <div className="keyword-chips">
            {toArr(result.keywords).length > 0
              ? toArr(result.keywords).map((k, i) => <span key={i} className="keyword-chip">{k}</span>)
              : <span className="keyword-empty">키워드 정보 없음</span>
            }
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
            {toArr(result.improvements).map((s, i) => {
              // 상위 2개: 리스크 키워드 포함 구문 빨간색
              if (i < 2) {
                const riskKeywords = ['불명확', '부재', '부족', '낮음', '없음', '불안정', '리스크', '우려', '약함', '미흡', '잦은', '짧은', '불충분']

                // 작은따옴표로 감싸진 부분 또는 리스크 키워드 포함 구문 감지
                const regex = new RegExp(`('.*?'|'.*?'|[^,、]+(?:${riskKeywords.join('|')})[^,、]*)`, 'g')
                const parts = s.split(regex).filter(p => p)

                return (
                  <li key={i}>
                    {parts.map((part, idx) => {
                      const hasQuote = (part.startsWith("'") && part.endsWith("'")) ||
                                      (part.startsWith("'") && part.endsWith("'"))
                      const hasRiskKeyword = riskKeywords.some(kw => part.includes(kw))

                      if (hasQuote || hasRiskKeyword) {
                        return (
                          <span key={idx} style={{ color: '#ff6b6b', fontWeight: 600 }}>
                            {part}
                          </span>
                        )
                      }
                      return <span key={idx}>{part}</span>
                    })}
                  </li>
                )
              }
              return <li key={i}>{s}</li>
            })}
          </ul>
        </div>
      </div>

      {isPro && expanding && (!paths || paths.length === 0) && (
        <div className="results-section career-expand-loading">
          <div className="results-label" style={{ marginTop: 8 }}>💡 커리어 방향 분석</div>
          <div className="career-expand-spinner">
            <div className="analyze-spinner" />
            <span>커리어 경로를 분석하는 중...</span>
          </div>
        </div>
      )}
      {isPro && !expanding && expandError && (!paths || paths.length === 0) && (
        <div className="results-section">
          <div className="results-label" style={{ marginTop: 8 }}>💡 커리어 방향 분석</div>
          <div className="career-expand-error">
            <span>{expandError}</span>
            <button className="analyze-retry-btn" onClick={() => {
              setExpandError(null)
              setExpanding(true)
              fetch(`/api/analyze/${analysisId}/expand`, { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                  if (data.career_paths) {
                    setExpandedPaths(data.career_paths)
                    setActiveCareerTab(Math.min(1, data.career_paths.length - 1))
                  } else {
                    setExpandError(data.error ?? '커리어 경로를 불러오지 못했습니다.')
                  }
                })
                .catch(() => setExpandError('커리어 경로 로딩 중 오류가 발생했습니다.'))
                .finally(() => setExpanding(false))
            }}>다시 시도</button>
          </div>
        </div>
      )}
      {paths && active ? (
        <div className="results-section">
          <div className="results-label" style={{ marginTop: 8 }}>💡 커리어 방향 분석</div>
          <div className="career-cards">
            {paths.map((p, i) => (
              <button
                key={p.type}
                className={`career-card${i === activeCareerTab && !lockedTab ? ' active' : ''} career-card--${p.type.toLowerCase()}`}
                onClick={() => { setActiveCareerTab(i); setLockedTab(null) }}
              >
                <div className="career-card-type">{p.type}</div>
                <div className="career-card-salary" style={{ color: CAREER_COLORS[p.type] ?? 'inherit' }}>
                  {p.salary_range}
                </div>
                <div className="career-card-title">{p.title}</div>
              </button>
            ))}
            {paths.length === 1 && (['RECOMMENDED', 'STRETCH'] as const).map((type) => (
              <button
                key={type}
                className={`career-card career-card-locked${lockedTab === type ? ' active' : ''} career-card--${type.toLowerCase()}`}
                onClick={() => handleExpandPaths(type)}
                disabled={expanding}
              >
                <div className="career-card-type">{type}</div>
                <div className="career-card-salary career-blur-text" style={{ color: CAREER_COLORS[type] ?? 'inherit' }}>
                  {type === 'RECOMMENDED' ? 'X,XXX~X,XXX만원' : 'X,XXX만원~1억+'}
                </div>
                <div className="career-card-title career-blur-text">AI 추천 경로</div>
                <div className="career-card-lock-icon">{isPro ? '🔄' : '🔒'}</div>
              </button>
            ))}
          </div>
          <div className="career-tabs">
            {paths.map((p, i) => (
              <button
                key={p.type}
                className={`career-tab${i === activeCareerTab && !lockedTab ? ' active' : ''}`}
                onClick={() => { setActiveCareerTab(i); setLockedTab(null) }}
              >
                <span className="career-tab-label">{p.type}</span>
                <span className="career-tab-sub">{p.label}</span>
              </button>
            ))}
            {paths.length === 1 && (['RECOMMENDED', 'STRETCH'] as const).map((type) => (
              <button
                key={type}
                className={`career-tab career-tab-locked${lockedTab === type ? ' active' : ''}`}
                onClick={() => handleExpandPaths(type)}
                disabled={expanding}
              >
                <span className="career-tab-label" style={{ color: CAREER_COLORS[type] }}>{type}</span>
                <span className="career-tab-sub">{isPro ? '🔄 재분석 필요' : '🔒 PRO 전용'}</span>
              </button>
            ))}
          </div>
          {lockedTab ? (
            <div className="career-lock-detail">
              {expanding && (
                <div className="career-lock-loading">
                  <div className="analyze-spinner" />
                  <span>AI가 커리어 경로를 분석 중입니다...</span>
                </div>
              )}
              {expandError && <div className="analyze-error">{expandError}</div>}
              <div className="career-lock-preview">
                <div className="career-lock-preview-badge" style={{ color: CAREER_COLORS[lockedTab], borderColor: CAREER_COLORS[lockedTab] + '50' }}>
                  {lockedTab}
                </div>
                <div className="career-lock-preview-body">
                  <div className="career-lock-blur-title career-blur-text">
                    {lockedTab === 'RECOMMENDED' ? 'AI 헤드헌터 추천 직무명 (잠금됨)' : '고성장 목표 포지션 (잠금됨)'}
                  </div>
                  <div className="career-lock-blur-salary career-blur-text" style={{ color: CAREER_COLORS[lockedTab] }}>
                    {lockedTab === 'RECOMMENDED' ? 'X,XXX만원~X,XXX만원' : 'X,XXX만원~1억+'}
                  </div>
                  <div className="career-lock-blur-bands">
                    {['현재', '1년 뒤', '3년 뒤', '5년 뒤'].map((label) => (
                      <div key={label} className="salary-band-row">
                        <span className="salary-band-year career-blur-text">{label}</span>
                        <div className="salary-band-bar-wrap career-lock-blur-bar">
                          <div className="salary-band-bar career-blur-bar-inner" />
                        </div>
                        <span className="salary-band-range career-blur-text">X,XXX~X,XXX</span>
                      </div>
                    ))}
                  </div>
                  <div className="career-lock-blur-points">
                    {[85, 70, 90, 60].map((w, i) => (
                      <div key={i} className="career-lock-blur-line" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className={`career-lock-cta${isPro ? ' career-lock-cta--pro' : ''}`}>
                {isPro ? (
                  <>
                    <div className="career-lock-cta-icon">⏳</div>
                    <div className="career-lock-cta-title">경로 생성 중...</div>
                    <p className="career-lock-cta-desc">
                      AI가 RECOMMENDED/STRETCH 경로를 분석하고 있습니다. 잠시만 기다려 주세요.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="career-lock-cta-icon">🔒</div>
                    <div className="career-lock-cta-title">
                      {lockedTab === 'RECOMMENDED' ? 'AI 추천 커리어 전환 경로' : '고성장 도전 커리어 경로'}
                    </div>
                    <p className="career-lock-cta-desc">
                      {lockedTab === 'RECOMMENDED'
                        ? '내 강점을 최대로 활용한 헤드헌터 추천 경로 — 현실적으로 가능한 연봉 점프와 구체적인 전환 전략을 PRO에서 확인하세요.'
                        : '2~3년 준비 시 도달 가능한 고성장 경로 — 시장 희소성이 높은 포지션과 연봉 상단, 단계별 액션플랜을 확인하세요.'}
                    </p>
                    <Link href="/#pricing">
                      <button className="btn-hero" style={{ width: '100%', marginTop: 4 }}>PRO 플랜 보기 →</button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
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
            </>
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
                  <span className="refine-free-badge">1회 무료, 기존 횟수 차감 없음</span>
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


      {/* 채용 프로세스 추가 모달 */}
      {showHiringModal && (
        <div className="demo-modal-overlay" onClick={() => !hiringProcessCreating && setShowHiringModal(false)} style={{ alignItems: 'flex-start', paddingTop: `${hiringModalTop}px` }}>
          <div className="demo-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
            <button
              className="demo-modal-close"
              onClick={() => !hiringProcessCreating && setShowHiringModal(false)}
              disabled={hiringProcessCreating}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
              📊 채용 프로세스 추가
            </h2>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const candidateName = formData.get('candidate_name') as string
              const positionTitle = formData.get('position_title') as string
              const companyName = formData.get('company_name') as string
              const nextAction = formData.get('next_action') as string

              if (!candidateName || !positionTitle || !companyName) {
                alert('후보자명, 포지션명, 회사명은 필수입니다.')
                return
              }

              setHiringProcessCreating(true)
              try {
                const res = await fetch('/api/hiring-process', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    analysis_id: analysisId,
                    position_title: positionTitle,
                    company_name: companyName,
                    candidate_name: candidateName,
                    next_action: nextAction || '서류 검토',
                    current_stage: 0,
                    status: 'ACTIVE'
                  })
                })

                if (res.ok) {
                  alert('채용 프로세스가 추가되었습니다!')
                  setShowHiringModal(false)
                  window.location.href = '/hiring-process'
                } else {
                  const data = await res.json()
                  alert(data.error || '추가 실패')
                }
              } catch (err) {
                alert('서버 오류가 발생했습니다.')
              } finally {
                setHiringProcessCreating(false)
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  후보자명 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="candidate_name"
                  defaultValue={hiringJDInfo.candidateName || result.candidate_name || '후보자'}
                  required
                  placeholder="예: 김대리"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  회사명 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  defaultValue={hiringJDInfo.companyName}
                  required
                  placeholder="예: 네이버"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  포지션명 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="position_title"
                  defaultValue={hiringJDInfo.positionTitle}
                  required
                  placeholder="예: Product Manager"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  다음 액션 (선택)
                </label>
                <input
                  type="text"
                  name="next_action"
                  placeholder="예: 서류 검토"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowHiringModal(false)}
                  disabled={hiringProcessCreating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: hiringProcessCreating ? 'not-allowed' : 'pointer',
                    opacity: hiringProcessCreating ? 0.5 : 1
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={hiringProcessCreating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#22d3ee',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: hiringProcessCreating ? 'not-allowed' : 'pointer',
                    opacity: hiringProcessCreating ? 0.5 : 1
                  }}
                >
                  {hiringProcessCreating ? '추가 중...' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="analyze-download-wrap">
        {result.plan === 'FREE' ? (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)' }}>
              <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                📄 분석 결과는 화면에서 확인 가능하지만,<br />
                <strong>HTML 다운로드는 PRO 플랜 이상</strong>에서 제공됩니다.
              </p>
            </div>
            <button
              className="analyze-download-btn"
              onClick={() => window.location.href = '/store'}
              style={{ background: 'var(--accent)' }}
            >
              ✨ PRO 플랜으로 업그레이드 →
            </button>
          </>
        ) : (
          <button
            className="analyze-download-btn"
            onClick={() => downloadReport(result)}
          >
            ↓ HTML 리포트 다운로드
          </button>
        )}
      </div>
    </div>
  )
}

function JDResults({
  result,
  analysisItem,
  expiresAt,
  onReset,
  userType,
}: {
  result: JDResult
  analysisItem?: AnalysisListItem
  expiresAt?: string
  onReset: () => void
  userType?: string | null
}) {
  const color = REC_COLOR_HEX[result.recommendation] ?? '#888'
  const label = REC_LABEL_CONST[result.recommendation] ?? result.recommendation

  const resumeTitle = analysisItem?.result.job_title ?? result.resume_job_title ?? '이력서 분석'
  const resumeDate = analysisItem
    ? new Date(analysisItem.created_at).toLocaleDateString('ko-KR')
    : result.resume_analyzed_at
    ? new Date(result.resume_analyzed_at).toLocaleDateString('ko-KR')
    : ''

  // 제안서 저장 상태 관리
  const [proposalData, setProposalData] = useState<{ html: string; proposal: any } | null>(null)
  const [proposalGenerating, setProposalGenerating] = useState(false)
  const proposalAttempted = useRef(false)  // 무한루프 방지: 생성 시도 여부 추적
  const proposalFailureCount = useRef(0)  // Circuit Breaker: 연속 실패 횟수
  const proposalLastFailTime = useRef(0)  // Circuit Breaker: 마지막 실패 시간

  // 제안서 localStorage 키 (후보자별 + JD별로 구분)
  const proposalKey = analysisItem
    ? `proposal_resume_${analysisItem.id}_jd_${result.id}`
    : `proposal_jd_${result.id}`

  // 지원 버튼 상태
  const [applyingToJob, setApplyingToJob] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  // 지원하기 함수
  const handleApplyToJob = async () => {
    if (!result.company || !result.position) {
      alert('회사명 또는 포지션 정보가 없습니다.')
      return
    }

    if (alreadyApplied) {
      window.location.href = '/job-seeker'
      return
    }

    setApplyingToJob(true)
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: result.company,
          position: result.position,
          status: '지원 완료',
          applied_at: new Date().toISOString(),
          notes: `JD 매칭 점수: ${result.fit_score}% (${label})`
        })
      })

      if (res.ok) {
        setAlreadyApplied(true)
        alert('구직 대시보드에 추가되었습니다!')
      } else {
        const error = await res.json()
        alert(error.error || '추가 실패')
      }
    } catch (error) {
      console.error('지원 추가 실패:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setApplyingToJob(false)
    }
  }

  // 제안서 생성 함수 (Circuit Breaker + Rate Limiting)
  const generateProposal = useCallback(async () => {
    if (!analysisItem) return

    // 🔒 Circuit Breaker: 연속 3회 실패 시 5분간 차단
    if (proposalFailureCount.current >= 3) {
      const timeSinceLastFail = Date.now() - proposalLastFailTime.current
      const COOLDOWN_TIME = 5 * 60 * 1000 // 5분

      if (timeSinceLastFail < COOLDOWN_TIME) {
        const remainingMin = Math.ceil((COOLDOWN_TIME - timeSinceLastFail) / 60000)
        console.error(`[Circuit Breaker] ${remainingMin}분 후 재시도 가능`)
        alert(`제안서 생성이 일시 차단되었습니다. ${remainingMin}분 후 다시 시도해주세요.`)
        return
      } else {
        // 쿨다운 기간 지남 → 카운터 리셋
        proposalFailureCount.current = 0
      }
    }

    try {
      setProposalGenerating(true)
      const startTime = Date.now()

      console.log('[제안서 생성] 시작:', {
        analysisId: analysisItem.id,
        jdId: result.id,
        timestamp: new Date().toISOString()
      })

      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeAnalysis: analysisItem.result,
          jdAnalysis: result,
        }),
      })

      if (!res.ok) {
        throw new Error(`API 오류: ${res.status}`)
      }

      const { proposal } = await res.json()

      // HTML 생성
      const html = generateProposalHTML(proposal, analysisItem.result, result)

      // localStorage에 저장
      const dataToSave = { html, proposal }
      const key = `proposal_resume_${analysisItem.id}_jd_${result.id}`
      localStorage.setItem(key, JSON.stringify(dataToSave))
      setProposalData(dataToSave)

      // ✅ 성공 시 실패 카운터 리셋
      proposalFailureCount.current = 0

      const duration = Date.now() - startTime
      console.log('[제안서 생성] 성공:', { duration: `${duration}ms` })

    } catch (error) {
      console.error('[제안서 생성] 실패:', error)

      // 🔒 실패 카운터 증가
      proposalFailureCount.current += 1
      proposalLastFailTime.current = Date.now()

      alert(`제안서 생성에 실패했습니다. (${proposalFailureCount.current}/3)`)

      // 🚨 무한루프 방지: 에러 시에도 더미 데이터 설정
      setProposalData({
        html: '',
        proposal: {
          error: true,
          message: error instanceof Error ? error.message : '생성 실패',
          failureCount: proposalFailureCount.current
        }
      })
    } finally {
      setProposalGenerating(false)
    }
  }, [analysisItem, result])

  // 컴포넌트 마운트 시 저장된 제안서 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && analysisItem) {
      const saved = localStorage.getItem(proposalKey)
      if (saved) {
        try {
          setProposalData(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse saved proposal:', e)
        }
      }
    }
  }, [proposalKey, analysisItem])

  // 🚨🚨🚨 긴급: 제안서 자동 생성 완전 비활성화 (토큰 소모 계속 발생 중)
  useEffect(() => {
    console.log('[JDResults] 🚨 제안서 자동 생성 완전 비활성화됨 — 토큰 과금 폭주 긴급 차단')
    // 완전 비활성화 — 어떤 조건에서도 실행 안 됨
    return
  }, [])

  // 언마운트 정리도 비활성화
  // useEffect(() => {
  //   return () => {
  //     proposalAttempted.current = false
  //   }
  // }, [])

  return (
    <div className="jd-results">
      <button className="jd-back-btn" onClick={onReset} style={{ marginBottom: 16 }}>
        {analysisItem ? '← 다른 JD 분석하기' : '← 목록으로'}
      </button>

      <div className="jd-results-header">
        {/* 후보자 이름 */}
        {(() => {
          const candidateName = result.candidate_name || analysisItem?.result?.candidate_name
          return candidateName ? (
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#a78bfa',
              marginBottom: '12px',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              display: 'inline-block',
            }}>
              👤 {candidateName}
            </div>
          ) : null
        })()}
        <div className="jd-company-name">
          {result.company}
          {result.position && <span className="jd-position-tag">{result.position}</span>}
        </div>
        <div className="jd-score-row">
          <span className="jd-score" style={{ color }}>{result.fit_score ?? 0}%</span>
          <span className="jd-rec-badge" style={{ borderColor: color, color }}>{label}</span>
        </div>
        <p className="jd-verdict">{result.verdict}</p>
      </div>

      <div className="jd-ref-bar">
        기반 이력서: <strong>{resumeTitle}</strong>
        {resumeDate && <span className="jd-ref-date">{resumeDate}</span>}

        {/* 후보자 이름 뱃지 */}
        {(() => {
          // 보안: localStorage에서 읽지 않고 result에서 직접 사용
          const candidateName = analysisItem?.result?.candidate_name
          return candidateName ? (
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 600,
              marginLeft: '8px',
            }}>
              👤 {candidateName}
            </div>
          ) : null
        })()}

        {/* 제안서 생성 중 뱃지 */}
        {userType === 'HEADHUNTER' && proposalGenerating && (
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: 600,
            marginLeft: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            ⏳ 제안서 생성 중...
          </div>
        )}
      </div>

      {(result.company_insight || result.company_analysis || result.jd_interpretation) && (
        <div className="jd-context-section">
          {result.company_insight && (
            <div className="jd-context-block">
              <div className="jd-context-label">🏢 회사 인사이트</div>
              <p className="jd-context-text">{result.company_insight}</p>
            </div>
          )}

          {/* 상세 회사 분석 (NEW) */}
          {result.company_analysis && (
            <div className="jd-context-block company-analysis-section">
              <div className="jd-context-label">🏭 상세 회사 분석</div>

              {result.company_analysis.needs_more_info && result.company_analysis.info_request_message && (
                <div className="info-request-banner">
                  <span className="info-request-icon">💡</span>
                  <p className="info-request-text">{result.company_analysis.info_request_message}</p>
                </div>
              )}

              <div className="company-analysis-grid">
                {result.company_analysis.introduction !== '정보 부족' && (
                  <div className="company-item">
                    <div className="company-item-label">회사 소개</div>
                    <p className="company-item-text">{result.company_analysis.introduction}</p>
                  </div>
                )}

                {result.company_analysis.revenue !== '정보 부족' && (
                  <div className="company-item">
                    <div className="company-item-label">매출/규모</div>
                    <p className="company-item-text">{result.company_analysis.revenue}</p>
                  </div>
                )}

                {result.company_analysis.current_business !== '정보 부족' && (
                  <div className="company-item">
                    <div className="company-item-label">현재 사업</div>
                    <p className="company-item-text">{result.company_analysis.current_business}</p>
                  </div>
                )}

                {result.company_analysis.recent_trends !== '정보 부족' && (
                  <div className="company-item">
                    <div className="company-item-label">최근 동향</div>
                    <p className="company-item-text">{result.company_analysis.recent_trends}</p>
                  </div>
                )}

                {result.company_analysis.future_value !== '정보 부족' && (
                  <div className="company-item">
                    <div className="company-item-label">미래 가치</div>
                    <p className="company-item-text">{result.company_analysis.future_value}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.jd_interpretation && (
            <div className="jd-context-block">
              <div className="jd-context-label">📋 JD 해석</div>
              <p className="jd-context-text">{result.jd_interpretation}</p>
              <p className="jd-interp-caveat">
                ※ 채용공고는 회사 내부 상황(팀 구성, 채용 긴급도, 내부 평가 기준 등)에 따라 실제 요구사항이 JD 내용과 다를 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {toArr(result.pitch_points).length > 0 && (
        <div className="results-section jd-pitch-section">
          <div className="results-label">어필 전략, 제안 포인트</div>
          <ul className="jd-pitch-list">
            {toArr(result.pitch_points).map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      <div className="jd-grid">
        <div className="results-section">
          <div className="results-label">매칭 강점</div>
          <ul className="jd-match-list">
            {toArr(result.matching_points).map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div className="results-section">
          <div className="results-label">부족한 점, 리스크</div>
          {toArr(result.gaps).length > 0 ? (
            <ul className="jd-gap-list">
              {toArr(result.gaps).map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          ) : (
            <p className="jd-gap-empty">특별한 리스크가 감지되지 않았습니다.</p>
          )}
        </div>
      </div>

      <div className="jd-disclaimer">
        ※ 본 분석 결과는 입력된 채용공고(JD) 기준으로 AI가 평가한 것이며, 실제 채용 회사의 내부 기준 및 평가에 따라 결과가 다를 수 있습니다.
      </div>

      <div className="jd-ai-notice">
        <div className="jd-ai-notice-icon">🤖</div>
        <div className="jd-ai-notice-content">
          <div className="jd-ai-notice-title">AI 분석의 특성</div>
          <p className="jd-ai-notice-text">
            동일한 이력서와 동일한 JD를 분석하더라도, AI의 특성상 <strong>분석 결과의 표현과 구성이 매번 달라질 수 있습니다.</strong>
            {' '}핵심 평가(적합도 점수, 추천 등급)는 일관성을 유지하지만, 강점/리스크 분석 및 어필 전략의 구체적인 문장은 실행마다 다르게 생성됩니다.
          </p>
        </div>
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
          analysisItem.result.plan === 'FREE' ? (
            <button
              className="analyze-download-btn"
              onClick={() => window.location.href = '/store'}
              style={{ background: 'var(--accent)' }}
              title="PRO 플랜으로 업그레이드하여 HTML 다운로드 기능을 이용하세요"
            >
              ✨ PRO 업그레이드 (다운로드 잠금)
            </button>
          ) : (
            <>
              <button className="analyze-download-btn" onClick={() => downloadJDReport(result, analysisItem)}>
                ↓ HTML 리포트 다운로드
              </button>

              {/* 지원하기 버튼 */}
              {userType !== 'HEADHUNTER' && (
                <button
                  className="analyze-download-btn"
                  style={{
                    background: alreadyApplied
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff'
                  }}
                  onClick={handleApplyToJob}
                  disabled={applyingToJob}
                >
                  {applyingToJob
                    ? '⏳ 추가 중...'
                    : alreadyApplied
                    ? '✓ 대시보드 보기'
                    : '📋 구직 대시보드에 추가'}
                </button>
              )}

              {/* 수동 제안서 생성/재생성 버튼 - 🚨 항상 표시 (조건 제거) */}
              {(console.log('🔍 제안서 버튼 렌더링:', { userType, proposalData: !!proposalData }), true) && (
                <button
                  className="analyze-download-btn"
                  style={{
                    background: proposalData
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'  // 재생성: 주황색
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', // 생성: 보라색
                    color: '#fff',
                  }}
                  onClick={() => {
                    if (proposalGenerating) return

                    // 재생성 시 확인
                    if (proposalData) {
                      const isError = proposalData.proposal?.error
                      const confirmMsg = isError
                        ? '제안서 생성을 다시 시도하시겠습니까?'
                        : '제안서를 다시 생성하시겠습니까?\n\n기존 제안서는 삭제되고 새로 생성됩니다.'

                      if (!isError && !confirm(confirmMsg)) return

                      // localStorage에서 제안서 삭제
                      const key = `proposal_resume_${analysisItem.id}_jd_${result.id}`
                      localStorage.removeItem(key)

                      // proposalData 초기화
                      setProposalData(null)
                    }

                    generateProposal()
                  }}
                  disabled={proposalGenerating}
                >
                  {proposalGenerating
                    ? '⏳ 제안서 생성 중...'
                    : proposalData
                    ? proposalData.proposal?.error
                      ? '🔄 제안서 다시 생성'
                      : '🔄 제안서 재생성'
                    : '📄 후보자 제안서 생성'}
                </button>
              )}

              {/* 제안서 다운로드 버튼 (언제나 가능) */}
              {userType === 'HEADHUNTER' && proposalData && !proposalData.proposal?.error && (
                <button
                  className="analyze-download-btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                  }}
                  onClick={() => {
                    if (!proposalData || proposalData.proposal?.error) return

                    const blob = new Blob([proposalData.html], { type: 'text/html;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `후보자제안서_${proposalData.proposal.candidate_info?.name || '미상'}_${new Date().toISOString().slice(0, 10)}.html`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  📄 후보자 제안서 다운로드
                </button>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}
