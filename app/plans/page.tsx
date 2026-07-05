import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import PlansClient from './PlansClient'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: '플랜 정책 — Jobizic',
  description: '나에게 맞는 최적의 플랜을 선택하세요',
}

export default async function PlansPage() {
  // 인증 확인 (선택)
  const session = await auth()
  let userType: string | null = null
  let currentPlan: string = 'FREE'
  let isSuperAdminOrManager = false

  if (session?.user?.email) {
    // 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('user_type, plan')
      .eq('email', session.user.email)
      .single()

    if (userData) {
      userType = userData.user_type
      currentPlan = userData.plan
      // Super Admin 또는 Manager인 경우
      isSuperAdminOrManager = userData.user_type === 'SUPER_ADMIN' || userData.user_type === 'MANAGER'
    }
  }

  return (
    <>
      <Nav />
      <PlansClient
        userEmail={session?.user?.email || null}
        userType={userType}
        currentPlan={currentPlan}
        isSuperAdminOrManager={isSuperAdminOrManager}
      />
      <Footer />
    </>
  )
}
