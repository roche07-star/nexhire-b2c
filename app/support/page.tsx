import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SupportClient from './SupportClient'

export const metadata = { title: '고객센터 — Jobizic' }

export default async function SupportPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  return (
    <>
      <Nav />
      <SupportClient />
      <Footer />
    </>
  )
}
