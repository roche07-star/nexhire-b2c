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
import CustomCursor from '@/components/CustomCursor'
import ScrollReveal from '@/components/ScrollReveal'

export default function Home() {
  return (
    <>
      <CustomCursor />
      <ScrollReveal />
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Persona />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </>
  )
}
