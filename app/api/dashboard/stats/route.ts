import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // 사용자 플랜 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // PRO 플랜 이상만 접근 가능
    if (userData.plan !== 'PRO' && userData.plan !== 'EXPERT') {
      return NextResponse.json(
        { error: 'PRO 플랜 이상만 이용 가능합니다.' },
        { status: 403 }
      )
    }

    // 통계 데이터 조회
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 1. 전체 후보자 수 (전체 분석 기록)
    const { count: totalCandidates } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', email)

    // 2. 이번 달 분석 건수
    const { count: thisMonthAnalyses } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', email)
      .gte('created_at', firstDayOfMonth.toISOString())

    // 3. 평균 적합도 계산 (최근 분석 기준)
    const { data: recentAnalyses } = await supabase
      .from('analyses')
      .select('result')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(50)

    let avgScore = 0
    if (recentAnalyses && recentAnalyses.length > 0) {
      const scores = recentAnalyses
        .map((a: any) => {
          try {
            const result = typeof a.result === 'string' ? JSON.parse(a.result) : a.result
            // score 또는 totalScore 필드에서 점수 추출
            return result?.score || result?.totalScore || 0
          } catch {
            return 0
          }
        })
        .filter((s: number) => s > 0)

      if (scores.length > 0) {
        avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      }
    }

    // 4. 파이프라인 단계별 카운트
    const { data: pipelineData } = await supabase
      .from('analyses')
      .select('pipeline_stage')
      .eq('user_email', email)

    const pipelineCounts = {
      pending: 0,
      screening: 0,
      interview: 0,
      final: 0,
      completed: 0,
    }

    if (pipelineData) {
      pipelineData.forEach((item: any) => {
        const stage = item.pipeline_stage || 'pending'
        if (stage in pipelineCounts) {
          pipelineCounts[stage as keyof typeof pipelineCounts]++
        }
      })
    }

    // 5. 최근 활동 (최근 5개 분석)
    const { data: recentActivity } = await supabase
      .from('analyses')
      .select('id, result, created_at, pipeline_stage')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(5)

    const activities = recentActivity?.map((item: any) => {
      let name = '익명'
      let position = '미정'
      let score = 0

      try {
        const result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result
        name = result?.name || result?.candidateName || '익명'
        position = result?.position || result?.targetPosition || '미정'
        score = result?.score || result?.totalScore || 0
      } catch {
        // 파싱 실패 시 기본값 사용
      }

      return {
        id: item.id,
        name,
        position,
        score,
        stage: item.pipeline_stage || 'pending',
        createdAt: item.created_at,
      }
    }) || []

    return NextResponse.json({
      totalCandidates: totalCandidates || 0,
      thisMonthAnalyses: thisMonthAnalyses || 0,
      avgScore,
      pipelineCounts,
      recentActivity: activities,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
