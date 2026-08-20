import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import dynamic from 'next/dynamic'
import { auth } from '@/auth'
import { getPaymentGatewayMode } from '@/lib/payment-gateway'
import { supabase } from '@/lib/supabase'

const StoreClient = dynamic(() => import('./StoreClient'), {
  loading: () => (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(167,139,250,0.3)',
        borderTopColor: '#a78bfa',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 20px'
      }} />
      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>스토어 로딩 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export const metadata = { title: 'STORE — Jobizic' }

export default async function StorePage() {
  let isManager = false
  let userEmail: string | null = null
  let userName: string | null = null
  let userType: string | null = null

  try {
    const session = await auth()
    if (session?.user) {
      isManager = (session.user as { role?: string }).role === 'MANAGER'
      userEmail = session.user.email || null
      userName = session.user.name || null

      // user_type 조회
      if (userEmail) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_type')
          .eq('email', userEmail)
          .single()

        userType = userData?.user_type || null
      }
    }
  } catch {
    // ignore auth errors
  }

  // 결제 게이트웨이 모드 확인
  const gateway = await getPaymentGatewayMode()
  console.log('[Store Page] Gateway mode:', gateway)

  return (
    <>
      <Nav />
      <StoreClient
        isManager={isManager}
        userEmail={userEmail}
        userName={userName}
        userType={userType}
        paymentGateway={gateway}
      />
      <Footer />
    </>
  )
}
