import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TossPaymentClient from './TossPaymentClient'
import PortOnePaymentClient from './PortOnePaymentClient'
import { getProductById, type ProductId } from '@/lib/products'
import { supabase } from '@/lib/supabase'
import { getPaymentGatewayMode } from '@/lib/payment-gateway'

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/payment')
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

  // 모드에 따라 다른 결제 클라이언트 렌더링
  const PaymentComponent = gateway === 'TOSS' ? TossPaymentClient : PortOnePaymentClient

  return (
    <PaymentComponent
      product={product}
      userEmail={session.user.email}
    />
  )
}
