import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PaymentClient from './PaymentClient'
import { getProductById, type ProductId } from '@/lib/products'
import { supabase } from '@/lib/supabase'

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

  return (
    <PaymentClient
      product={product}
      userEmail={session.user.email}
    />
  )
}
