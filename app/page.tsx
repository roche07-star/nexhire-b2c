import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ScrollReveal from '@/components/ScrollReveal'

// 첫 화면 이후 컴포넌트는 lazy loading
const HowItWorks = dynamic(() => import('@/components/HowItWorks'))
const Features = dynamic(() => import('@/components/Features'))
const Persona = dynamic(() => import('@/components/Persona'))
const Pricing = dynamic(() => import('@/components/Pricing'))
const Faq = dynamic(() => import('@/components/Faq'))
const Cta = dynamic(() => import('@/components/Cta'))
const Footer = dynamic(() => import('@/components/Footer'))
const PromoBanner = dynamic(() => import('@/components/PromoBanner'))

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
