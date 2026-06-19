import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { checkUsage } from '@/lib/usageLimits'
import { createJob } from '@/lib/jobs'

export const maxDuration = 10  // Job 생성만

/**
 * POST /api/analyze/jd
 * JD 분석 Job 생성 (즉시 반환)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email
    const userRole = (session.user as { role?: string }).role ?? 'USER'

    // 쿠폰 체크
    let jdCouponId: string | null = null
    if (userRole !== 'MANAGER') {
      const { data: jdCoupons } = await supabase
        .from('coupons')
        .select('id, expires_at')
        .eq('claimed_by', email)
        .eq('feature', 'jd')
        .is('used_at', null)
      const now = new Date()
      const valid = (jdCoupons ?? []).find(c => !c.expires_at || new Date(c.expires_at) > now)
      if (valid) jdCouponId = valid.id
    }

    // Usage 체크
    if (userRole !== 'MANAGER' && !jdCouponId) {
      const { allowed, limit } = await checkUsage(email, 'jd')
      if (!allowed) {
        const msg = limit === 0
          ? 'JD 적합도 분석은 PRO 이상 플랜에서 이용 가능합니다.'
          : `이번 달 JD 분석 횟수(${limit}회)를 모두 사용했습니다.`
        return NextResponse.json({ error: msg }, { status: 403 })
      }
    }

    const { company, position, jd, analysisResult, client_comment } = await req.json()
    if (!company?.trim() || !jd?.trim()) {
      return NextResponse.json({ error: '회사명과 채용공고 내용을 입력해 주세요.' }, { status: 400 })
    }
    if (!analysisResult) {
      return NextResponse.json({ error: '분석할 이력서를 선택해 주세요.' }, { status: 400 })
    }

    // Job 생성
    const { id: jobId, error: jobError } = await createJob(
      email,
      'jd',
      {
        company,
        position,
        jd,
        analysisResult,
        client_comment,
        jdCouponId,
        role: userRole,
      },
      4  // 4단계
    )

    if (jobError || !jobId) {
      return NextResponse.json({ error: 'Job 생성 실패' }, { status: 500 })
    }

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: 'JD 분석을 준비했습니다.',
    })

  } catch (e) {
    console.error('[POST /api/analyze/jd]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
