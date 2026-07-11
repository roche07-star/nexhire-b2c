import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AnalyzeClient from './AnalyzeClient'
import ConsentGuard from '@/components/ConsentGuard'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const metadata = { title: '이력서 분석 — Jobizic' }

// 간단하고 빠른 Skeleton (Option 3)
function AnalyzeSkeleton() {
  return (
    <main className="analyze-page">
      <div className="analyze-layout">
        <div className="analyze-main">
          <div className="analyze-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(167,139,250,0.3)',
              borderTopColor: '#a78bfa',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              로딩 중...
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    </main>
  )
}

export default async function AnalyzePage() {
  let isPro = false
  let isExpert = false
  let userEmail: string | null = null
  let userType: string | null = null

  try {
    const session = await auth()
    if (session?.user?.email) {
      userEmail = session.user.email
      const role = (session.user as { role?: string }).role ?? 'USER'
      const { data } = await supabase
        .from('users')
        .select('plan, user_type')
        .eq('email', userEmail)
        .maybeSingle()
      const plan = data?.plan ?? 'FREE'
      userType = data?.user_type ?? null
      isExpert = plan === 'EXPERT' || role === 'MANAGER'
      isPro = plan === 'PRO' || isExpert
    }
  } catch {
    // auth/DB 에러 시 기본 렌더링
  }

  return (
    <ConsentGuard>
      <Nav />
      <Suspense fallback={<AnalyzeSkeleton />}>
        <AnalyzeClient
          initialIsPro={isPro}
          initialIsExpert={isExpert}
          userEmail={userEmail}
          userType={userType}
        />
      </Suspense>
      <Footer />
    </ConsentGuard>
  )
}
