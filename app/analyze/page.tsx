import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AnalyzeClient from './AnalyzeClient'
import { auth } from '@/auth'

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
  let role: string = 'USER'

  try {
    const session = await auth()
    if (session?.user?.email) {
      userEmail = session.user.email
      // 세션에서 직접 가져오기 (DB 쿼리 제거)
      const plan = session.user.plan ?? 'FREE'
      userType = session.user.userType ?? null
      role = session.user.role ?? 'USER'
      isExpert = plan === 'EXPERT' || role === 'MANAGER'
      isPro = plan === 'PRO' || isExpert
    }
  } catch {
    // auth 에러 시 기본 렌더링
  }

  return (
    <>
      <Nav />
      <Suspense fallback={<AnalyzeSkeleton />}>
        <AnalyzeClient
          initialIsPro={isPro}
          initialIsExpert={isExpert}
          userEmail={userEmail}
          userType={userType}
          userRole={role}
        />
      </Suspense>
      <Footer />
    </>
  )
}
