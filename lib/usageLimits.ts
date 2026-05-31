import { supabase } from '@/lib/supabase'

export type Feature = 'analyze' | 'jd' | 'rewrite' | 'interview'
export type Plan = 'FREE' | 'PRO' | 'EXPERT'

export const PLAN_LIMITS: Record<Plan, Record<Feature, number>> = {
  FREE:   { analyze: 3,  jd: 0,  rewrite: 0,  interview: 0 },
  PRO:    { analyze: 10, jd: 15, rewrite: 3,  interview: 0 },
  EXPERT: { analyze: 30, jd: 30, rewrite: 15, interview: 15 },
}

const COUNT_COL: Record<Feature, 'analyze_count' | 'jd_count' | 'rewrite_count' | 'interview_count'> = {
  analyze:   'analyze_count',
  jd:        'jd_count',
  rewrite:   'rewrite_count',
  interview: 'interview_count',
}

const RPC_FN: Record<Feature, string> = {
  analyze:   'increment_analyze_count',
  jd:        'increment_jd_count',
  rewrite:   'increment_rewrite_count',
  interview: 'increment_interview_count',
}

type UserRow = {
  plan: string
  analyze_count: number
  jd_count: number
  rewrite_count: number
  interview_count: number
  monthly_reset_at: string | null
}

/**
 * Check if user has remaining usage for a feature.
 * Handles monthly reset based on monthly_reset_at (plan subscription date).
 */
export async function checkUsage(
  email: string,
  feature: Feature,
): Promise<{ allowed: boolean; remaining: number; plan: Plan; limit: number }> {
  const { data } = await supabase
    .from('users')
    .select('plan, analyze_count, jd_count, rewrite_count, interview_count, monthly_reset_at')
    .eq('email', email)
    .single()

  if (!data) return { allowed: false, remaining: 0, plan: 'FREE', limit: 0 }

  const row = data as UserRow
  const plan = (row.plan ?? 'FREE') as Plan

  // Monthly reset: monthly_reset_at marks start of current period; next reset = +1 month
  const startedAt = row.monthly_reset_at ? new Date(row.monthly_reset_at) : new Date(0)
  const nextReset = new Date(startedAt)
  nextReset.setMonth(nextReset.getMonth() + 1)

  if (new Date() >= nextReset) {
    await supabase.from('users').update({
      analyze_count: 0,
      jd_count: 0,
      rewrite_count: 0,
      interview_count: 0,
      monthly_reset_at: nextReset.toISOString(),
    }).eq('email', email)
    row.analyze_count = 0
    row.jd_count = 0
    row.rewrite_count = 0
    row.interview_count = 0
  }

  const limit = PLAN_LIMITS[plan]?.[feature] ?? 0
  const current = row[COUNT_COL[feature]] ?? 0
  const remaining = Math.max(0, limit - current)

  return { allowed: current < limit, remaining, plan, limit }
}

export async function incrementUsage(email: string, feature: Feature): Promise<void> {
  await supabase.rpc(RPC_FN[feature], { user_email: email })
}
