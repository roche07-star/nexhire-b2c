import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StoreClient from './StoreClient'
import { auth } from '@/auth'
import { getPaymentGatewayMode } from '@/lib/payment-gateway'

export const metadata = { title: 'STORE — Jobizic' }

export default async function StorePage() {
  let isManager = false
  let userEmail: string | null = null
  let userName: string | null = null

  try {
    const session = await auth()
    if (session?.user) {
      isManager = (session.user as { role?: string }).role === 'MANAGER'
      userEmail = session.user.email || null
      userName = session.user.name || null
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
        paymentGateway={gateway}
      />
      <Footer />
    </>
  )
}
