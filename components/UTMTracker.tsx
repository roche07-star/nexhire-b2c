/**
 * UTM 트래커 컴포넌트
 *
 * 페이지 로드 시 자동으로 실행:
 * 1. URL에서 UTM 파라미터 추출 → localStorage 저장
 * 2. 로그인된 사용자: UTM 데이터를 DB에 저장
 */

'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { saveUTMToStorage, getCurrentUTM, clearUTMFromStorage } from '@/lib/utm-tracker'

export default function UTMTracker() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // 1. URL에서 UTM 파라미터 추출 → localStorage 저장
    saveUTMToStorage()

    // 2. 로그인된 사용자: DB에 UTM 저장
    if (status === 'authenticated' && session?.user?.email) {
      const utmData = getCurrentUTM()

      if (utmData) {
        // DB에 저장
        fetch('/api/user/update-utm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(utmData),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              console.log('[UTM Tracker] DB 저장 완료')
              // DB 저장 후 localStorage 삭제 (옵션)
              // clearUTMFromStorage()
            }
          })
          .catch(error => {
            console.error('[UTM Tracker] DB 저장 실패:', error)
          })
      }
    }
  }, [status, session])

  // UI 없음 (백그라운드 동작)
  return null
}
