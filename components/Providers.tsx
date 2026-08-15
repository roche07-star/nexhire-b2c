'use client'

import { SessionProvider } from 'next-auth/react'
import UserTypeGuard from './UserTypeGuard'
import { AnalysisProvider } from '@/contexts/AnalysisContext'
import SentryUserContext from './SentryUserContext'
import PlanResetWarning from './PlanResetWarning'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserContext />
      <PlanResetWarning />
      <AnalysisProvider>
        <UserTypeGuard>
          {children}
        </UserTypeGuard>
      </AnalysisProvider>
    </SessionProvider>
  )
}
