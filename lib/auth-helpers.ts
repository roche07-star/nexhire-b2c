import { Session } from 'next-auth'

/**
 * 관리자 권한 체크 헬퍼
 */

/**
 * Super Admin 권한 체크 (최고 관리자)
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.userType === 'SUPER_ADMIN'
}

/**
 * 관리자 권한 체크 (Super Admin 또는 Manager)
 */
export function isAdmin(session: Session | null): boolean {
  const userType = session?.user?.userType
  return userType === 'SUPER_ADMIN' || userType === 'MANAGER'
}

/**
 * Manager 권한 체크
 */
export function isManager(session: Session | null): boolean {
  return session?.user?.userType === 'MANAGER'
}

/**
 * 하위 호환성: role 기반 체크 (DEPRECATED)
 * @deprecated Use isAdmin() or isSuperAdmin() instead
 */
export function hasManagerRole(session: Session | null): boolean {
  return session?.user?.role === 'MANAGER'
}
