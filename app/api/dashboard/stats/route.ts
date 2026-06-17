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

    // 통계 데이터 조회 (Supabase Function 사용 - 단일 RPC 호출!)
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 단일 RPC 호출로 모든 통계 조회 (6개 쿼리 → 1개 RPC)
    const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats', {
      p_user_email: email,
      p_first_day_of_month: firstDayOfMonth.toISOString(),
    })

    if (statsError) {
      console.error('Dashboard stats RPC error:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      )
    }

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
      recentActivity: stats.recentActivity || [],
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
