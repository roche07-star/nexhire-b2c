import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getProductById, type ProductId } from '@/lib/products'
import { supabase } from '@/lib/supabase'
import { getPaymentGatewayMode } from '@/lib/payment-gateway'

const PaymentLoading = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(167,139,250,0.3)',
        borderTopColor: '#a78bfa',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 20px'
      }} />
      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>결제 페이지 로딩 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
)

const TossPaymentClient = dynamic(() => import('./TossPaymentClient'), {
  loading: PaymentLoading
})

const PortOnePaymentClient = dynamic(() => import('./PortOnePaymentClient'), {
  loading: PaymentLoading
})

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/payment')
  }

  // Manager/Super Admin 체크
  const { data: userData } = await supabase
    .from('users')
    .select('user_type')
    .eq('email', session.user.email)
    .single()

  if (userData?.user_type === 'SUPER_ADMIN' || userData?.user_type === 'MANAGER') {
    redirect('/plans')
  }

  const params = await searchParams
  const productId = params.product as ProductId | undefined

  if (!productId) {
    redirect('/plans')
  }

  const product = getProductById(productId)

  if (!product) {
    redirect('/plans')
  }

  // 결제 게이트웨이 모드 확인
  const gateway = await getPaymentGatewayMode()

  console.log('[Payment Page] Gateway mode:', gateway)
  console.log('[Payment Page] Product:', productId)

  // 모드에 따라 다른 결제 클라이언트 렌더링
  if (gateway === 'TOSS') {
    console.log('[Payment Page] Using TossPaymentClient')
    return (
      <TossPaymentClient
        product={product}
        userEmail={session.user.email}
      />
    )
  } else {
    console.log('[Payment Page] Using PortOnePaymentClient')
    return (
      <PortOnePaymentClient
        product={product}
        userEmail={session.user.email}
      />
    )
  }
}
