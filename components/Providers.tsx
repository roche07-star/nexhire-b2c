'use client'

import { SessionProvider } from 'next-auth/react'
import UserTypeGuard from './UserTypeGuard'
import { AnalysisProvider } from '@/contexts/AnalysisContext'
import SentryUserContext from './SentryUserContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserContext />
      <AnalysisProvider>
        <UserTypeGuard>
          {children}
        </UserTypeGuard>
      </AnalysisProvider>
    </SessionProvider>
  )
}
