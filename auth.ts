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

      // ✅ DB 기반 권한 검증: 사용자 레코드 조회 (status, user_type 포함)
      const { data: existingUser } = await supabase
        .from('users')
        .select('plan, user_type, status')
        .eq('email', user.email)
        .maybeSingle()

      // 탈퇴한 사용자 또는 신규 사용자: 완전 초기화
      // withdrawing은 탈퇴 예정이므로 정상 사용 가능 (초기화 안 함)
      const isWithdrawn = existingUser?.status === 'withdrawn'
      const shouldReset = !existingUser || isWithdrawn

      if (shouldReset) {
        // 완전 초기화 (last_restored_at을 현재 시간으로 설정)
        // ⚠️ 신규 사용자는 FREE 플랜, user_type은 null (consent에서 설정)
        const resetTime = new Date().toISOString()
        const { error: resetError } = await supabase.from('users').upsert({
          email: user.email,
          name: user.name,
          image: user.image,
          plan: 'FREE',
          user_type: null,
          status: 'active',
          analyze_count: 0,
          jd_count: 0,
          rewrite_count: 0,
          interview_count: 0,
          proposal_count: 0,
          monthly_reset_at: resetTime,
          withdraw_requested_at: null,
          data_delete_at: null,
          last_restored_at: resetTime, // 초기화 시점 기록
        }, { onConflict: 'email' })

        if (resetError) {
          console.error('[auth/signIn] User reset/creation failed:', resetError)
          console.error('[auth/signIn] Email:', user.email)
          // 로그인은 계속 진행 (consent 페이지에서 처리)
        } else {
          console.log('[auth/signIn] User created/reset:', user.email)
        }
      } else {
        // ✅ 기존 사용자: name, image만 업데이트 (권한은 DB 유지)
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            email: user.email,
            name: user.name,
            image: user.image,
          }, { onConflict: 'email' })

        if (updateError) {
          console.error('[auth/signIn] User update failed:', updateError)
          console.error('[auth/signIn] Email:', user.email)
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // ✅ RLS 정책을 위해 JWT에 email 포함 (CRITICAL)
        token.email = user.email

        // ✅ DB 기반 권한 검증: user_type + 동의 정보 병렬 조회
        const [
          { data: userData },
          { data: consentData }
        ] = await Promise.all([
          supabase
            .from('users')
            .select('plan, user_type')
            .eq('email', user.email)
            .maybeSingle(),
          supabase
            .from('consents')
            .select('id')
            .eq('user_email', user.email)
            .eq('consent_type', 'privacy_required')
            .eq('is_agreed', true)
            .is('withdrawn_at', null)
            .maybeSingle()
        ])

        token.plan = userData?.plan ?? 'FREE'
        token.userType = userData?.user_type ?? null
        token.hasConsent = !!consentData

        // DEPRECATED: role은 하위 호환성을 위해 유지
        // SUPER_ADMIN 또는 MANAGER는 'MANAGER' role
        const isAdmin = userData?.user_type === 'SUPER_ADMIN' || userData?.user_type === 'MANAGER'
        token.role = isAdmin ? 'MANAGER' : 'USER'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'MANAGER' | 'USER'
        session.user.plan = token.plan as 'FREE' | 'PRO' | 'EXPERT'
        session.user.userType = token.userType as UserType | null
        session.user.hasConsent = token.hasConsent as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
