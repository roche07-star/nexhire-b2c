// 채용 프로세스 관리 타입 정의

export type HiringProcessStage = 0 | 1 | 2 | 3 | 4 | 5 // 0: 서류, 1: 1차, 2: 2차, 3: 최종, 4: 합격, 5: 처우협의
export type HiringProcessStatus = 'ACTIVE' | 'PASSED' | 'FAILED' | 'HIRED'

export interface HiringProcess {
  id: string
  user_email: string
  analysis_id?: string | null
  jd_analysis_id?: string | null
  position_title: string
  company_name: string
  candidate_name: string
  current_stage: HiringProcessStage
  status: HiringProcessStatus
  next_action?: string | null
  next_action_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreateHiringProcessInput {
  analysis_id?: string
  jd_analysis_id?: string
  position_title: string
  company_name: string
  candidate_name: string
  current_stage?: HiringProcessStage
  status?: HiringProcessStatus
  next_action?: string
  next_action_date?: string
  notes?: string
}

export interface UpdateHiringProcessInput {
  current_stage?: HiringProcessStage
  status?: HiringProcessStatus
  next_action?: string
  next_action_date?: string
  notes?: string
}

export const STAGE_LABELS: Record<HiringProcessStage, string> = {
  0: '서류',
  1: '1차 면접',
  2: '2차 면접',
  3: '최종 면접',
  4: '처우 협의',
  5: '합격',
}

export const STATUS_LABELS: Record<HiringProcessStatus, string> = {
  ACTIVE: '진행 중',
  PASSED: '합격',
  FAILED: '탈락',
  HIRED: '입사',
}

export const STAGE_COLORS: Record<HiringProcessStage, string> = {
  0: '#a78bfa', // 보라
  1: '#fbbf24', // 노랑
  2: '#fb923c', // 주황
  3: '#22d3ee', // 청록
  4: '#3b82f6', // 파랑 (처우 협의)
  5: '#10b981', // 녹색 (합격)
}
