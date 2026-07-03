import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StoreClient from './StoreClient'
import { auth } from '@/auth'

export const metadata = { title: 'STORE — Jobizic' }

export default async function StorePage() {
  let isManager = false

  try {
    const session = await auth()
    if (session?.user) {
      isManager = (session.user as { role?: string }).role === 'MANAGER'
    }
  } catch {
    // ignore auth errors
  }

  return (
    <>
      <Nav />
      <StoreClient isManager={isManager} />
      <Footer />
    </>
  )
}
