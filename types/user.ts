// 사용자 유형 정의
// 작성일: 2026-06-13
// 작성자: 디바, 디아 (MIR Team)

/**
 * 사용자 유형 (권한 통합)
 * - SUPER_ADMIN: 슈퍼 관리자 (최고 권한, MANAGER 지정 가능)
 * - MANAGER: 매니저 (Jobizic 직원, 관리 업무, Super Admin이 지정)
 * - HEADHUNTER: 헤드헌터 (후보자 분석, 클라이언트 제안, Eve 연동, 정산 기능)
 * - JOBSEEKER: 구직자 (본인 이력서 분석, JD 매칭)
 */
export type UserType = 'SUPER_ADMIN' | 'MANAGER' | 'HEADHUNTER' | 'JOBSEEKER'

/**
 * 일반 사용자 유형 (관리자 제외)
 */
export type RegularUserType = 'HEADHUNTER' | 'JOBSEEKER'

/**
 * 시스템 권한 (DEPRECATED - user_type으로 통합)
 * @deprecated Use UserType instead
 */
export type Role = 'MANAGER' | 'USER'

/**
 * 플랜 (구독 등급)
 * - FREE: 무료 (월 3회)
 * - PRO: 프로 (개인 월 15회, 헤드헌터 월 20회)
 * - EXPERT: 전문가 (개인 월 30회, 헤드헌터 월 50회)
 */
export type Plan = 'FREE' | 'PRO' | 'EXPERT'

/**
 * 사용자 전체 정보
 */
export interface User {
  email: string
  name?: string | null
  image?: string | null
  role: Role
  plan: Plan
  userType?: UserType | null  // NULL = 아직 선택 안 함 → 팝업 표시
}

// NextAuth Session 타입 확장은 types/next-auth.d.ts에서 처리
