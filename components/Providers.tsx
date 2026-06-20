'use client'

import { SessionProvider } from 'next-auth/react'
import UserTypeGuard from './UserTypeGuard'
import { AnalysisProvider } from '@/contexts/AnalysisContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnalysisProvider>
        <UserTypeGuard>
          {children}
        </UserTypeGuard>
      </AnalysisProvider>
    </SessionProvider>
  )
}
