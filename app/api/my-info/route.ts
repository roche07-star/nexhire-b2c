import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE:   { analyze: 3,  jd: 0,  rewrite: 0,  interview: 0 },
  PRO:    { analyze: 10, jd: 15, rewrite: 3,  interview: 0 },
  EXPERT: { analyze: 30, jd: 30, rewrite: 15, interview: 15 },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const email = session.user.email

  const [{ data: user }, { data: coupons }, { data: consents }] = await Promise.all([
    supabase.from('users')
      .select('plan, analyze_count, jd_count, rewrite_count, interview_count, monthly_reset_at, user_type, service_type')
      .eq('email', email).single(),
    supabase.from('coupons')
      .select('id, code, feature, used_at, expires_at, claimed_at')
      .eq('claimed_by', email)
      .order('claimed_at', { ascending: false }),
    supabase.from('consents')
      .select('consent_type, agreed_at, withdrawn_at')
      .eq('user_email', email)
      .eq('is_agreed', true)
      .is('withdrawn_at', null),
  ])

  const plan = user?.plan ?? 'FREE'
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE
  const now = new Date()

  const usage = {
    analyze:   { used: user?.analyze_count ?? 0,   limit: limits.analyze },
    jd:        { used: user?.jd_count ?? 0,        limit: limits.jd },
    rewrite:   { used: user?.rewrite_count ?? 0,   limit: limits.rewrite },
    interview: { used: user?.interview_count ?? 0, limit: limits.interview },
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
  const userTypeLabel = user?.user_type === 'INDIVIDUAL' ? '개인 구직자'
    : user?.user_type === 'HEADHUNTER' ? '헤드헌터'
    : '미설정'

  const serviceTypeLabel = user?.service_type === 'B2C' ? 'B2C (개인)'
    : user?.service_type === 'B2B' ? 'B2B (기업/헤드헌터)'
    : '미설정'

  return NextResponse.json({
    plan,
    usage,
    coupons: couponList,
    resetAt,
    consents: consentInfo,
    userType: user?.user_type ?? null,
    userTypeLabel,
    serviceType: user?.service_type ?? 'B2C',
    serviceTypeLabel
  })
}
