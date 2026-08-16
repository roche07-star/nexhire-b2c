import type { Metadata } from 'next'
import { Outfit, Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import dynamic from 'next/dynamic'
import './globals.css'
// import CustomCursor from '@/components/CustomCursor'
import Providers from '@/components/Providers'
import SentryInit from '@/components/SentryInit'

// Lazy load non-critical components
const ResetWarningPopup = dynamic(() => import('@/components/ResetWarningPopup'))
const UTMTracker = dynamic(() => import('@/components/UTMTracker'))

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // 300 제거 (미사용), 600/800은 700 fallback
  variable: '--font-noto',
  display: 'swap',
  preload: true, // Turbopack 안정화로 재활성화
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://jobizic.com'),
  title: {
    default: 'Jobizic — AI 이력서 분석으로 취업 성공률 UP',
    template: '%s | Jobizic'
  },
  description: 'Claude AI가 당신의 이력서를 분석하고 강점/약점을 정확히 파악합니다. 무료 체험 3회, 프로 플랜으로 무제한 분석!',
  keywords: ['이력서 분석', 'AI 이력서', '이력서 첨삭', '자기소개서 작성', '취업 준비', '이직 준비', 'AI 커리어 분석', '이력서 최적화'],
  authors: [{ name: 'Jobizic' }],
  creator: 'Jobizic',
  publisher: 'Jobizic',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://jobizic.com',
    title: 'Jobizic — AI 이력서 분석으로 취업 성공률 UP',
    description: 'Claude AI가 당신의 이력서를 분석하고 강점/약점을 정확히 파악합니다. 무료 체험 3회, 프로 플랜으로 무제한 분석!',
    siteName: 'Jobizic',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jobizic - AI 이력서 분석 서비스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobizic — AI 이력서 분석으로 취업 성공률 UP',
    description: 'Claude AI가 당신의 이력서를 분석하고 강점/약점을 정확히 파악합니다.',
    images: ['/og-image.png'],
    creator: '@jobizic',
  },
  alternates: {
    canonical: 'https://jobizic.com',
  },
  verification: {
    google: '', // Google Search Console 인증 코드 (추후 추가)
    other: {
      'naver-site-verification': '', // 네이버 웹마스터 도구 (추후 추가)
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${outfit.variable} ${notoSansKR.variable}`}>
      <head>
        {/* DNS Prefetch for faster resource loading (lightweight, no blocking) */}
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://vercel-insights.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SentryInit />
        <Providers>
          <UTMTracker />
          {/* <CustomCursor /> */}
          {children}
          <ResetWarningPopup />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
