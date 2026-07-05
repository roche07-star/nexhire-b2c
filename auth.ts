import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabase } from '@/lib/supabase'
import type { UserType } from '@/types/user'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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
          ...(isManager
            ? { plan: 'EXPERT', user_type: 'HEADHUNTER' }
            : {}
          ),
        },
        { onConflict: 'email', ignoreDuplicates: !isManager }
      )
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const superAdmins = (process.env.MANAGER_EMAILS ?? '')
          .split(',').map((e) => e.trim()).filter(Boolean)
        const isSuperAdmin = superAdmins.includes(user.email)

        // DEPRECATED: role은 하위 호환성을 위해 유지
        token.role = isSuperAdmin ? 'MANAGER' : 'USER'

        const { data } = await supabase
          .from('users')
          .select('plan, user_type')
          .eq('email', user.email)
          .single()

        token.plan = data?.plan ?? 'FREE'

        // Super Admin 자동 설정
        if (isSuperAdmin) {
          token.userType = 'SUPER_ADMIN'
          // DB에 SUPER_ADMIN으로 업데이트
          await supabase
            .from('users')
            .update({ user_type: 'SUPER_ADMIN' })
            .eq('email', user.email)
        } else {
          token.userType = data?.user_type ?? null
        }
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
