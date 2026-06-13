import { auth } from '@/auth'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Persona from '@/components/Persona'
import Pricing from '@/components/Pricing'
import Faq from '@/components/Faq'
import Cta from '@/components/Cta'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import type { UserType } from '@/types/user'

export default async function Home() {
  const session = await auth()
  const userType: UserType | null | undefined = session?.user?.userType

  return (
    <>
      <ScrollReveal />
      <Nav />
      <Hero userType={userType} />
      <Stats />
      <HowItWorks userType={userType} />
      <Features userType={userType} />
      <Persona />
      <Pricing userType={userType} />
      <Faq />
      <Cta userType={userType} />
      <Footer />
    </>
  )
}
