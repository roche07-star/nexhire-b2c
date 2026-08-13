/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

// Sentry Config
const sentryConfig = {
  // Source maps 설정
  silent: true, // 빌드 로그 최소화
  org: 'jobizic',
  project: 'javascript-nextjs',

  // Sentry CLI 옵션
  widenClientFileUpload: true,
  hideSourceMaps: false,
  disableLogger: true,
}

// Bundle Analyzer + Sentry 통합
export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryConfig)
