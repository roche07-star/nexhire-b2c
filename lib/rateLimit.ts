/**
 * Rate Limiting 유틸리티
 *
 * 무차별 대입 공격, DoS, 크레딧 남용 방어
 *
 * 우선순위:
 * 1. Vercel KV (프로덕션 권장)
 * 2. In-memory (개발 환경용, 서버 재시작 시 초기화됨)
 */

import { kv } from '@vercel/kv'

// In-memory 캐시 (Vercel KV 없을 때 사용)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  /** 허용 횟수 */
  limit: number
  /** 시간 윈도우 (초) */
  window: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Rate limit 체크
 *
 * @param identifier - IP 주소 또는 사용자 이메일
 * @param config - Rate limit 설정
 * @returns 성공 여부, 남은 횟수, 리셋 시간
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const resetAt = now + config.window * 1000

  try {
    // Vercel KV 사용 시도
    if (process.env.VERCEL_KV_REST_API_URL) {
      const current = await kv.get<number>(key)

      if (current === null) {
        // 첫 요청
        await kv.set(key, 1, { ex: config.window })
        return {
          success: true,
          remaining: config.limit - 1,
          reset: resetAt,
        }
      }

      if (current >= config.limit) {
        // 제한 초과
        return {
          success: false,
          remaining: 0,
          reset: resetAt,
        }
      }

      // 카운트 증가
      await kv.incr(key)
      return {
        success: true,
        remaining: config.limit - current - 1,
        reset: resetAt,
      }
    }
  } catch (e) {
    console.warn('[rateLimit] Vercel KV error, falling back to memory:', e)
  }

  // Fallback: In-memory store
  const stored = memoryStore.get(key)

  if (!stored || stored.resetAt < now) {
    // 첫 요청 또는 윈도우 만료
    memoryStore.set(key, { count: 1, resetAt })
    return {
      success: true,
      remaining: config.limit - 1,
      reset: resetAt,
    }
  }

  if (stored.count >= config.limit) {
    // 제한 초과
    return {
      success: false,
      remaining: 0,
      reset: stored.resetAt,
    }
  }

  // 카운트 증가
  stored.count++
  return {
    success: true,
    remaining: config.limit - stored.count,
    reset: stored.resetAt,
  }
}

/**
 * 미들웨어나 API 라우트에서 사용하는 헬퍼
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const ip = req.headers.get('x-forwarded-for') || 'unknown'
 *   const limited = await checkRateLimit(ip, { limit: 10, window: 60 })
 *
 *   if (!limited.success) {
 *     return NextResponse.json(
 *       { error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': String(10),
 *           'X-RateLimit-Remaining': String(limited.remaining),
 *           'X-RateLimit-Reset': String(limited.reset),
 *         }
 *       }
 *     )
 *   }
 *   // ... 정상 처리
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(identifier, config)
}

/**
 * 기본 Rate Limit 설정
 */
export const RATE_LIMITS = {
  /** 일반 API: 분당 20회 */
  API: { limit: 20, window: 60 },

  /** 분석 요청: 분당 5회 */
  ANALYZE: { limit: 5, window: 60 },

  /** 로그인 시도: 5분당 5회 */
  AUTH: { limit: 5, window: 300 },

  /** 쿠폰 등록: 분당 3회 */
  COUPON: { limit: 3, window: 60 },

  /** 관리자 작업: 분당 30회 */
  ADMIN: { limit: 30, window: 60 },
}

// In-memory 캐시 정리 (1시간마다)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) {
        memoryStore.delete(key)
      }
    }
  }, 60 * 60 * 1000)
}
