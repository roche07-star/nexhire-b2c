import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import MyInfoClient from './MyInfoClient'

export const metadata = {
  title: '내 정보 — Jobizic',
}

export default async function MyInfoPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  // 쿠폰 조회 (claimed_by로 조회)
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('claimed_by', session.user.email)
    .order('created_at', { ascending: false })

  // 결제 내역 조회 (모든 구매 내역: STORE + 플랜 구독)
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_email', session.user.email)
    .order('paid_at', { ascending: false })

  return (
    <>
      <Nav />
      <MyInfoClient
        coupons={coupons || []}
        payments={payments || []}
      />
      <Footer />
    </>
  )
}
