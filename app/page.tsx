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
import Link from 'next/link'

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

      {/* 7월 한정 할인 배너 */}
      <div className="promo-banner">
        <div className="promo-content">
          <span className="promo-text">
            ⚡ <strong>7월 한정 특가</strong> PRO 플랜 30% 할인
            <span className="promo-price">
              <span className="price-original">9,900원</span>
              <span className="price-arrow">→</span>
              <span className="price-sale">6,930원</span>
            </span>
          </span>
          <Link href="/payment" className="promo-cta">
            지금 시작하기 →
          </Link>
        </div>
      </div>

      <Nav />
      <Hero userType={userType} />
      <HowItWorks userType={userType} />
      <Features userType={userType} />
      <Persona />
      <Pricing userType={userType} />
      <Faq userType={userType} />
      <Cta userType={userType} />
      <Footer />
    </>
  )
}
