/**
 * 제안서 생성 E2E 테스트
 * 테스 작성 — 무한루프 및 데이터 검증
 */

import { test, expect } from '@playwright/test'

test.describe('제안서 생성 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3000')
    // TODO: 실제 로그인 로직 추가
  })

  test('TC1: 정상 케이스 - 경력/학력/연봉 모두 있음', async ({ page }) => {
    // 1. 이력서 업로드
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/resume-full.pdf')

    // 2. 분석 완료 대기
    await expect(page.locator('.analyze-result')).toBeVisible({ timeout: 30000 })

    // 3. JD 분석
    await page.locator('button:has-text("JD 적합도 분석")').click()
    await page.fill('textarea[placeholder*="채용공고"]', '네이버 백엔드 개발자 채용...')
    await page.locator('button:has-text("분석 시작")').click()

    // 4. JD 분석 완료 대기
    await expect(page.locator('.jd-result')).toBeVisible({ timeout: 30000 })

    // 5. 제안서 생성 버튼 클릭 (헤드헌터만)
    const proposalBtn = page.locator('button:has-text("후보자 제안서 생성")')
    if (await proposalBtn.isVisible()) {
      await proposalBtn.click()

      // 6. 생성 완료 대기
      await expect(page.locator('button:has-text("제안서 다운로드")')).toBeVisible({
        timeout: 60000
      })

      // 7. 다운로드 버튼 클릭
      const downloadBtn = page.locator('button:has-text("제안서 다운로드")')

      // 8. 다운로드 시작
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadBtn.click()
      ])

      // 9. HTML 파일 내용 확인
      const path = await download.path()
      const fs = require('fs')
      const html = fs.readFileSync(path!, 'utf-8')

      // 10. 검증: "미기재" 없어야 함
      expect(html).not.toContain('경력: 미기재')
      expect(html).not.toContain('학력: 미기재')
      expect(html).not.toContain('연봉: 미기재')

      // 11. 검증: 실제 값 있어야 함
      expect(html).toMatch(/총 \d+년 \d+개월/)  // 경력
      expect(html).toMatch(/대학교.*졸업/)      // 학력
      expect(html).toMatch(/\d+,?\d*만원/)     // 연봉
    }
  })

  test('TC2: 경력만 있는 경우', async ({ page }) => {
    // 학력/연봉 없는 이력서
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/resume-career-only.pdf')

    // ... JD 분석 및 제안서 생성 ...

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("제안서 다운로드")').click()
    ])

    const path = await download.path()
    const fs = require('fs')
    const html = fs.readFileSync(path!, 'utf-8')

    // 검증
    expect(html).toMatch(/총 \d+년/)           // 경력 있음
    expect(html).toContain('학력: 미기재')    // 학력 없음
    expect(html).toContain('연봉: 미기재')    // 연봉 없음
  })

  test('TC3: 모든 정보 없음 (신입)', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/resume-entry.pdf')

    // ... JD 분석 및 제안서 생성 ...

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("제안서 다운로드")').click()
    ])

    const path = await download.path()
    const fs = require('fs')
    const html = fs.readFileSync(path!, 'utf-8')

    // 검증: 모두 "미기재"
    expect(html).toContain('경력: 미기재')
    expect(html).toContain('학력: 미기재')
    expect(html).toContain('연봉: 미기재')

    // 하지만 제안서는 정상 생성됨
    expect(html).toContain('후보자 추천')
  })
})

test.describe('무한루프 방지 테스트', () => {
  test('TC4: API 실패 시 Circuit Breaker 작동', async ({ page, context }) => {
    // Network 요청 모니터링
    const apiCalls: string[] = []

    page.on('request', request => {
      if (request.url().includes('/api/generate-proposal')) {
        apiCalls.push(request.url())
        console.log(`[API Call ${apiCalls.length}] ${new Date().toISOString()}`)
      }
    })

    // API를 500 에러로 Mock
    await page.route('**/api/generate-proposal', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    // 이력서 분석 → JD 분석
    // ... (생략) ...

    // 5초 대기 (무한루프 발생 시 여러 번 호출될 것)
    await page.waitForTimeout(5000)

    // 검증: 최대 3회만 호출되어야 함 (Circuit Breaker)
    expect(apiCalls.length).toBeLessThanOrEqual(3)

    // 검증: 에러 메시지 표시
    await expect(page.locator('text=제안서 생성에 실패했습니다')).toBeVisible()
  })

  test('TC5: 네트워크 오프라인 시 무한루프 없음', async ({ page, context }) => {
    const apiCalls: string[] = []

    page.on('request', request => {
      if (request.url().includes('/api/generate-proposal')) {
        apiCalls.push(request.url())
      }
    })

    // 네트워크 오프라인 시뮬레이션
    await context.setOffline(true)

    // ... 이력서 분석 → JD 분석 ...

    await page.waitForTimeout(5000)

    // 검증: API 호출 없어야 함 (fetch 자체가 실패)
    expect(apiCalls.length).toBe(0)
  })

  test('TC6: 연속 3회 실패 후 5분 차단', async ({ page }) => {
    const apiCalls: { time: number; url: string }[] = []

    page.on('request', request => {
      if (request.url().includes('/api/generate-proposal')) {
        apiCalls.push({ time: Date.now(), url: request.url() })
      }
    })

    // API를 500 에러로 Mock
    await page.route('**/api/generate-proposal', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Error' }) })
    })

    // ... 이력서 분석 → JD 분석 (자동 생성 시작) ...

    // 3회 실패 대기
    await page.waitForTimeout(3000)

    // 검증: 정확히 3회 호출
    expect(apiCalls.length).toBe(3)

    // 4번째 시도 (수동)
    await page.locator('button:has-text("제안서 생성")').click()

    // 검증: 차단 메시지 표시
    await expect(page.locator('text=5분 후 다시 시도')).toBeVisible()

    // 검증: 추가 API 호출 없음
    expect(apiCalls.length).toBe(3)
  })
})

test.describe('토큰 사용량 테스트', () => {
  test('TC7: 검증 비활성화 시 로그 확인', async ({ page }) => {
    // 환경 변수 설정 필요: ENABLE_VALIDATION=false

    // Console 로그 캡처
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('[analyze]')) {
        logs.push(msg.text())
      }
    })

    // 이력서 분석
    // ... (생략) ...

    // 검증: "검증 단계 건너뜀" 로그 있어야 함
    expect(logs.some(log => log.includes('검증 단계 건너뜀'))).toBeTruthy()

    // 검증: "검증 단계 토큰" 로그 없어야 함
    expect(logs.some(log => log.includes('검증 단계 토큰'))).toBeFalsy()
  })
})
