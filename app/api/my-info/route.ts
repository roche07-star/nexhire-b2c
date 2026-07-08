import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase' // TODO: RLS 적용 후 supabaseClient로 변경

type UserType = 'JOBSEEKER' | 'HEADHUNTER' | 'MANAGER' | 'SUPER_ADMIN'

const PLAN_LIMITS: Record<UserType, Record<string, Record<string, number>>> = {
  JOBSEEKER: {
    FREE:   { analyze: 3,  jd: 3,  rewrite: 3,  interview: 0, proposal: 0 },
    PRO:    { analyze: 15, jd: 15, rewrite: 10, interview: 5, proposal: 0 },
    EXPERT: { analyze: 30, jd: 30, rewrite: 30, interview: 15, proposal: 0 },
  },
  HEADHUNTER: {
    FREE:   { analyze: 3,  jd: 3,  rewrite: 3,  interview: 0, proposal: 3 },
    PRO:    { analyze: 20, jd: 20, rewrite: 10, interview: 10, proposal: 20 },
    EXPERT: { analyze: 50, jd: 50, rewrite: 50, interview: 25, proposal: 50 },
  },
  MANAGER: {
    FREE:   { analyze: 9999, jd: 9999, rewrite: 9999, interview: 9999, proposal: 9999 },
    PRO:    { analyze: 9999, jd: 9999, rewrite: 9999, interview: 9999, proposal: 9999 },
    EXPERT: { analyze: 9999, jd: 9999, rewrite: 9999, interview: 9999, proposal: 9999 },
  },
  SUPER_ADMIN: {
    FREE:   { analyze: 9999, jd: 9999, rewrite: 9999, interview: 9999, proposal: 9999 },
    PRO:    { analyze: 9999, jd: 9999, rewrite: 9999, interview: 9999, proposal: 9999 },
    EXPERT: { analyze: 9999, jd: 9999, rewrite: 9999, interview: 9999, proposal: 9999 },
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const email = session.user.email

  const [{ data: user }, { data: coupons }, { data: consents }] = await Promise.all([
    supabase.from('users')
      .select('plan, analyze_count, jd_count, rewrite_count, interview_count, proposal_count, monthly_reset_at, user_type, service_type, headhunter_sharing_enabled, headhunter_sharing_consented_at, downgrade_to, plan_end_date, status, data_delete_at')
      .eq('email', email).single(),
    supabase.from('coupons')
      .select('id, code, feature, used_at, expires_at, claimed_at')
      .eq('claimed_by', email)
      .is('deleted_at', null)
      .order('claimed_at', { ascending: false }),
    supabase.from('consents')
      .select('consent_type, agreed_at, withdrawn_at')
      .eq('user_email', email)
      .eq('is_agreed', true)
      .is('withdrawn_at', null),
  ])

  const plan = user?.plan ?? 'FREE'
  const userType = (user?.user_type ?? 'JOBSEEKER') as UserType
  const limits = PLAN_LIMITS[userType]?.[plan] ?? PLAN_LIMITS.JOBSEEKER.FREE
  const now = new Date()

  const usage = {
    analyze:   { used: user?.analyze_count ?? 0,   limit: limits.analyze },
    jd:        { used: user?.jd_count ?? 0,        limit: limits.jd },
    rewrite:   { used: user?.rewrite_count ?? 0,   limit: limits.rewrite },
    interview: { used: user?.interview_count ?? 0, limit: limits.interview },
    proposal:  { used: user?.proposal_count ?? 0,  limit: limits.proposal },
  }

  const couponList = (coupons ?? []).map(c => ({
    ...c,
    status: c.used_at ? 'used'
      : c.expires_at && new Date(c.expires_at) < now ? 'expired'
      : 'active',
  }))

  const resetAt = user?.monthly_reset_at
    ? (() => { const d = new Date(user.monthly_reset_at); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('ko-KR') })()
    : null

  // 동의 정보 정리
  const requiredConsent = consents?.find(c => c.consent_type === 'privacy_required')
  const optionalConsent = consents?.find(c => c.consent_type === 'privacy_optional')

  const consentInfo = {
    required: requiredConsent ? {
      agreed: true,
      agreedAt: new Date(requiredConsent.agreed_at).toLocaleDateString('ko-KR')
    } : { agreed: false, agreedAt: null },
    optional: optionalConsent ? {
      agreed: true,
      agreedAt: new Date(optionalConsent.agreed_at).toLocaleDateString('ko-KR')
    } : { agreed: false, agreedAt: null }
  }

  // 사용자 유형 정보
  const userTypeLabel = user?.user_type === 'JOBSEEKER' ? '개인 구직자'
    : user?.user_type === 'HEADHUNTER' ? '헤드헌터'
    : user?.user_type === 'MANAGER' ? 'Manager'
    : user?.user_type === 'SUPER_ADMIN' ? 'Super Admin'
    : '미설정'

  const serviceTypeLabel = user?.service_type === 'B2C' ? 'B2C (개인)'
    : user?.service_type === 'B2B' ? 'B2B (기업/헤드헌터)'
    : '미설정'

  // 헤드헌터 추천 서비스 정보
  const headhunterSharing = {
    enabled: user?.headhunter_sharing_enabled ?? false,
    consentedAt: user?.headhunter_sharing_consented_at
      ? new Date(user.headhunter_sharing_consented_at).toLocaleDateString('ko-KR')
      : null
  }

  return NextResponse.json({
    plan,
    usage,
    coupons: couponList,
    resetAt,
    consents: consentInfo,
    userType: user?.user_type ?? null,
    userTypeLabel,
    serviceType: user?.service_type ?? 'B2C',
    serviceTypeLabel,
    headhunterSharing,
    downgrade_to: user?.downgrade_to ?? null,
    plan_end_date: user?.status === 'withdrawing' && user?.data_delete_at
      ? new Date(user.data_delete_at).toLocaleDateString('ko-KR')
      : user?.plan_end_date
      ? new Date(user.plan_end_date).toLocaleDateString('ko-KR')
      : null,
    user: {
      status: user?.status ?? 'active'
    }
  })
}
