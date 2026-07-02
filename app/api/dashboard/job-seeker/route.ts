import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // 1. 다가올 일정 조회 (오늘부터 2주)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const twoWeeksLater = new Date(todayStart)
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)

    const { data: upcomingSchedules } = await supabase
      .from('job_schedules')
      .select('*')
      .eq('user_email', userEmail)
      .eq('is_completed', false)
      .gte('schedule_at', todayStart.toISOString())
      .lt('schedule_at', twoWeeksLater.toISOString())
      .order('schedule_at', { ascending: true })
      .limit(10)

    // 2. 지원 현황 조회 (최신순 10개)
    const { data: applications } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(10)

    // 2-1. 각 지원의 모든 일정 조회 (미완료만)
    const applicationsWithSchedules = await Promise.all(
      (applications || []).map(async (app) => {
        const { data: schedules } = await supabase
          .from('job_schedules')
          .select('*')
          .eq('application_id', app.id)
          .eq('is_completed', false)
          .gte('schedule_at', todayStart.toISOString())
          .order('schedule_at', { ascending: true })

        return {
          ...app,
          schedules: schedules || []
        }
      })
    )

    // 3. 월간 리포트 조회 (최근 1개월)
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastMonth = new Date(now)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`

    const { data: monthlyReports } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .in('month_of', [thisMonth, lastMonthStr])
      .order('month_of', { ascending: false })

    const latestReport = monthlyReports && monthlyReports.length > 0 ? monthlyReports[0] : null

    // 4. 통계 계산
    const stats = {
      totalApplications: applications?.length || 0,
      upcomingSchedulesCount: upcomingSchedules?.length || 0
    }

    return NextResponse.json({
      upcomingSchedules: upcomingSchedules || [],
      applications: applicationsWithSchedules || [],
      monthlyReport: latestReport,
      stats
    })

  } catch (error: any) {
    console.error('대시보드 데이터 조회 오류:', error)
    return NextResponse.json(
      { error: error.message || '대시보드 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
