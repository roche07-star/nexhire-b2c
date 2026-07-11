import { redirect } from 'next/navigation'
import { auth } from '@/auth'
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
    // 세션에서 직접 가져오기 (DB 쿼리 제거)
    userType = session.user.userType ?? null
    currentPlan = session.user.plan ?? 'FREE'
    // Super Admin 또는 Manager인 경우
    isSuperAdminOrManager = userType === 'SUPER_ADMIN' || userType === 'MANAGER'
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
