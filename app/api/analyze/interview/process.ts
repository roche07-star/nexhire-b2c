/**
 * 면접 가이드 생성 백그라운드 처리 함수
 * 기존 route.ts의 로직을 분리
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { updateJobProgress, completeJob, failJob } from '@/lib/jobs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return []
}

// interviewTool 정의는 기존과 동일
// (route.ts에서 복사)

export async function processInterviewJob(
  jobId: string,
  email: string,
  role: string,
  inputData: {
    analysisId: string
    jdAnalysisId?: string | null
    interviewFormat?: string
    interviewerInfo?: string
    specialNotes?: string
  }
): Promise<void> {
  try {
    // Step 1: 이력서 분석 조회
    await updateJobProgress(jobId, 1, '이력서 분석 결과를 확인하는 중...')

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', inputData.analysisId)
      .eq('user_email', email)
      .single()

    if (!row) {
      await failJob(jobId, '분석을 찾을 수 없습니다.')
      return
    }

    // Step 2: JD 분석 조회 (있는 경우)
    await updateJobProgress(jobId, 2, 'JD 분석 결과를 확인하는 중...')

    let jdContext: Record<string, unknown> | null = null
    if (inputData.jdAnalysisId) {
      const { data: jdRow } = await supabase
        .from('jd_analyses')
        .select('result')
        .eq('id', inputData.jdAnalysisId)
        .eq('user_email', email)
        .single()
      if (jdRow?.result) jdContext = jdRow.result as Record<string, unknown>
    }

    // Step 3: 회사 분석 정보 준비
    await updateJobProgress(jobId, 3, '회사 정보를 준비하는 중...')

    const a = row.result as Record<string, unknown>
    const careerSummary = Array.isArray(a.career_paths)
      ? (a.career_paths as Array<{ type: string; title: string; salary_range: string }>)
          .map(p => `${p.type}: ${p.title} (${p.salary_range})`)
          .join(' | ')
      : ''

    const candidateProfile = `직무: ${(a.job_title as string) ?? '미상'}
종합 요약: ${(a.summary as string) ?? ''}
핵심 강점: ${toArr(a.strengths).join(' / ')}
개선 필요: ${toArr(a.improvements).join(' / ')}
핵심 키워드: ${toArr(a.keywords).join(', ')}
${careerSummary ? `커리어 경로: ${careerSummary}` : ''}`

    // Step 4: Claude API 호출
    await updateJobProgress(jobId, 4, '면접 가이드를 생성하는 중... (60-90초 소요)')

    // 프롬프트 생성 로직은 기존과 동일
    // (route.ts에서 복사)

    // 여기서는 간략화를 위해 생략하고 실제 구현 시 전체 복사

    // Step 5: 결과 저장
    await updateJobProgress(jobId, 6, '결과를 저장하는 중...')

    // const resultPayload = ...
    // await supabase.from('interview_guides').insert(...)

    // Step 6: Job 완료
    await updateJobProgress(jobId, 7, '완료!')
    // await completeJob(jobId, resultPayload)

  } catch (error) {
    console.error('[processInterviewJob] Error:', error)
    await failJob(jobId, error instanceof Error ? error.message : '면접 가이드 생성 실패')
  }
}
