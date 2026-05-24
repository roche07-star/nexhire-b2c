import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AdminClient from './AdminClient'

export const metadata = { title: '관리자 — Nexhire' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    redirect('/')
  }

  const { data: users } = await supabase
    .from('users')
    .select('email, name, image, plan, analyze_count, analyze_reset_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <Nav />
      <AdminClient users={users ?? []} />
      <Footer />
    </>
  )
}
