// 채용 파이프라인 타입 정의 (Eve 스타일)

export type PipelineStage =
  | 'DOCUMENT_PREP'      // 서류 준비
  | 'DOCUMENT_REVIEW'    // 서류 진행
  | 'INTERVIEW_1ST'      // 1차 면접
  | 'INTERVIEW_2ND'      // 2차 면접
  | 'SALARY_NEGOTIATION' // 처우 협상
  | 'PASSED'             // 합격
  | 'FAILED'             // 불합격

export interface PipelineCandidate {
  id: string
  user_email: string
  candidate_name: string
  company_name: string
  position_title: string
  stage: PipelineStage

  // 분석 연동
  analysis_id?: string | null
  jd_analysis_id?: string | null

  // 매칭 정보
  fit_score?: number | null
  resume_title?: string | null

  // 메모 & 액션
  notes?: string | null
  next_action?: string | null
  next_action_date?: string | null

  // 합격 정보
  hired_date?: string | null
  fee?: number | null
  salary?: number | null

  created_at: string
  updated_at: string
}

export interface CreatePipelineCandidateInput {
  candidate_name: string
  company_name: string
  position_title: string
  analysis_id?: string
  jd_analysis_id?: string
  fit_score?: number
  resume_title?: string
  notes?: string
  next_action?: string
  next_action_date?: string
}

export interface UpdatePipelineCandidateInput {
  stage?: PipelineStage
  notes?: string
  next_action?: string
  next_action_date?: string
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  DOCUMENT_PREP: '서류 준비',
  DOCUMENT_REVIEW: '서류 진행',
  INTERVIEW_1ST: '1차 면접',
  INTERVIEW_2ND: '2차 면접',
  SALARY_NEGOTIATION: '처우 협상',
  PASSED: '합격',
  FAILED: '불합격',
}

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  DOCUMENT_PREP: '#a78bfa',      // 보라
  DOCUMENT_REVIEW: '#fbbf24',    // 노랑
  INTERVIEW_1ST: '#fb923c',      // 주황
  INTERVIEW_2ND: '#22d3ee',      // 청록
  SALARY_NEGOTIATION: '#3b82f6', // 파랑
  PASSED: '#10b981',             // 녹색
  FAILED: '#ef4444',             // 빨강
}

// 단계 순서 (드래그 앤 드롭용)
export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'DOCUMENT_PREP',
  'DOCUMENT_REVIEW',
  'INTERVIEW_1ST',
  'INTERVIEW_2ND',
  'SALARY_NEGOTIATION',
  'PASSED',
  'FAILED',
]
