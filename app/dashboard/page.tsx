import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import DashboardClient from './DashboardClient'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

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

  // 사용자 플랜 및 유형 확인
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan, user_type')
    .eq('email', email)
    .single()

  if (userError || !userData) {
    redirect('/login')
  }

  // 개인 구직자는 /analyze로 리다이렉트
  if (userData.user_type === 'JOBSEEKER') {
    redirect('/analyze')
  }

  // 헤드헌터는 대시보드 접근 가능 (플랜과 관계없이)
  // DashboardClient 내에서 플랜에 따라 기능 제한
  return (
    <>
      <Nav />
      <DashboardClient
        userEmail={email}
        userPlan={userData.plan}
        userType={userData.user_type}
      />
      <Footer />
    </>
  )
}
