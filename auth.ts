import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabase } from '@/lib/supabase'
import type { UserType } from '@/types/user'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true
      const managers = (process.env.MANAGER_EMAILS ?? '')
        .split(',').map((e) => e.trim()).filter(Boolean)
      const isManager = managers.includes(user.email)

      await supabase.from('users').upsert(
        {
          email: user.email,
          name: user.name,
          image: user.image,
          ...(isManager ? { plan: 'EXPERT', user_type: 'HEADHUNTER' } : {}),
        },
        { onConflict: 'email', ignoreDuplicates: !isManager }
      )
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const managers = (process.env.MANAGER_EMAILS ?? '')
          .split(',').map((e) => e.trim()).filter(Boolean)
        token.role = managers.includes(user.email) ? 'MANAGER' : 'USER'

        const { data } = await supabase
          .from('users')
          .select('plan, user_type')
          .eq('email', user.email)
          .single()
        token.plan = data?.plan ?? 'FREE'
        token.userType = data?.user_type ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'MANAGER' | 'USER'
        session.user.plan = token.plan as 'FREE' | 'PRO' | 'EXPERT'
        session.user.userType = token.userType as UserType | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
