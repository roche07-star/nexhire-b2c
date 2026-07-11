import { DefaultSession } from 'next-auth'
import { UserType } from './user'

declare module 'next-auth' {
  interface Session {
    user: {
      role: 'MANAGER' | 'USER'  // DEPRECATED
      plan: 'FREE' | 'PRO' | 'EXPERT'
      userType?: UserType | null
      hasConsent?: boolean
    } & DefaultSession['user']
  }
}
