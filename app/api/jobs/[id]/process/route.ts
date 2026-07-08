import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getJobStatus } from '@/lib/jobs'
import { processInterviewJob } from '@/app/api/analyze/interview/process'
import { supabase } from '@/lib/supabase'

export const maxDuration = 120  // 실제 처리는 최대 120초

/**
 * POST /api/jobs/[id]/process
 * Job 처리 시작 (Frontend에서 호출)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id: jobId } = await params
    const job = await getJobStatus(jobId, session.user.email)

    if (!job) {
      return NextResponse.json({ error: 'Job을 찾을 수 없습니다.' }, { status: 404 })
    }

    // ✅ 원자적 상태 전환: pending → processing (레이스 컨디션 방지)
    const { data: started, error: startError } = await supabase.rpc('try_start_job', {
      job_id: jobId,
      user_email: session.user.email
    })

    if (startError) {
      console.error('[jobs/process] 상태 전환 실패:', startError)
      return NextResponse.json({ error: 'Job 시작에 실패했습니다.' }, { status: 500 })
    }

    if (!started) {
      // 다른 요청이 먼저 처리 시작했거나 이미 완료됨
      return NextResponse.json({ error: '이미 처리 중이거나 완료된 Job입니다.' }, { status: 409 })
    }

    console.log(`[jobs/process] Job ${jobId} 처리 시작 (중복 차단됨)`)

    // Job 타입에 따라 처리 함수 호출
    switch (job.job_type) {
      case 'interview':
        await processInterviewJob(
          jobId,
          session.user.email,
          job.input_data.role as string ?? 'USER',
          {
            analysisId: job.input_data.analysisId as string,
            jdAnalysisId: job.input_data.jdAnalysisId as string | null | undefined,
            interviewFormat: job.input_data.interviewFormat as string | undefined,
            interviewerInfo: job.input_data.interviewerInfo as string | undefined,
            specialNotes: job.input_data.specialNotes as string | undefined,
          }
        )
        break

      case 'jd':
        // JD 분석 처리 (임시 - process.ts 완성 후 import)
        {
          const { updateJobProgress, completeJob } = await import('@/lib/jobs')
          try {
            await updateJobProgress(jobId, 1, 'JD 분석 중...')
            // TODO: processJdJob 구현
            await completeJob(jobId, { message: 'JD 분석 완료 (임시)' })
          } catch (err) {
            const { failJob } = await import('@/lib/jobs')
            await failJob(jobId, `JD 처리 실패: ${err instanceof Error ? err.message : 'Unknown'}`)
          }
        }
        break

      case 'analyze':
        // 이력서 분석 처리 (임시)
        {
          const { updateJobProgress, completeJob, failJob } = await import('@/lib/jobs')
          try {
            await updateJobProgress(jobId, 1, '이력서 분석 중...')
            // TODO: processAnalyzeJob 구현
            await completeJob(jobId, { message: '이력서 분석 완료 (임시)' })
          } catch (err) {
            await failJob(jobId, `이력서 분석 실패: ${err instanceof Error ? err.message : 'Unknown'}`)
          }
        }
        break

      case 'rewrite':
        // 리라이팅 처리 (임시)
        {
          const { updateJobProgress, completeJob, failJob } = await import('@/lib/jobs')
          try {
            await updateJobProgress(jobId, 1, '리라이팅 중...')
            // TODO: processRewriteJob 구현
            await completeJob(jobId, { message: '리라이팅 완료 (임시)' })
          } catch (err) {
            await failJob(jobId, `리라이팅 실패: ${err instanceof Error ? err.message : 'Unknown'}`)
          }
        }
        break

      default:
        return NextResponse.json({ error: '지원하지 않는 Job 타입입니다.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Job 처리 완료' })

  } catch (e) {
    console.error('[POST /api/jobs/[id]/process]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
