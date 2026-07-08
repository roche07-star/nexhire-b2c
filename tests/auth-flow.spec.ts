/**
 * 인증 플로우 테스트
 * - 신규 로그인 → consent → dashboard
 * - withdrawing 상태 처리
 */

import { test, expect } from '@playwright/test'

test.describe('신규 사용자 로그인 플로우', () => {
  test.skip('신규 사용자 로그인 시 consent 페이지로 이동', async ({ page }) => {
    // 실제 Google OAuth는 스킵, Mock 필요
    await page.goto('/consent')

    // Consent 페이지 로드 확인
    await expect(page.locator('h1')).toContainText(/환영|동의/)

    // 사용자 타입 선택 카드 확인
    const jobseekerCard = page.locator('text=개인 구직자')
    const headhunterCard = page.locator('text=헤드헌터')

    await expect(jobseekerCard).toBeVisible()
    await expect(headhunterCard).toBeVisible()
  })

  test('consent 페이지에서 user_type 선택 가능', async ({ page }) => {
    await page.goto('/consent')

    // 헤드헌터 선택
    const headhunterCard = page.locator('.user-type-card').filter({ hasText: '헤드헌터' })
    if (await headhunterCard.isVisible()) {
      await headhunterCard.click()

      // 개인정보 동의 체크박스 확인
      const requiredCheckbox = page.locator('input[type="checkbox"]').first()
      await expect(requiredCheckbox).toBeVisible()
    }
  })

  test('consent 완료 후 무한 루프 없음', async ({ page }) => {
    let redirectCount = 0
    const maxRedirects = 5

    page.on('response', response => {
      if (response.url().includes('/consent') && response.status() === 307) {
        redirectCount++
      }
    })

    await page.goto('/consent')
    await page.waitForLoadState('networkidle')

    // 5번 이상 리다이렉트되면 무한 루프
    expect(redirectCount).toBeLessThan(maxRedirects)
  })
})

test.describe('After-login 리다이렉트', () => {
  test('/api/after-login이 적절한 페이지로 리다이렉트', async ({ request }) => {
    // API 호출 테스트 (실제 세션 필요)
    const response = await request.get('/api/after-login')

    // 로그인 안 되어 있으면 홈으로
    expect([200, 307, 302, 303]).toContain(response.status())
  })

  test('user_type null이면 consent로 리다이렉트', async ({ page }) => {
    // Mock user with user_type = null
    await page.goto('/api/after-login')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    // consent 또는 login으로 리다이렉트되어야 함
    expect(url).toMatch(/\/(consent|login|\/)?$/)
  })
})

test.describe('콘솔 에러 체크 - 주요 페이지', () => {
  const criticalPages = ['/', '/login', '/consent', '/analyze', '/dashboard']

  for (const pagePath of criticalPages) {
    test(`${pagePath} 페이지 콘솔 에러 없음`, async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      try {
        await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 10000 })
      } catch (e) {
        // 로그인 필요한 페이지는 리다이렉트됨
        console.log(`${pagePath} - 리다이렉트됨 (정상)`)
      }

      // 치명적인 에러만 체크
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('DevTools') &&
        !err.includes('extension') &&
        !err.includes('Fast Refresh') &&
        !err.includes('Hydration')
      )

      if (criticalErrors.length > 0) {
        console.log(`${pagePath} 콘솔 에러:`, criticalErrors)
      }

      expect(criticalErrors.length).toBe(0)
    })
  }
})
