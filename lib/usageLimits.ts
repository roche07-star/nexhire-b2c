import { supabase } from '@/lib/supabase'

export type Feature = 'analyze' | 'jd' | 'rewrite' | 'interview' | 'proposal'
export type Plan = 'FREE' | 'PRO' | 'EXPERT'
export type UserType = 'JOBSEEKER' | 'HEADHUNTER' | 'MANAGER' | 'SUPER_ADMIN'

export const PLAN_LIMITS: Record<UserType, Record<Plan, Record<Feature, number>>> = {
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

const COUNT_COL: Record<Feature, 'analyze_count' | 'jd_count' | 'rewrite_count' | 'interview_count' | 'proposal_count'> = {
  analyze:   'analyze_count',
  jd:        'jd_count',
  rewrite:   'rewrite_count',
  interview: 'interview_count',
  proposal:  'proposal_count',
}

const RPC_FN: Record<Feature, string> = {
  analyze:   'increment_analyze_count',
  jd:        'increment_jd_count',
  rewrite:   'increment_rewrite_count',
  interview: 'increment_interview_count',
  proposal:  'increment_proposal_count',
}

type UserRow = {
  plan: string
  user_type: string | null
  analyze_count: number
  jd_count: number
  rewrite_count: number
  interview_count: number
  proposal_count: number
  monthly_reset_at: string | null
}

/**
 * Check if user has remaining usage for a feature.
 * Handles monthly reset based on monthly_reset_at (plan subscription date).
 * Also checks for available coupons if plan limit is exceeded.
 */
export async function checkUsage(
  email: string,
  feature: Feature,
): Promise<{ allowed: boolean; remaining: number; plan: Plan; limit: number }> {
  const { data } = await supabase
    .from('users')
    .select('plan, user_type, analyze_count, jd_count, rewrite_count, interview_count, proposal_count, monthly_reset_at')
    .eq('email', email)
    .single()

  if (!data) return { allowed: false, remaining: 0, plan: 'FREE', limit: 0 }

  const row = data as UserRow
  const plan = (row.plan ?? 'FREE') as Plan
  const userType = (row.user_type ?? 'JOBSEEKER') as UserType

  // ✅ 월간 사용량 원자적 리셋 (레이스 컨디션 방지)
  const { data: resetResult, error: resetError } = await supabase.rpc('check_and_reset_usage', {
    user_email: email
  })

  if (resetError) {
    console.error('[usageLimits] 리셋 체크 실패:', resetError)
    // 에러 시 기존 로직 fallback (안전하게 처리)
    const startedAt = row.monthly_reset_at ? new Date(row.monthly_reset_at) : new Date(0)
    const nextReset = new Date(startedAt)
    nextReset.setMonth(nextReset.getMonth() + 1)

    if (new Date() >= nextReset) {
      await supabase.from('users').update({
        analyze_count: 0,
        jd_count: 0,
        rewrite_count: 0,
        interview_count: 0,
        proposal_count: 0,
        monthly_reset_at: nextReset.toISOString(),
      }).eq('email', email)
      row.analyze_count = 0
      row.jd_count = 0
      row.rewrite_count = 0
      row.interview_count = 0
      row.proposal_count = 0
    }
  } else if (resetResult && resetResult.length > 0) {
    const result = resetResult[0]

    if (result.was_reset) {
      console.log(`[usageLimits] 월간 사용량 리셋 완료:`, email)
    }

    // RPC 결과로 현재 카운트 업데이트
    row.analyze_count = result.analyze_count
    row.jd_count = result.jd_count
    row.rewrite_count = result.rewrite_count
    row.interview_count = result.interview_count
    row.proposal_count = result.proposal_count
  }

  const limit = PLAN_LIMITS[userType]?.[plan]?.[feature] ?? 0
  const current = row[COUNT_COL[feature]] ?? 0
  const remaining = Math.max(0, limit - current)

  // 플랜 한도 내: 허용
  if (current < limit) {
    return { allowed: true, remaining, plan, limit }
  }

  // 플랜 한도 초과: 쿠폰 확인
  const { data: allCoupons } = await supabase
    .from('coupons')
    .select('id, credits, used, expires_at')
    .eq('claimed_by', email)
    .eq('feature', feature)
    .gt('expires_at', new Date().toISOString()) // 만료되지 않음
    .order('expires_at', { ascending: true }) // 만료 임박 순

  // ✅ 타입 안정성: 남은 횟수가 있는 쿠폰만 필터링
  type CouponRow = { id: string; credits: number; used: number; expires_at: string | null }
  const availableCoupons = (allCoupons as CouponRow[] || []).filter(c => c.used < c.credits)
  const hasAvailableCoupon = availableCoupons.length > 0

  return {
    allowed: hasAvailableCoupon,
    remaining: hasAvailableCoupon ? availableCoupons.reduce((sum, c) => sum + (c.credits - c.used), 0) : 0,
    plan,
    limit,
  }
}

/**
 * Increment usage count.
 * If plan limit exceeded, consumes a coupon instead.
 */
export async function incrementUsage(email: string, feature: Feature): Promise<void> {
  // 현재 사용량 확인
  const { data } = await supabase
    .from('users')
    .select('plan, user_type, analyze_count, jd_count, rewrite_count, interview_count, proposal_count')
    .eq('email', email)
    .single()

  if (!data) return

  const row = data as UserRow
  const plan = (row.plan ?? 'FREE') as Plan
  const userType = (row.user_type ?? 'JOBSEEKER') as UserType
  const limit = PLAN_LIMITS[userType]?.[plan]?.[feature] ?? 0
  const current = row[COUNT_COL[feature]] ?? 0

  // 플랜 한도 내: users 테이블 카운트 증가
  if (current < limit) {
    await supabase.rpc(RPC_FN[feature], { user_email: email })
    return
  }

  // 플랜 한도 초과: 쿠폰 차감
  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, credits, used, expires_at')
    .eq('claimed_by', email)
    .eq('feature', feature)
    .gt('expires_at', new Date().toISOString())
    .is('deleted_at', null)
    .order('expires_at', { ascending: true })
    .limit(1)

  // ✅ 타입 안정성
  type CouponRow = { id: string; credits: number; used: number; expires_at: string | null }
  const availableCoupon = (coupons as CouponRow[] || []).find(c => c.used < c.credits)

  if (availableCoupon) {
    // ✅ 원자적 쿠폰 사용 (Optimistic Locking)
    const { data: success, error } = await supabase.rpc('increment_coupon_used', {
      coupon_id: availableCoupon.id
    })

    if (error) {
      console.error(`[usageLimits] 쿠폰 증가 실패:`, error)
      throw new Error('쿠폰 사용 처리에 실패했습니다.')
    }

    if (!success) {
      // RPC가 false 반환 = 동시 요청으로 이미 소진됨
      console.warn(`[usageLimits] 쿠폰 ${availableCoupon.id} 이미 소진됨 (레이스 컨디션)`)
      throw new Error('쿠폰이 이미 소진되었습니다. 다시 시도해주세요.')
    }

    console.log(`[usageLimits] 쿠폰 사용 성공:`, availableCoupon.id)
  }
}
