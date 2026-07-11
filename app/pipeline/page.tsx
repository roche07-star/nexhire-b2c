import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import PipelineClient from './PipelineClient'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: '파이프라인 관리 — Jobizic',
}

// 파이프라인 Skeleton (Option 3)
function PipelineSkeleton() {
  return (
    <main style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
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
        파이프라인 로딩 중...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

export default async function PipelinePage() {
  // 인증 확인
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const email = session.user.email

  // 세션에서 직접 가져오기 (DB 쿼리 제거)
  const plan = session.user.plan ?? 'FREE'

  // PRO 플랜 이상만 접근 가능
  if (plan !== 'PRO' && plan !== 'EXPERT') {
    return (
      <>
        <Nav />
        <main style={{ padding: '80px 20px', textAlign: 'center', background: '#fafafa', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 32, marginBottom: 20 }}>PRO 플랜 전용 기능</h1>
          <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>
            파이프라인 관리는 PRO 플랜 이상에서 이용 가능합니다.
          </p>
          <a
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#1a1a14',
              color: '#e8ff47',
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
      <Suspense fallback={<PipelineSkeleton />}>
        <PipelineClient userEmail={email} userPlan={plan} />
      </Suspense>
      <Footer />
    </>
  )
}
