import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 설정 — 테스 작성
 * E2E 테스트 자동화
 */
export default defineConfig({
  testDir: './tests',

  /* 병렬 실행 */
  fullyParallel: true,

  /* CI에서 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,

  /* 병렬 워커 수 */
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  /* 공통 설정 */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',

    /* 스크린샷 */
    screenshot: 'only-on-failure',

    /* 비디오 */
    video: 'retain-on-failure',

    /* 트레이스 */
    trace: 'retain-on-failure',

    /* 타임아웃 */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* 테스트 타임아웃 */
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  /* 프로젝트 (브라우저) */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* 모바일 테스트 (선택적) */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* 개발 서버 (테스트 실행 시 자동 시작) */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
