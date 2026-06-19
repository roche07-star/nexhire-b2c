/**
 * 백그라운드 Job 관리 라이브러리
 */

import { supabase } from './supabase'

export type JobType = 'analyze' | 'jd' | 'rewrite' | 'interview'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  user_email: string
  job_type: JobType
  status: JobStatus
  input_data: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  progress_message?: string
  progress_step: number
  progress_total: number
  created_at: string
  updated_at: string
  completed_at?: string
  expires_at?: string
}

/**
 * Job 생성
 */
export async function createJob(
  userEmail: string,
  jobType: JobType,
  inputData: Record<string, unknown>,
  progressTotal = 7
): Promise<{ id: string; error?: string }> {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30일 후 자동 삭제

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_email: userEmail,
        job_type: jobType,
        status: 'pending',
        input_data: inputData,
        progress_step: 0,
        progress_total: progressTotal,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createJob] Error:', error)
      return { id: '', error: error.message }
    }

    return { id: data.id }
  } catch (e) {
    console.error('[createJob] Exception:', e)
    return { id: '', error: 'Job 생성 실패' }
  }
}

/**
 * Job 진행 상황 업데이트
 */
export async function updateJobProgress(
  jobId: string,
  step: number,
  message: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'processing',
        progress_step: step,
        progress_message: message,
      })
      .eq('id', jobId)

    if (error) {
      console.error('[updateJobProgress] Error:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('[updateJobProgress] Exception:', e)
    return false
  }
}

/**
 * Job 완료
 */
export async function completeJob(
  jobId: string,
  result: Record<string, unknown>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
        progress_step: -1, // 완료 표시
      })
      .eq('id', jobId)

    if (error) {
      console.error('[completeJob] Error:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('[completeJob] Exception:', e)
    return false
  }
}

/**
 * Job 실패
 */
export async function failJob(jobId: string, errorMessage: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) {
      console.error('[failJob] Error:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('[failJob] Exception:', e)
    return false
  }
}

/**
 * Job 상태 조회
 */
export async function getJobStatus(
  jobId: string,
  userEmail: string
): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_email', userEmail)
      .single()

    if (error) {
      console.error('[getJobStatus] Error:', error)
      return null
    }

    return data as Job
  } catch (e) {
    console.error('[getJobStatus] Exception:', e)
    return null
  }
}

/**
 * 사용자의 최근 Job 목록 조회
 */
export async function getUserJobs(
  userEmail: string,
  jobType?: JobType,
  limit = 10
): Promise<Job[]> {
  try {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (jobType) {
      query = query.eq('job_type', jobType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getUserJobs] Error:', error)
      return []
    }

    return (data as Job[]) ?? []
  } catch (e) {
    console.error('[getUserJobs] Exception:', e)
    return []
  }
}
