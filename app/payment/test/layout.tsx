import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '결제 테스트 | Jobizic',
  description: 'NHN KCP 결제 서비스 테스트 페이지',
  robots: 'noindex, nofollow', // 검색 엔진 차단
}

export default function PaymentTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
