import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '본인인증 테스트 | Jobizic',
  description: 'KG 이니시스 통합인증 서비스 테스트 페이지',
  robots: 'noindex, nofollow', // 검색 엔진 차단
}

export default function VerificationTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
