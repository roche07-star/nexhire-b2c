import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SettlementsClient from './SettlementsClient'

export const metadata = { title: '정산 관리 — Jobizic' }

// 정산 Skeleton (Option 3)
function SettlementsSkeleton() {
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
        정산 내역 로딩 중...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

export default function SettlementsPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<SettlementsSkeleton />}>
        <SettlementsClient />
      </Suspense>
      <Footer />
    </>
  )
}
