import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth-helpers'
import dynamic from 'next/dynamic'

const SettlementsClient = dynamic(() => import('./SettlementsClient'), {
  loading: () => (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(167,139,250,0.3)',
        borderTopColor: '#a78bfa',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 20px'
      }} />
      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>정산 데이터 로딩 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export const metadata = {
  title: '정산 관리 — Jobizic Admin',
}

export default async function SettlementsPage() {
  const session = await auth()

  if (!session?.user || !isSuperAdmin(session)) {
    redirect('/admin')
  }

  return <SettlementsClient />
}
