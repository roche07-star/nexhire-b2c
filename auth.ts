import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { supabase } from '@/lib/supabase'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
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
          ...(isManager ? { plan: 'EXPERT' } : {}),
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
          .select('plan')
          .eq('email', user.email)
          .single()
        token.plan = data?.plan ?? 'FREE'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'MANAGER' | 'USER'
        session.user.plan = token.plan as 'FREE' | 'PRO' | 'EXPERT'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
