import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AnalyzeClient from './AnalyzeClient'

export const metadata = { title: '이력서 분석 — Nexhire' }

export default function AnalyzePage() {
  return (
    <>
      <Nav />
      <AnalyzeClient />
      <Footer />
    </>
  )
}
