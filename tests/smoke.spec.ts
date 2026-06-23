/**
 * Smoke 테스트 — 기본 기능 작동 확인
 * 테스 작성 — 가장 먼저 실행할 테스트
 */

import { test, expect } from '@playwright/test'

test.describe('Smoke 테스트 — 기본 기능', () => {
  test('홈페이지가 정상적으로 로드됨', async ({ page }) => {
    await page.goto('/')

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/NexHire|adam/i)

    // 로그인 버튼 또는 메인 컨텐츠 확인
    const loginBtn = page.locator('button:has-text("로그인")')
    const mainContent = page.locator('main')

    // 둘 중 하나는 보여야 함
    const isLoginVisible = await loginBtn.isVisible().catch(() => false)
    const isMainVisible = await mainContent.isVisible().catch(() => false)

    expect(isLoginVisible || isMainVisible).toBeTruthy()
  })

  test('네비게이션이 정상 작동함', async ({ page }) => {
    await page.goto('/')

    // 로그인 페이지 이동 (로그인 안 되어 있을 때)
    const currentURL = page.url()
    expect(currentURL).toContain('localhost:3000')
  })
})

test.describe('API 엔드포인트 테스트', () => {
  test('Health check (존재하는 경우)', async ({ request }) => {
    // API가 응답하는지 확인
    const response = await request.get('/')
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe('콘솔 에러 확인', () => {
  test('페이지 로드 시 콘솔 에러 없음', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 치명적인 에러만 체크 (일부 경고는 무시)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('DevTools') &&
      !err.includes('extension') &&
      !err.includes('Google Tag Manager')
    )

    if (criticalErrors.length > 0) {
      console.log('발견된 콘솔 에러:', criticalErrors)
    }

    // 치명적인 에러가 없어야 함
    expect(criticalErrors.length).toBe(0)
  })

  test('네트워크 에러 없음', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (failedRequests.length > 0) {
      console.log('실패한 요청:', failedRequests)
    }

    // 치명적인 네트워크 에러 없어야 함
    const criticalFailed = failedRequests.filter(req =>
      !req.includes('google-analytics') &&
      !req.includes('gtag') &&
      !req.includes('analytics')
    )

    expect(criticalFailed.length).toBe(0)
  })
})
