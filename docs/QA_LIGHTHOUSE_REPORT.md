# 🚦 Lighthouse 성능 테스트 리포트

**테스트 일시:** 2026-08-15 19:40 KST  
**테스트 URL:** https://jobizic.com  
**환경:** Production (Vercel)  
**Lighthouse 버전:** 13.4.1

---

## 📊 종합 점수

| 카테고리 | 점수 | 등급 | 상태 |
|---------|------|------|------|
| **Performance** | **65/100** | 🟡 | 개선 필요 |
| **Accessibility** | **91/100** | 🟢 | 양호 |
| **Best Practices** | **96/100** | 🟢 | 우수 |
| **SEO** | **100/100** | 🟢 | 완벽 |

---

## ⚡ Core Web Vitals

### 주요 지표

| 지표 | 값 | 목표 | 평가 |
|------|-----|------|------|
| **FCP** (First Contentful Paint) | 2.7s | <2.5s | 🟡 약간 느림 |
| **LCP** (Largest Contentful Paint) | 5.0s | <2.5s | 🔴 **개선 필요!** |
| **TBT** (Total Blocking Time) | 250ms | <200ms | 🟡 약간 높음 |
| **CLS** (Cumulative Layout Shift) | 0.044 | <0.1 | 🟢 양호 |
| **SI** (Speed Index) | 7.9s | <3.4s | 🔴 **매우 느림!** |

### 지표 설명

- **FCP (First Contentful Paint):** 첫 콘텐츠가 화면에 렌더링되는 시간
- **LCP (Largest Contentful Paint):** 가장 큰 콘텐츠 요소가 렌더링되는 시간
- **TBT (Total Blocking Time):** 메인 스레드가 차단된 총 시간
- **CLS (Cumulative Layout Shift):** 레이아웃 이동 점수
- **SI (Speed Index):** 페이지 로딩 속도 지수

---

## 🚨 주요 개선 기회

### 1. Reduce unused JavaScript (~890ms 절감 가능)
**우선순위:** 🔴 HIGH

**문제:**
- Next.js 번들에 사용하지 않는 JavaScript 코드가 포함되어 있음
- 초기 로딩 시 불필요한 파싱/실행 시간 발생

**해결 방안:**
```javascript
// next.config.mjs

export default {
  // 1. Webpack Bundle Analyzer로 번들 분석
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/nextjs': false, // 클라이언트에서 미사용 시
      }
    }
    return config
  },

  // 2. Dynamic Import로 코드 스플리팅
  // - 분석 페이지에서만 사용하는 컴포넌트를 lazy load
  // - 예: Monaco Editor, Chart.js 등

  // 3. Tree Shaking 최적화
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
}
```

**적용 예시:**
```typescript
// AS-IS (전체 import)
import { Button, Modal, Tooltip } from '@/components/ui'

// TO-BE (필요한 것만 import)
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

// 또는 Dynamic Import
const AnalysisChart = dynamic(() => import('@/components/AnalysisChart'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

---

### 2. LCP 개선 (5.0s → 2.5s 목표)

**문제:**
- 가장 큰 콘텐츠 요소(히어로 섹션 또는 OG 이미지)가 늦게 렌더링됨
- 폰트 로딩 지연
- Critical CSS 미적용

**해결 방안:**

#### 2-1. 이미지 최적화
```typescript
// app/page.tsx
import Image from 'next/image'

<Image
  src="/hero-image.webp"
  alt="Jobizic AI Resume"
  width={1200}
  height={630}
  priority // LCP 이미지는 priority 필수!
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/..." // 10px 블러 이미지
/>
```

#### 2-2. 폰트 최적화
```typescript
// app/layout.tsx
import { Outfit, Noto_Sans_KR } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true, // ✅ 추가
  fallback: ['system-ui', 'arial'], // ✅ 추가
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'], // ✅ 필요한 weight만
  variable: '--font-noto',
  display: 'swap',
  preload: true, // ✅ false → true 변경
})
```

#### 2-3. Critical CSS Inline
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Critical CSS 인라인 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; font-family: var(--font-outfit); }
            .hero { min-height: 100vh; display: flex; }
            /* 첫 화면에 필요한 스타일만 */
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

### 3. Speed Index 개선 (7.9s → 3.4s 목표)

**문제:**
- 전체 페이지 렌더링이 매우 느림
- Render-blocking 리소스
- 서버 응답 시간

**해결 방안:**

#### 3-1. Preload Critical Resources
```tsx
// app/layout.tsx
<head>
  {/* 폰트 Preload */}
  <link
    rel="preload"
    href="/fonts/outfit.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
  
  {/* Critical CSS Preload */}
  <link rel="preload" href="/critical.css" as="style" />
  
  {/* DNS Prefetch */}
  <link rel="dns-prefetch" href="https://api.anthropic.com" />
  <link rel="dns-prefetch" href="https://vercel-insights.com" />
