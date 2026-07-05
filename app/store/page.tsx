import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StoreClient from './StoreClient'
import { auth } from '@/auth'

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

  return (
    <>
      <Nav />
      <StoreClient isManager={isManager} userEmail={userEmail} userName={userName} />
      <Footer />
    </>
  )
}
