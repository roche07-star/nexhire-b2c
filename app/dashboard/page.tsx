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
  if (userData.user_type === 'INDIVIDUAL') {
    redirect('/analyze')
  }

  // 헤드헌터가 아니고 PRO 플랜 미만이면 업그레이드 안내
  if (userData.user_type !== 'HEADHUNTER' && userData.plan !== 'PRO' && userData.plan !== 'EXPERT') {
    return (
      <>
        <Nav />
        <main style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, marginBottom: 20 }}>PRO 플랜 전용 기능</h1>
          <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>
            대시보드는 PRO 플랜 이상에서 이용 가능합니다.
          </p>
          <a
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#e8ff47',
              color: '#1a1a14',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            플랜 업그레이드
          </a>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav />
      <DashboardClient userEmail={email} userPlan={userData.plan} />
      <Footer />
    </>
  )
}
