import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SettlementsClient from './SettlementsClient'

export const metadata = { title: '정산 관리 — Jobizic' }

export default function SettlementsPage() {
  return (
    <>
      <Nav />
      <SettlementsClient />
      <Footer />
    </>
  )
}
