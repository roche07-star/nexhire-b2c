/**
 * 쿠폰 타입 정의
 *
 * 중앙 집중화된 타입으로 모든 쿠폰 관련 코드에서 사용
 */

import type { Feature } from '@/lib/usageLimits'

// ============================================
// Database Schema Types
// ============================================

/**
 * DB 테이블 스키마 (Supabase coupons 테이블)
 * 모든 필드가 nullable일 수 있음
 */
export interface DatabaseCoupon {
  id: string
  code: string
  feature: string  // DB에는 TEXT로 저장되지만 Feature 타입으로 검증 필요
  price: number | null
  issued_to: string | null
  claimed_by: string | null
  claimed_at: string | null
  used_at: string | null
  credits: number
  used: number
  expires_at: string | null
  deleted_at: string | null
  created_at: string
}

// ============================================
// Application Types
// ============================================

/**
 * 애플리케이션에서 사용하는 쿠폰 타입
 * DB 조회 후 필수 필드 검증된 상태
 */
export interface Coupon {
  id: string
  code: string
  feature: Feature  // ✅ 타입 안정성: Feature 리터럴 타입
  price: number
  issued_to: string | null
  claimed_by: string | null
  claimed_at: string | null
  used_at: string | null
  credits: number
  used: number
  expires_at: string | null
  deleted_at: string | null
  created_at: string
}

/**
 * UI에서 사용하는 쿠폰 (상태 포함)
 */
export interface CouponWithStatus extends Coupon {
  status: 'active' | 'used' | 'expired'
  remaining: number  // credits - used
}

/**
 * 쿠폰 생성 입력
 */
export interface CreateCouponInput {
  code?: string  // 자동 생성 시 optional
  feature: Feature
  price?: number
  issued_to?: string | null
  credits: number
  expires_at?: string
}

/**
 * 쿠폰 등록 입력
 */
export interface ClaimCouponInput {
  code: string
}

/**
 * 쿠폰 사용 입력
 */
export interface UseCouponInput {
  couponId: string
  feature: Feature
}

// ============================================
// Type Guards (런타임 검증)
// ============================================

/**
 * Feature 타입 검증
 */
export function isValidFeature(value: unknown): value is Feature {
  return (
    typeof value === 'string' &&
    ['analyze', 'jd', 'rewrite', 'interview', 'proposal'].includes(value)
  )
}

/**
 * DatabaseCoupon → Coupon 변환 (타입 검증 포함)
 */
export function toCoupon(data: DatabaseCoupon): Coupon | null {
  // 필수 필드 검증
  if (!data.id || !data.code || !data.feature) {
    console.error('[toCoupon] 필수 필드 누락:', data)
    return null
  }

  // Feature 타입 검증
  if (!isValidFeature(data.feature)) {
    console.error('[toCoupon] 잘못된 feature:', data.feature)
    return null
  }

  return {
    id: data.id,
    code: data.code,
    feature: data.feature,
    price: data.price ?? 0,
    issued_to: data.issued_to,
    claimed_by: data.claimed_by,
    claimed_at: data.claimed_at,
    used_at: data.used_at,
    credits: data.credits ?? 1,
    used: data.used ?? 0,
    expires_at: data.expires_at,
    deleted_at: data.deleted_at,
    created_at: data.created_at,
  }
}

/**
 * Coupon → CouponWithStatus 변환
 */
export function toCouponWithStatus(coupon: Coupon): CouponWithStatus {
  const remaining = Math.max(0, coupon.credits - coupon.used)
  const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false
  const isDeleted = coupon.deleted_at !== null

  let status: 'active' | 'used' | 'expired' = 'active'
  if (isDeleted || isExpired) {
    status = 'expired'
  } else if (remaining === 0) {
    status = 'used'
  }

  return {
    ...coupon,
    status,
    remaining,
  }
}

/**
 * 쿠폰 사용 가능 여부 검증
 */
export function isCouponAvailable(coupon: Coupon): boolean {
  // 삭제된 쿠폰
  if (coupon.deleted_at) return false

  // 만료된 쿠폰
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return false

  // 사용 완료된 쿠폰
  if (coupon.used >= coupon.credits) return false

  return true
}

/**
 * 쿠폰 등록 가능 여부 검증
 */
export function canClaimCoupon(
  coupon: Coupon,
  userEmail: string
): { ok: boolean; error?: string } {
  // 이미 등록됨
  if (coupon.claimed_by) {
    return { ok: false, error: '이미 등록된 쿠폰입니다.' }
  }

  // 지정된 사용자만 등록 가능
  if (coupon.issued_to && coupon.issued_to !== userEmail) {
    return { ok: false, error: '이 쿠폰은 다른 계정에 발급된 쿠폰입니다.' }
  }

  // 만료됨
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { ok: false, error: '만료된 쿠폰입니다.' }
  }

  // 삭제됨
  if (coupon.deleted_at) {
    return { ok: false, error: '유효하지 않은 쿠폰입니다.' }
  }

  return { ok: true }
}
