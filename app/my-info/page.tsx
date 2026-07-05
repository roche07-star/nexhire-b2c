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

  // 사용자 정보 조회
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single()

  // 쿠폰 조회
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })

  return (
    <>
      <Nav />
      <MyInfoClient
        user={userData}
        coupons={coupons || []}
        userEmail={session.user.email}
      />
      <Footer />
    </>
  )
}
