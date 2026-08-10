import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { supabase } from '@/lib/supabase'
import type { UserType } from '@/types/user'
import bcrypt from 'bcryptjs'
import { validateEmailSecurity } from '@/lib/security/emailValidation'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials')
          return null
        }

        // 명시적 타입 변환
        const inputEmail = String(credentials.email).trim()
        const inputPassword = String(credentials.password)

        console.log('[Auth] Login attempt:', inputEmail)

        // 테스트 계정 체크 (하드코딩 - NHN KCP 심사용)
        const testAccounts = [
          { email: 'kcp-test@jobizic.com', password: 'KCP2026test!', name: 'KCP Test' },
          { email: 'roche07zn@gmail.com', password: 'KCP2026test!', name: '박영철 (ROCHE)' },
        ]

        const testAccount = testAccounts.find(
          acc => acc.email === inputEmail && acc.password === inputPassword
        )

        if (testAccount) {
          console.log('[Auth] Test account login SUCCESS:', testAccount.email)
          // 테스트 계정 로그인 성공
          return {
            id: testAccount.email,
            email: testAccount.email,
            name: testAccount.name,
            image: null,
          }
        }

        console.log('[Auth] No matching test account for:', inputEmail)

        // 일반 계정: DB에서 비밀번호 확인 (향후 확장 가능)
        const { data: user } = await supabase
          .from('users')
          .select('email, name, image, password_hash')
          .eq('email', credentials.email as string)
          .single()

        if (!user || !user.password_hash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!isValid) {
          return null
        }

        return {
          id: user.email,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true

      // 🔒 보안 검증: 이메일 +태그 및 일회용 이메일 차단
      const { valid, normalized, reason } = validateEmailSecurity(user.email)
      if (!valid) {
        console.error('[Security] Email validation failed:', user.email, reason)
        return false // 로그인 차단
      }

      // 🔒 정규화된 이메일로 중복 체크
      const { data: existingUser } = await supabase
        .from('users')
        .select('plan, user_type, status')
        .eq('email', normalized)
        .maybeSingle()

      // +태그 사용 시도 감지: 정규화된 이메일이 이미 존재하면 차단
      if (user.email !== normalized && existingUser) {
        console.error('[Security] Duplicate email detected (plus tag):', user.email, '→', normalized)
        return false // 중복 계정 생성 차단
      }

      // 탈퇴한 사용자 또는 신규 사용자: 완전 초기화
      // withdrawing은 탈퇴 예정이므로 정상 사용 가능 (초기화 안 함)
      const isWithdrawn = existingUser?.status === 'withdrawn'
      const isAdmin = existingUser?.user_type === 'SUPER_ADMIN' || existingUser?.user_type === 'MANAGER'
      const shouldReset = !existingUser || isWithdrawn

      // ⚠️ SUPER_ADMIN / MANAGER는 절대 초기화 금지
      if (shouldReset && !isAdmin) {
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
