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

    // Supabase Function 시도 (마이그레이션 완료 후 최고 성능)
    const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats', {
      p_user_email: email,
      p_first_day_of_month: firstDayOfMonth.toISOString(),
    })

    // Function이 존재하면 바로 반환 (최적화 경로)
    if (!statsError && stats) {
      console.log('✅ Using Supabase Function (optimized)')
      return NextResponse.json({
        totalCandidates: stats.totalCandidates || 0,
        thisMonthAnalyses: stats.thisMonthAnalyses || 0,
        avgScore: stats.avgScore || 0,
        pipelineCounts: stats.pipelineCounts || {
          pending: 0,
          screening: 0,
          interview: 0,
          final: 0,
          completed: 0,
        },
        recentActivity: Array.isArray(stats.recentActivity) ? stats.recentActivity : [],
      })
    }

    // Fallback: Function이 없으면 기존 방식 사용 (마이그레이션 전)
    console.log('📌 Supabase Function not found, using fallback queries')

    // 기존 병렬 쿼리 방식 (JD 활동 포함)
    const [totalCount, monthCount, avgScoreData, pipelineData, resumeActivity, jdActivity] = await Promise.all([
      supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', email),
      supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', email)
        .gte('created_at', firstDayOfMonth.toISOString()),
      supabase
        .from('analyses')
        .select('score')
        .eq('user_email', email)
        .gt('score', 0)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('analyses')
        .select('pipeline_stage')
        .eq('user_email', email),
      supabase
        .from('analyses')
        .select('id, candidate_name, position, score, created_at, pipeline_stage')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('jd_analyses')
        .select('id, result, created_at')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // 평균 점수 계산
    let avgScore = 0
    if (avgScoreData.data && avgScoreData.data.length > 0) {
      const scores = avgScoreData.data.map((a: any) => a.score || 0)
      avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    }

    // 파이프라인 카운트
    const pipelineCounts = {
      pending: 0,
      screening: 0,
      interview: 0,
      final: 0,
      completed: 0,
    }
    if (pipelineData.data) {
      pipelineData.data.forEach((item: any) => {
        const stage = item.pipeline_stage || 'pending'
        if (stage in pipelineCounts) {
          pipelineCounts[stage as keyof typeof pipelineCounts]++
        }
      })
    }

    // 최근 이력서 활동
    const resumeActivities = resumeActivity.data?.map((item: any) => ({
      id: item.id,
      type: 'resume' as const,
      name: item.candidate_name || '미정',
      position: item.position || '미정',
      score: item.score || 0,
      stage: item.pipeline_stage || 'pending',
      createdAt: item.created_at,
    })) || []

    // 최근 JD 활동
    const jdActivities = (jdActivity.data?.map((item: any) => {
      try {
        const result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result
        return {
          id: item.id,
          type: 'jd' as const,
          name: result?.candidate_name || '미정',
          position: `${result?.company || '미정'} - ${result?.position || '미정'}`,
          score: result?.fit_score || 0,
          stage: 'jd',
          createdAt: item.created_at,
        }
      } catch {
        return null
      }
    }) || []).filter((item): item is NonNullable<typeof item> => item !== null)

    // 두 활동 합치고 최신순 정렬
    const allActivities = [...resumeActivities, ...jdActivities]
      .sort((a, b) => {
        const dateB = new Date(b.createdAt).getTime()
        const dateA = new Date(a.createdAt).getTime()
        return dateB - dateA
      })
      .slice(0, 10)

    console.log('📊 Fallback stats:', {
      totalCandidates: totalCount.count || 0,
      recentActivityCount: allActivities.length,
    })

    return NextResponse.json({
      totalCandidates: totalCount.count || 0,
      thisMonthAnalyses: monthCount.count || 0,
      avgScore,
      pipelineCounts,
      recentActivity: Array.isArray(allActivities) ? allActivities : [],
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
