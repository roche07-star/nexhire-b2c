import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AnalyzeClient from './AnalyzeClient'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const metadata = { title: '이력서 분석 — Nexhire' }

export default async function AnalyzePage() {
  let isPro = false

  try {
    const session = await auth()
    if (session?.user?.email) {
      const role = (session.user as { role?: string }).role ?? 'USER'
      const { data } = await supabase
        .from('users')
        .select('plan')
        .eq('email', session.user.email as string)
        .maybeSingle()
      const plan = data?.plan ?? 'FREE'
      isPro = plan === 'PRO' || plan === 'EXPERT' || role === 'MANAGER'
    }
  } catch {
    // auth/DB 에러 시 기본 렌더링
  }

  return (
    <>
      <Nav />
      <AnalyzeClient initialIsPro={isPro} />
      <Footer />
    </>
  )
}
