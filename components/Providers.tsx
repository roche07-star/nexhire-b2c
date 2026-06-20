'use client'

import { SessionProvider } from 'next-auth/react'
// import UserTypeGuard from './UserTypeGuard' // 자동 설정으로 변경 (auth.ts에서 INDIVIDUAL로 자동 설정)
import { AnalysisProvider } from '@/contexts/AnalysisContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnalysisProvider>
        {children}
      </AnalysisProvider>
    </SessionProvider>
  )
}
