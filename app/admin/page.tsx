import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/auth-helpers'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AdminClient from './AdminClient'

export const metadata = { title: 'Super Admin — Jobizic' }

export default async function AdminPage() {
  const session = await auth()
  if (!isAdmin(session)) {
    redirect('/')
  }

  const currentUserType = session?.user?.userType

  return (
    <>
      <Nav />
      <AdminClient currentUserType={currentUserType} />
      <Footer />
    </>
  )
}
