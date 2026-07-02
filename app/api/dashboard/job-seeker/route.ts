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

    // 날짜 계산
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const twoWeeksLater = new Date(todayStart)
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastMonth = new Date(now)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`

    // 병렬 쿼리 실행 (3개 쿼리를 동시에)
    const [
      { data: upcomingSchedules },
      { data: applications },
      { data: monthlyReports }
    ] = await Promise.all([
      // 1. 다가올 일정 조회
      supabase
        .from('job_schedules')
        .select('*')
        .eq('user_email', userEmail)
        .eq('is_completed', false)
        .gte('schedule_at', todayStart.toISOString())
        .lt('schedule_at', twoWeeksLater.toISOString())
        .order('schedule_at', { ascending: true })
        .limit(10),

      // 2. 지원 현황 조회
      supabase
        .from('job_applications')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(10),

      // 3. 월간 리포트 조회
      supabase
        .from('monthly_reports')
        .select('*')
        .eq('user_email', userEmail)
        .in('month_of', [thisMonth, lastMonthStr])
        .order('month_of', { ascending: false })
    ])

    // 2-1. 모든 application의 일정을 한 번에 조회 (N+1 문제 해결)
    let allSchedules: any[] = []
    if (applications && applications.length > 0) {
      const applicationIds = applications.map(app => app.id)
      const { data: schedules } = await supabase
        .from('job_schedules')
        .select('*')
        .in('application_id', applicationIds)
        .eq('is_completed', false)
        .gte('schedule_at', todayStart.toISOString())
        .order('schedule_at', { ascending: true })

      allSchedules = schedules || []
    }

    // JavaScript에서 application별로 일정 그룹화
    const applicationsWithSchedules = (applications || []).map(app => ({
      ...app,
      schedules: allSchedules.filter(s => s.application_id === app.id)
    }))

    const latestReport = monthlyReports && monthlyReports.length > 0 ? monthlyReports[0] : null

    // 4. 월간 리포트가 있으면 해당 아이디어도 조회
    let reportIdeas = null
    if (latestReport) {
      const { data: ideasData } = await supabase
        .from('work_report_ideas')
        .select('ideas')
        .eq('user_email', userEmail)
        .eq('month_of', latestReport.month_of)
        .single()

      reportIdeas = ideasData?.ideas || null
    }

    // 5. 통계 계산
    const stats = {
      totalApplications: applications?.length || 0,
      upcomingSchedulesCount: upcomingSchedules?.length || 0
    }

    return NextResponse.json({
      upcomingSchedules: upcomingSchedules || [],
      applications: applicationsWithSchedules || [],
      monthlyReport: latestReport,
      reportIdeas,
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
