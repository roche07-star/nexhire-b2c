import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createJob } from '@/lib/jobs'

export const maxDuration = 10  // Job 생성만

/**
 * POST /api/analyze
 * 이력서 분석 Job 생성 (즉시 반환)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { resumeText } = await req.json()
    if (!resumeText?.trim()) {
      return NextResponse.json({ error: '이력서 내용이 없습니다.' }, { status: 400 })
    }

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    // Job 생성
    const { id: jobId, error: jobError } = await createJob(
      email,
      'analyze',
      { resumeText, role },
      5  // 5단계
    )

    if (jobError || !jobId) {
      return NextResponse.json({ error: 'Job 생성 실패' }, { status: 500 })
    }

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: '이력서 분석을 준비했습니다.',
    })

  } catch (e) {
    console.error('[POST /api/analyze]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
