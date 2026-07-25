import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WorkReportClient from './WorkReportClient'
import { supabase } from '@/lib/supabase'
import { PLAN_LIMITS } from '@/lib/constants/planLimits'
import type { Plan, UserType } from '@/lib/constants/planLimits'

export const metadata: Metadata = {
  title: '업무 Report | JOBIZIC',
  description: '주간/월간 업무 보고서 작성 및 이력서 반영',
}

export default async function WorkReportPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login')
  }

  // 세션에서 직접 가져오기 (DB 쿼리 제거)
  const plan = (session.user.plan ?? 'FREE') as Plan
  const userType = (session.user.userType ?? 'JOBSEEKER') as UserType

  const isPro = plan === 'PRO' || plan === 'EXPERT'
  const isHeadhunter = userType === 'HEADHUNTER'

  // 주간/월간 Report 사용량 조회
  const { data: userData } = await supabase
    .from('users')
    .select('weekly_report_count, monthly_report_count, monthly_reset_at')
    .eq('email', session.user.email)
    .single()

  const weeklyReportCount = userData?.weekly_report_count ?? 0
  const monthlyReportCount = userData?.monthly_report_count ?? 0

  const weeklyLimit = PLAN_LIMITS[userType][plan].weekly_report
  const monthlyLimit = PLAN_LIMITS[userType][plan].monthly_report

  const weeklyRemaining = Math.max(0, weeklyLimit - weeklyReportCount)
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyReportCount)

  return (
    <>
      <Nav />
      <WorkReportClient
        userEmail={session.user.email}
        isPro={isPro}
        isHeadhunter={isHeadhunter}
        userPlan={plan}
        weeklyReportRemaining={weeklyRemaining}
        monthlyReportRemaining={monthlyRemaining}
      />
      <Footer />
    </>
  )
}
