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
};

export default withBundleAnalyzer(nextConfig);
