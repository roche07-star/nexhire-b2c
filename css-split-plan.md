# CSS 분리 계획

## 1. globals.css (공통 - 모든 페이지)
- 라인 1-25: CSS 변수, 리셋
- 라인 917-1674: NAV USER (로그인 후)
- 라인 5306-끝: 배너, MODAL, Features 리스트

## 2. landing.css (랜딩 페이지 전용)
- 라인 26-916: NAV, HERO, FEATURES, PRICING, FAQ, CTA, FOOTER, SCROLL REVEAL

## 3. analyze.css (분석 페이지 전용)
- 라인 1675-5305: Re-Writing, JD, RESPONSIVE, Results

## Import 위치
- app/layout.tsx → globals.css (모든 페이지)
- app/page.tsx → landing.css (랜딩만)
- app/analyze/page.tsx → analyze.css (분석만)
