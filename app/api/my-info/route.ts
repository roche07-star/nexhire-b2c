import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase' // TODO: RLS 적용 후 supabaseClient로 변경
import { PLAN_LIMITS, type UserType } from '@/lib/constants/planLimits'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const email = session.user.email

  const [{ data: user }, { data: coupons }, { data: consents }] = await Promise.all([
    supabase.from('users')
      .select('plan, analyze_count, jd_count, rewrite_count, interview_count, proposal_count, monthly_reset_at, user_type, service_type, headhunter_sharing_enabled, headhunter_sharing_consented_at, downgrade_to, plan_end_date, status, data_delete_at, extra_credits')
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

  const plan = (user?.plan ?? 'FREE') as Plan
  const userType = (user?.user_type ?? 'JOBSEEKER') as UserType
  const limits = PLAN_LIMITS[userType]?.[plan] ?? PLAN_LIMITS.JOBSEEKER.FREE
  const now = new Date()

  // 쿠폰으로 획득한 추가 사용 횟수
  const extraCredits = user?.extra_credits || {}

  const usage: Record<string, { used: number; limit: number }> = {
    analyze:   { used: user?.analyze_count ?? 0,   limit: limits.analyze + (extraCredits.resume || 0) },
    jd:        { used: user?.jd_count ?? 0,        limit: limits.jd + (extraCredits.jd || 0) },
    rewrite:   { used: user?.rewrite_count ?? 0,   limit: limits.rewrite + (extraCredits.rewrite || 0) },
    interview: { used: user?.interview_count ?? 0, limit: limits.interview + (extraCredits.interview || 0) },
  }

  // 헤드헌터만 클라이언트 제안서 표시
  if (userType === 'HEADHUNTER' || userType === 'MANAGER' || userType === 'SUPER_ADMIN') {
    usage.proposal = { used: user?.proposal_count ?? 0, limit: limits.proposal + (extraCredits.proposal || 0) }
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
