// 이력서 분석 관련 타입 정의

export interface CareerPath {
  type: 'BASELINE' | 'RECOMMENDED' | 'STRETCH'
  label: string
  title: string
  salary_range: string
  salary_bands: { period: string; min: number; max: number }[]
  points: string[]
}

export interface AnalysisResult {
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

export interface SavedAnalysis {
  result: AnalysisResult
  created_at: string
  expires_at: string
}

export interface JDResult {
  id?: string
  candidate_name?: string
  company: string
  position?: string
  fit_score: number
  recommendation: 'APPLY' | 'CONSIDER' | 'SKIP'
  verdict: string
  company_insight?: string
  // 상세 회사 분석 (NEW)
  company_analysis?: {
    introduction: string
    revenue: string
    current_business: string
    recent_trends: string
    future_value: string
    needs_more_info: boolean
    info_request_message?: string
  }
  jd_interpretation?: string
  matching_points: string[]
  gaps: string[]
  pitch_points: string[]
  resume_job_title?: string
  resume_analyzed_at?: string
  expires_at?: string
}

export interface InterviewGuideResult {
  id?: string | null
  expires_at?: string | null
  // 회사/산업 분석 (NEW)
  company_analysis?: {
    industry_structure: string
    company_background: string
    position_context: string
  }
  // 매칭 점수 (NEW)
  matching_scores?: Array<{
    category: string
    score: number
    grade: string
  }>
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
  job_title?: string | null
}

export interface SavedInterviewGuide {
  id: string
  result: InterviewGuideResult
  created_at: string
  expires_at: string
}

export interface AnalysisListItem {
  id: string
  result: AnalysisResult
  created_at: string
  expires_at: string
}

export interface SavedJDAnalysis {
  id: string
  result: JDResult
  created_at: string
  expires_at?: string | null
}

export interface RewriteResult {
  preview: string // HTML or text preview
  docx: string // base64 encoded DOCX
  filename: string
  changes: string[]
  plan: 'FREE' | 'PRO' | 'EXPERT'
}

export interface JDTemplate {
  id: string
  company: string
  position?: string
  content: string
  created_at: string
}

export type SidebarMenu = 'upload' | 'saved' | 'jd' | 'rewrite' | 'interview'

// 유틸리티 함수
export const toArr = (v: unknown): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n').filter(Boolean) : []
