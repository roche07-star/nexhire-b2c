/**
 * UTM 파라미터 추적 유틸리티
 *
 * 최초 방문 시 UTM 파라미터를 localStorage에 저장
 * 회원가입 시 DB에 저장하여 키워드 성과 분석
 */

export interface UTMData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string  // 키워드 (가장 중요!)
  first_visit_at?: string
  referrer?: string
}

const UTM_STORAGE_KEY = 'jobizic_utm'
const UTM_EXPIRY_DAYS = 30 // 30일 동안 유지

/**
 * URL에서 UTM 파라미터 추출
 */
export function extractUTMFromURL(): UTMData | null {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)

  // UTM 파라미터가 하나라도 있는지 확인
  const hasUTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .some(param => urlParams.has(param))

  if (!hasUTM) return null

  const utmData: UTMData = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    first_visit_at: new Date().toISOString(),
    referrer: document.referrer || undefined,
  }

  return utmData
}

/**
 * UTM 파라미터를 localStorage에 저장
 * 최초 방문 시에만 저장 (이후 덮어쓰지 않음)
 */
export function saveUTMToStorage(): void {
  if (typeof window === 'undefined') return

  // 이미 저장된 UTM이 있으면 덮어쓰지 않음 (최초 유입 채널 보존)
  const existing = getUTMFromStorage()
  if (existing) {
    console.log('[UTM] 이미 저장된 UTM:', existing)
    return
  }

  // URL에서 UTM 추출
  const utmData = extractUTMFromURL()
  if (!utmData) {
    console.log('[UTM] URL에 UTM 파라미터 없음')
    return
  }

  // localStorage에 저장
  try {
    const dataWithExpiry = {
      ...utmData,
      expiry: Date.now() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    }
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(dataWithExpiry))
    console.log('[UTM] 저장 완료:', utmData)
  } catch (error) {
    console.error('[UTM] 저장 실패:', error)
  }
}

/**
 * localStorage에서 UTM 파라미터 가져오기
 */
export function getUTMFromStorage(): UTMData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored)

    // 만료 확인
    if (data.expiry && Date.now() > data.expiry) {
      console.log('[UTM] 만료된 데이터 삭제')
      localStorage.removeItem(UTM_STORAGE_KEY)
      return null
    }

    // expiry 필드 제거 후 반환
    const { expiry, ...utmData } = data
    return utmData
  } catch (error) {
    console.error('[UTM] 읽기 실패:', error)
    return null
  }
}

/**
 * UTM 데이터 삭제 (회원가입 완료 후 호출)
 */
export function clearUTMFromStorage(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(UTM_STORAGE_KEY)
    console.log('[UTM] 데이터 삭제 완료')
  } catch (error) {
    console.error('[UTM] 삭제 실패:', error)
  }
}

/**
 * 현재 UTM 데이터 또는 저장된 UTM 데이터 반환
 * (회원가입 시 호출)
 */
export function getCurrentUTM(): UTMData | null {
  // 1. URL에서 직접 추출 시도
  const urlUTM = extractUTMFromURL()
  if (urlUTM) return urlUTM

  // 2. localStorage에서 가져오기
  return getUTMFromStorage()
}

/**
 * React Hook: 컴포넌트 마운트 시 자동으로 UTM 저장
 */
export function useUTMTracker() {
  if (typeof window === 'undefined') return

  // 페이지 로드 시 UTM 저장
  saveUTMToStorage()
}
