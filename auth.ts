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

      // 사용자 레코드 조회 (status 포함)
      const { data: existingUser } = await supabase
        .from('users')
        .select('plan, user_type, status')
        .eq('email', user.email)
        .maybeSingle()

      // 탈퇴한 사용자 또는 신규 사용자: 완전 초기화
      const isWithdrawn = existingUser?.status === 'withdrawn' || existingUser?.status === 'withdrawing'
      const shouldReset = !existingUser || isWithdrawn

      if (shouldReset) {
        // 완전 초기화
        await supabase.from('users').upsert({
          email: user.email,
          name: user.name,
          image: user.image,
          plan: isManager ? 'EXPERT' : 'FREE',
          user_type: isManager ? 'HEADHUNTER' : null,
          status: 'active',
          analyze_count: 0,
          jd_count: 0,
          rewrite_count: 0,
          interview_count: 0,
          proposal_count: 0,
          monthly_reset_at: new Date().toISOString(),
          withdraw_requested_at: null,
          data_delete_at: null,
          last_restored_at: null,
        }, { onConflict: 'email' })
      } else {
        // 기존 사용자: name, image만 업데이트 (manager는 plan/user_type도 업데이트)
        const updateData: any = {
          email: user.email,
          name: user.name,
          image: user.image,
        }
        if (isManager) {
          updateData.plan = 'EXPERT'
          updateData.user_type = 'HEADHUNTER'
        }
        await supabase.from('users').upsert(updateData, { onConflict: 'email' })
      }
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
          .maybeSingle()

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
