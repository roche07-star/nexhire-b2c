import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WorkReportClient from './WorkReportClient'

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
  const plan = session.user.plan ?? 'FREE'
  const userType = session.user.userType

  const isPro = plan === 'PRO' || plan === 'EXPERT'
  const isHeadhunter = userType === 'HEADHUNTER'

  return (
    <>
      <Nav />
      <WorkReportClient userEmail={session.user.email} isPro={isPro} isHeadhunter={isHeadhunter} />
      <Footer />
    </>
  )
}
