'use client'

import { SessionProvider } from 'next-auth/react'
import UserTypeGuard from './UserTypeGuard'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserTypeGuard>
        {children}
      </UserTypeGuard>
    </SessionProvider>
  )
}
