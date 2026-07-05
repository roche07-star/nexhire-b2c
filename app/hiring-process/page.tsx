import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import HiringProcessClient from './HiringProcessClient'

export const metadata = {
  title: '채용 프로세스 관리 | Jobizic',
  description: '후보자별 진행 상황을 추적하고 다음 액션을 관리하세요.',
}

export default async function HiringProcessPage() {
  const session = await auth()

  // 로그인 체크
  if (!session?.user?.email) {
    redirect('/login')
  }

  // 헤드헌터와 Manager만 접근 가능
  if (session.user.userType !== 'HEADHUNTER' && session.user.userType !== 'MANAGER') {
    redirect('/')
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <HiringProcessClient />
      </main>
      <Footer />
    </>
  )
}
