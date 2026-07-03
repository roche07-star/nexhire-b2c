import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StoreClient from './StoreClient'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

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

  const { data } = await supabase
    .from('store_posts')
    .select('id, title, content, author_name, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <Nav />
      <StoreClient initialPosts={data ?? []} isManager={isManager} />
      <Footer />
    </>
  )
}
