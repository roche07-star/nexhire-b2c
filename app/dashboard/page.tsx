import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import DashboardClient from './DashboardClient'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import DashboardLoading from '@/components/DashboardLoading'

export const metadata = {
  title: 'PRO 대시보드 — Jobizic',
}

export default async function DashboardPage() {
  // 인증 확인
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const email = session.user.email

  // Super Admin은 /admin으로 리다이렉트
  if (session.user.userType === 'SUPER_ADMIN') {
    redirect('/admin')
  }

  // 세션에서 직접 가져오기 (DB 쿼리 제거)
  const plan = session.user.plan ?? 'FREE'
  const userType = session.user.userType

  // 개인 구직자는 /analyze로 리다이렉트
  if (userType === 'JOBSEEKER') {
    redirect('/analyze')
  }

  // 헤드헌터는 대시보드 접근 가능 (플랜과 관계없이)
  // DashboardClient 내에서 플랜에 따라 기능 제한
  return (
    <>
      <Nav />
      <Suspense fallback={<DashboardLoading />}>
        <DashboardClient
          userEmail={email}
          userPlan={plan}
          userType={userType}
        />
      </Suspense>
      <Footer />
    </>
  )
}
