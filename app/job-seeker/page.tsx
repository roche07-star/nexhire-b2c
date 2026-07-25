import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import JobSeekerDashboardClient from './JobSeekerDashboardClient'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import DashboardLoading from '@/components/DashboardLoading'

export const metadata = {
  title: '구직자 대시보드 — JOBIZIC',
}

export default async function JobSeekerDashboardPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  return (
    <>
      <Nav />
      <Suspense fallback={<DashboardLoading />}>
        <JobSeekerDashboardClient />
      </Suspense>
      <Footer />
    </>
  )
}
