import type { Metadata } from 'next'
import { Outfit, Noto_Sans_KR } from 'next/font/google'
import './globals.css'
// import CustomCursor from '@/components/CustomCursor'
import Providers from '@/components/Providers'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jobizic — 당신의 다음 커리어를 설계합니다',
  description: '이력서를 업로드하면 AI가 강점을 분석하고, 당신에게 맞는 커리어 방향을 구체적으로 제시합니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${outfit.variable} ${notoSansKR.variable}`}>
      <body>
        <Providers>
          {/* <CustomCursor /> */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
