import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      role: 'MANAGER' | 'USER'
    } & DefaultSession['user']
  }
}
