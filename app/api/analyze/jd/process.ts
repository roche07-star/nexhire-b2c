/**
 * JD 분석 백그라운드 처리 함수
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { updateJobProgress, completeJob, failJob } from '@/lib/jobs'
import { incrementUsage } from '@/lib/usageLimits'
import { BASE_HEADHUNTER_ROLE, OUTPUT_RULES } from '@/lib/prompts/base-headhunter'
import { invalidateCache } from '@/lib/cache'
import { callClaude } from '@/lib/claude-client'

// jdTool 정의는 기존 route.ts에서 복사 (생략)

export async function processJdJob(
  jobId: string,
  email: string,
  role: string,
  inputData: {
    analysisId: string
    jdText: string
    company?: string
    position?: string
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

    // Step 2-4: JD 분석 (기존 로직과 동일)
    await updateJobProgress(jobId, 2, 'JD를 분석하는 중...')

    // Claude API 호출 로직 (기존 route.ts와 동일)
    // ... (생략)

    // Step 5: 결과 저장
    await updateJobProgress(jobId, 4, '결과를 저장하는 중...')

    // const resultPayload = ...
    // await supabase.from('jd_analyses').insert(...)

    // Step 6: Usage 증가 & 완료
    if (role !== 'MANAGER') {
      await incrementUsage(email, 'jd')
    }

    await invalidateCache(`jd_analyses:${email}`)
    // await completeJob(jobId, resultPayload)

  } catch (error) {
    console.error('[processJdJob] Error:', error)
    await failJob(jobId, error instanceof Error ? error.message : 'JD 분석 실패')
  }
}
