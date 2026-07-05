import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AdminClient from './AdminClient'

export const metadata = { title: 'Super Admin — Jobizic' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    redirect('/')
  }

  return (
    <>
      <Nav />
      <AdminClient />
      <Footer />
    </>
  )
}
