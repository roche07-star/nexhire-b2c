import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage } from '@/lib/usageLimits'
import { createJob } from '@/lib/jobs'

export const maxDuration = 10  // Job 생성만

/**
 * POST /api/analyze/rewrite
 * 이력서 리라이팅 Job 생성 (즉시 반환)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    // EXPERT 플랜 체크
    const { data: userData } = await supabase.from('users').select('plan').eq('email', email).single()
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')
    if (plan !== 'EXPERT') {
      return NextResponse.json({ error: 'EXPERT 플랜에서만 사용 가능합니다.' }, { status: 403 })
    }

    // Usage 체크
    if (role !== 'MANAGER') {
      const { allowed, limit } = await checkUsage(email, 'rewrite')
      if (!allowed) {
        return NextResponse.json(
          { error: `이번 달 이력서 리라이팅 횟수(${limit}회)를 모두 사용했습니다.` },
          { status: 403 }
        )
      }
    }

    const { analysisId, jdAnalysisId } = await req.json()
    if (!analysisId) {
      return NextResponse.json({ error: '분석 ID가 없습니다.' }, { status: 400 })
    }

    // Job 생성
    const { id: jobId, error: jobError } = await createJob(
      email,
      'rewrite',
      { analysisId, jdAnalysisId, role },
      4  // 4단계
    )

    if (jobError || !jobId) {
      return NextResponse.json({ error: 'Job 생성 실패' }, { status: 500 })
    }

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: '이력서 리라이팅을 준비했습니다.',
    })

  } catch (e) {
    console.error('[POST /api/analyze/rewrite]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
