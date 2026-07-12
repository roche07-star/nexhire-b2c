import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Persona from '@/components/Persona'
import Pricing from '@/components/Pricing'
import Faq from '@/components/Faq'
import Cta from '@/components/Cta'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import PromoBanner from '@/components/PromoBanner'

export default async function Home() {
  const session = await auth()
  const rawUserType = session?.user?.userType
  const plan = session?.user?.plan

  // 로그인된 사용자는 대시보드로 리다이렉트
  if (rawUserType === 'SUPER_ADMIN') {
    redirect('/admin')
  }
  if (rawUserType === 'HEADHUNTER' || rawUserType === 'MANAGER') {
    redirect('/dashboard')
  }
  if (rawUserType === 'JOBSEEKER' && (plan === 'PRO' || plan === 'EXPERT')) {
    redirect('/job-seeker')
  }

  // 여기까지 오면 로그인 안 했거나 JOBSEEKER (FREE)만 가능
  const userType: 'JOBSEEKER' | null = rawUserType === 'JOBSEEKER' ? 'JOBSEEKER' : null

  return (
    <>
      <ScrollReveal />
      <Nav />
      <Hero userType={userType} />
      <HowItWorks userType={userType} />
      <Features userType={userType} />
      <Persona />
      <Pricing userType={userType} />
      <Faq userType={userType} />
      <Cta userType={userType} />
      <div className="promo-banner-bottom">
        <PromoBanner />
      </div>
      <Footer />
    </>
  )
}