</head>
```

#### 3-2. Component Lazy Loading
```typescript
// app/page.tsx
import dynamic from 'next/dynamic'

// 첫 화면에 없는 컴포넌트는 lazy load
const PricingSection = dynamic(() => import('@/components/PricingSection'))
const TestimonialSection = dynamic(() => import('@/components/TestimonialSection'))
const FAQSection = dynamic(() => import('@/components/FAQSection'))

export default function Home() {
  return (
    <>
      <HeroSection /> {/* 즉시 로드 */}
      <FeatureSection /> {/* 즉시 로드 */}
      <PricingSection /> {/* Lazy load */}
      <TestimonialSection /> {/* Lazy load */}
      <FAQSection /> {/* Lazy load */}
    </>
  )
}
```

#### 3-3. Server Components 적극 활용
```typescript
// app/page.tsx (Server Component)
export default async function Home() {
  // 서버에서 데이터 fetch
  const stats = await getStats()
  
  return (
    <>
      <HeroSection stats={stats} />
      <ClientOnlySection /> {/* 'use client' 컴포넌트 */}
    </>
  )
}
```

---

## ✅ 잘 되고 있는 부분

### SEO (100/100) 🎉
- ✅ 메타 태그 완벽
- ✅ OG 이미지 정상
- ✅ robots.txt 설정
- ✅ sitemap 제공
- ✅ 시맨틱 HTML

### Best Practices (96/100) 🎉
- ✅ HTTPS 사용
- ✅ 보안 헤더 설정
- ✅ No console errors
- ✅ 이미지 aspect ratio

### Accessibility (91/100) 😊
- ✅ ARIA 속성
- ✅ 색상 대비
- ✅ 키보드 접근성
- ✅ Alt 텍스트

### CLS (0.044) 🎉
- ✅ 레이아웃 안정성 우수
- ✅ 이미지 width/height 명시
- ✅ 폰트 swap 설정

---

## 📋 개선 작업 우선순위

### 🔴 우선순위 1 (즉시)
- [ ] Next.js 번들 분석 (Webpack Bundle Analyzer)
- [ ] 사용하지 않는 라이브러리 제거
- [ ] Dynamic Import로 코드 스플리팅

**예상 효과:** Performance 65 → 75 (+10점)

### 🟡 우선순위 2 (이번 주)
- [ ] 이미지 최적화 (WebP, priority, blur)
- [ ] 폰트 최적화 (preload, subset)
- [ ] Critical CSS 인라인

**예상 효과:** Performance 75 → 85 (+10점), LCP 5.0s → 3.0s

### 🟢 우선순위 3 (다음 주)
- [ ] Server Components 적극 활용
- [ ] Lazy Loading 전략
- [ ] Preload/Prefetch 최적화

**예상 효과:** Performance 85 → 90+ (+5점), SI 7.9s → 4.0s

---

## 🎯 목표 점수

| 항목 | 현재 | 목표 | 달성 시점 |
|------|------|------|-----------|
| Performance | 65 | 90+ | 2026-08-25 (D-7) |
| LCP | 5.0s | <2.5s | 2026-08-25 |
| SI | 7.9s | <3.4s | 2026-08-25 |

---

## 📎 참고 자료

- [Lighthouse 공식 문서](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals 가이드](https://web.dev/vitals/)
- [Next.js Performance 최적화](https://nextjs.org/docs/app/building-your-application/optimizing)
- [상세 HTML 리포트](file:///C:/project/nexhire_b2c/lighthouse-report.report.html)

---

**다음 테스트 예정일:** 2026-08-18 (개선 작업 후)  
**담당:** 테스 + 디바
