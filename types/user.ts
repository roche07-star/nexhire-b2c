// 사용자 유형 정의
// 작성일: 2026-06-13
// 작성자: 디바, 디아 (MIR Team)

/**
 * 사용자 유형
 * - JOBSEEKER: 구직자 (본인 이력서 분석, JD 매칭)
 * - HEADHUNTER: 헤드헌터 (후보자 분석, 클라이언트 제안, Eve 연동, 정산 기능)
 */
export type UserType = 'JOBSEEKER' | 'HEADHUNTER'

/**
 * 시스템 권한
 * - MANAGER: 관리자 (무제한 사용, 관리자 페이지 접근)
 * - USER: 일반 사용자
 */
export type Role = 'MANAGER' | 'USER'

/**
 * 플랜 (구독 등급)
 * - FREE: 무료 (월 3회)
 * - PRO: 프로 (월 30회)
 * - EXPERT: 전문가 (무제한, MANAGER 자동 부여)
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
