/**
 * 캐시 유틸리티
 *
 * Redis 인프라가 설정되어 있으면 Redis 사용
 * 없으면 메모리 캐시로 fallback (개발/테스트용)
 *
 * 사용 방법:
 * ```typescript
 * const data = await getCached(
 *   'dashboard:stats:user@example.com',
 *   async () => {
 *     // DB 조회 로직
 *     return await fetchFromDB()
 *   },
 *   300 // 5분 TTL
 * )
 * ```
 */

import { kv } from '@vercel/kv'

// 메모리 캐시 (Redis 없을 때 fallback)
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<any>>()

// Redis 사용 가능 여부 체크
const isRedisAvailable = () => {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  )
}

/**
 * 캐시에서 데이터 조회, 없으면 fetcher 실행 후 캐싱
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 기본 5분
): Promise<T> {
  try {
    // Redis 사용 가능하면 Redis 사용
    if (isRedisAvailable()) {
      const cached = await kv.get<T>(key)
      if (cached !== null) {
        console.log(`[Cache HIT] Redis: ${key}`)
        return cached
      }

      console.log(`[Cache MISS] Redis: ${key}`)
      const data = await fetcher()

      // Redis에 저장
      await kv.set(key, data, { ex: ttl })

      return data
    }

    // Redis 없으면 메모리 캐시 사용
    const now = Date.now()
    const cached = memoryCache.get(key)

    if (cached && cached.expiresAt > now) {
      console.log(`[Cache HIT] Memory: ${key}`)
      return cached.data
    }

    console.log(`[Cache MISS] Memory: ${key}`)
    const data = await fetcher()

    // 메모리에 저장
    memoryCache.set(key, {
      data,
      expiresAt: now + (ttl * 1000)
    })

    // 메모리 캐시 정리 (100개 초과 시 오래된 것 삭제)
    if (memoryCache.size > 100) {
      const entries = Array.from(memoryCache.entries())
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)
      entries.slice(0, 20).forEach(([k]) => memoryCache.delete(k))
    }

    return data
  } catch (error) {
    console.error('[Cache Error]', error)
    // 캐시 오류 시 fetcher 직접 실행
    return await fetcher()
  }
}

/**
 * 캐시 무효화 (특정 키)
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    if (isRedisAvailable()) {
      await kv.del(key)
      console.log(`[Cache INVALIDATE] Redis: ${key}`)
    } else {
      memoryCache.delete(key)
      console.log(`[Cache INVALIDATE] Memory: ${key}`)
    }
  } catch (error) {
    console.error('[Cache Invalidate Error]', error)
  }
}

/**
 * 캐시 무효화 (패턴 매칭)
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    if (isRedisAvailable()) {
      // Redis SCAN으로 패턴 매칭 키 찾기
      const keys = await kv.keys(pattern)
      if (keys.length > 0) {
        await Promise.all(keys.map(k => kv.del(k)))
        console.log(`[Cache INVALIDATE] Redis pattern: ${pattern} (${keys.length} keys)`)
      }
    } else {
      // 메모리 캐시에서 패턴 매칭
      const regex = new RegExp(pattern.replace('*', '.*'))
      const keysToDelete = Array.from(memoryCache.keys()).filter(k => regex.test(k))
      keysToDelete.forEach(k => memoryCache.delete(k))
      console.log(`[Cache INVALIDATE] Memory pattern: ${pattern} (${keysToDelete.length} keys)`)
    }
  } catch (error) {
    console.error('[Cache Invalidate Pattern Error]', error)
  }
}

/**
 * 캐시 상태 확인
 */
export function getCacheInfo() {
  return {
    type: isRedisAvailable() ? 'redis' : 'memory',
    memorySize: memoryCache.size,
    redisConfigured: isRedisAvailable()
  }
}
