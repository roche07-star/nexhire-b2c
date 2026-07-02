import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import JobSeekerDashboardClient from './JobSeekerDashboardClient'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

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
      <JobSeekerDashboardClient />
      <Footer />
    </>
  )
}
