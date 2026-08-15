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
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 보안 헤더 설정 (코난 - CISO)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
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
