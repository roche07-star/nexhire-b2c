import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // 빌드 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 이미지 최적화 설정
  images: {
    unoptimized: false,
  },

  // 빌드 성능 개선
  experimental: {
    optimizePackageImports: ['@anthropic-ai/sdk', '@supabase/supabase-js'],
  },

  // 타입 체크 (빌드 안정성)
  typescript: {
    ignoreBuildErrors: false,
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.portone.io https://cdn.iamport.kr https://js.tosspayments.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.portone.io https://api.iamport.kr https://api.tosspayments.com https://*.vercel-insights.com https://*.sentry.io wss://*.supabase.co",
              "frame-src 'self' https://cdn.portone.io https://service.iamport.kr https://pay.toss.im",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // X-Frame-Options (Clickjacking 방지)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options (MIME 스니핑 방지)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer-Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions-Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);
