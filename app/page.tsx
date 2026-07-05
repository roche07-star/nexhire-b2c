import { auth } from '@/auth'
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
import type { RegularUserType } from '@/types/user'

export default async function Home() {
  const session = await auth()
  const rawUserType = session?.user?.userType
  // 관리자는 일반 사용자 화면에서 null로 처리
  const userType: RegularUserType | null =
    rawUserType === 'JOBSEEKER' || rawUserType === 'HEADHUNTER' ? rawUserType : null

  return (
    <>
      <ScrollReveal />

      {/* 7월 한정 할인 배너 - 일반 구직자 */}
      {userType !== 'HEADHUNTER' && (
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
      )}

      {/* 7월 한정 할인 배너 - 헤드헌터 */}
      {userType === 'HEADHUNTER' && (
        <div className="promo-banner">
          <div className="promo-content">
            <span className="promo-text">
              ⚡ <strong>7월 한정 특가</strong> PRO 플랜 30% 할인
              <span className="promo-price">
                <span className="price-original">19,900원</span>
                <span className="price-arrow">→</span>
                <span className="price-sale">13,930원</span>
              </span>
            </span>
            <Link href="/payment" className="promo-cta">
              지금 시작하기 →
            </Link>
          </div>
        </div>
      )}

      <Nav />
      <Hero userType={userType} />
      <HowItWorks userType={userType} />
      <Features userType={userType} />
      {userType !== 'HEADHUNTER' && <Persona />}
      <Pricing userType={userType} />
      <Faq userType={userType} />
      <Cta userType={userType} />
      <Footer />
    </>
  )
}
