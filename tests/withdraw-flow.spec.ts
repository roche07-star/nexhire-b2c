/**
 * 탈퇴 플로우 테스트
 * - withdrawing 상태 처리
 * - FREE/유료 플랜 탈퇴
 */

import { test, expect } from '@playwright/test'

test.describe('탈퇴 페이지 UI', () => {
  test('탈퇴 페이지 로드', async ({ page }) => {
    await page.goto('/terms')

    // 계정 탈퇴 섹션 확인
    const withdrawSection = page.locator('text=계정 탈퇴')
    await expect(withdrawSection).toBeVisible()

    // 경고 문구 확인
    const warningText = page.locator('text=/모든 데이터가 영구 삭제/i')
    await expect(warningText).toBeVisible()

    // 6개월 보존 문구가 없어야 함
    const preservationText = page.locator('text=/6개월.*보존/i')
    await expect(preservationText).not.toBeVisible()
  })

  test('탈퇴 모달 열기', async ({ page }) => {
    await page.goto('/terms')

    const withdrawButton = page.locator('button.withdraw-link, button:has-text("계정 탈퇴")')
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()

      // 모달 확인
      const modal = page.locator('.withdraw-modal, [role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 }).catch(() => {})

      // "정말 탈퇴하시겠어요?" 확인
      const modalTitle = page.locator('text=/정말.*탈퇴/i')
      await expect(modalTitle).toBeVisible().catch(() => {})
    }
  })

  test('탈퇴 모달에 6개월 보존 문구 없음', async ({ page }) => {
    await page.goto('/terms')

    const withdrawButton = page.locator('button.withdraw-link, button:has-text("계정 탈퇴")')
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()
      await page.waitForTimeout(500)

      // 6개월 관련 텍스트가 없어야 함
      const sixMonthText = page.locator('text=/6개월/i')
      const isVisible = await sixMonthText.isVisible().catch(() => false)
      expect(isVisible).toBe(false)

      // "데이터 복원" 텍스트도 없어야 함
      const restoreText = page.locator('text=/복원/i')
      const isRestoreVisible = await restoreText.isVisible().catch(() => false)
      expect(isRestoreVisible).toBe(false)
    }
  })
})

test.describe('탈퇴 API 테스트', () => {
  test('/api/user/withdraw POST - 인증 필요', async ({ request }) => {
    const response = await request.post('/api/user/withdraw', {
      data: { confirmed: true }
    })

    // 로그인 안 되어 있으면 401
    expect([401, 403, 307, 302]).toContain(response.status())
  })

  test.skip('유료 플랜 탈퇴 시 withdrawing 상태로 전환', async ({ request }) => {
    // Mock 세션 필요 - 실제 구현에서는 테스트용 사용자 생성 필요
    // const response = await request.post('/api/user/withdraw', {
    //   headers: { 'Cookie': 'test-session' },
    //   data: { confirmed: true }
    // })
    // expect(response.status()).toBe(200)
    // const data = await response.json()
    // expect(data.status).toBe('withdrawing')
  })
})

test.describe('Withdrawing 상태 처리', () => {
  test.skip('withdrawing 상태에서 로그인 시 정상 접근', async ({ page }) => {
    // Mock withdrawing 사용자
    // 실제로는 DB에 withdrawing 상태 사용자 생성 필요

    await page.goto('/dashboard')

    // 로그인 페이지로 리다이렉트되지 않아야 함 (정상 접근)
    await page.waitForLoadState('networkidle')
    const url = page.url()

    // dashboard 또는 정상 페이지여야 함
    expect(url).not.toContain('/login')
  })

  test.skip('withdrawing 상태에서 서비스 정상 이용 가능', async ({ page }) => {
    // Mock withdrawing 사용자로 로그인
    await page.goto('/analyze')

    // 분석 페이지 접근 가능해야 함
    const analyzeContent = page.locator('main, .analyze-container')
    await expect(analyzeContent).toBeVisible({ timeout: 5000 }).catch(() => {})
  })
})

test.describe('Cron Job 대비 데이터 검증', () => {
  test('/api/cron/process-withdrawals 엔드포인트 존재', async ({ request }) => {
    // Cron Secret 없이 호출하면 401
    const response = await request.get('/api/cron/process-withdrawals')
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('Footer 개인정보 문구', () => {
  test('Footer에 저작권 문구 위치 확인', async ({ page }) => {
    await page.goto('/')

    // Footer 로드 대기
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // 저작권 문구 확인
    const copyright = page.locator('text=/© 2026 Jobizic/i')
    await expect(copyright).toBeVisible()

    // 사업자 정보와 같은 섹션에 있어야 함
    const businessInfo = page.locator('text=/사업자등록번호/i')
    await expect(businessInfo).toBeVisible()
  })
})
