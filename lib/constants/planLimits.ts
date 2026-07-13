/**
 * 플랜별 사용량 제한
 *
 * 클라이언트/서버 모두에서 사용 가능
 * Single Source of Truth
 */

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
