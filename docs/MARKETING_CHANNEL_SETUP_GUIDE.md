# 📱 마케팅 채널 개설 실행 가이드

**작성자:** 마린 (Marketing Lead)  
**목적:** 검색광고 / 소셜미디어 채널 실제 개설 단계별 가이드  
**업데이트:** 2026년 8월 15일

---

## 🎯 개설 우선순위

```
Week 1 (D-14 ~ D-7):
  1. Google Ads 계정 생성 ⭐⭐⭐⭐⭐
  2. Naver 검색광고 계정 생성 ⭐⭐⭐⭐⭐
  3. LinkedIn 페이지 개설 ⭐⭐⭐⭐

Week 2 (D-7 ~ D-Day):
  4. Instagram 비즈니스 계정 ⭐⭐⭐
  5. 블로그 (Tistory/Naver) ⭐⭐⭐
  6. Product Hunt 등록 ⭐⭐
```

---

## 1️⃣ Google Ads 계정 생성

### A. 사전 준비물
- [ ] Gmail 계정 (roche07he@gmail.com 또는 별도 마케팅용)
- [ ] 결제 수단 (법인/개인 카드)
- [ ] 사업자등록번호 (선택, 세금계산서 발행 시)

### B. 계정 생성 단계
1. **Google Ads 접속**
   - URL: https://ads.google.com
   - "지금 시작하기" 클릭

2. **기본 정보 입력**
   - 비즈니스 이름: Jobizic
   - 웹사이트: https://jobizic.com
   - 목표: "웹사이트 트래픽 증가" 선택

3. **결제 정보 등록**
   - 결제 국가: 대한민국
   - 통화: KRW (원화)
   - 결제 수단: 카드 등록
   - 자동 결제 설정: ON

4. **전환 추적 설정**
   ```javascript
   // 이미 lib/analytics.ts에 구현됨
   // Google Ads 전환 ID만 추가 필요
   ```

### C. 첫 캠페인 생성 (MARKETING_SEARCH_ADS.md 참고)
- 캠페인 유형: 검색 광고
- 일 예산: 50,000원 (테스트)
- 키워드: "이력서 분석", "AI 이력서 첨삭"
- 광고 카피: MARKETING_SEARCH_ADS.md 템플릿 사용

### D. 검증 체크리스트
- [ ] 광고 승인 완료
- [ ] 전환 추적 정상 작동
- [ ] UTM 파라미터 자동 수집 확인

---

## 2️⃣ Naver 검색광고 계정 생성

### A. 사전 준비물
- [ ] Naver 계정
- [ ] 사업자등록증 (법인 광고주인 경우)
- [ ] 결제 수단

### B. 계정 생성 단계
1. **Naver 광고 접속**
   - URL: https://searchad.naver.com
   - "광고 시작하기" 클릭

2. **광고주 등록**
   - 광고주 유형: 개인/법인 선택
   - 사업자등록번호 입력 (법인)
   - 사이트 URL: https://jobizic.com

3. **결제 정보 등록**
   - 자동충전 설정: 잔액 50,000원 이하 시 100,000원 충전
   - 결제 수단: 카드 등록

4. **광고 소재 등록**
   - 광고 제목: "AI 이력서 분석 Jobizic | 무료 3회"
   - 광고 설명: "Claude AI 기반 1분 만에 정확한 분석"
   - 랜딩 URL: https://jobizic.com?utm_source=naver&utm_medium=cpc

### C. 검증 체크리스트
- [ ] 광고 심사 통과
- [ ] 모바일 광고 정상 노출
- [ ] 클릭 시 UTM 파라미터 정상 수집

---

## 3️⃣ LinkedIn 페이지 개설

### A. 회사 페이지 생성
1. **LinkedIn 접속**
   - 개인 계정으로 로그인
   - 우측 상단 "Work" → "회사 페이지 만들기"

2. **페이지 정보 입력**
   - 페이지 유형: "회사"
   - 회사 이름: Jobizic
   - LinkedIn URL: linkedin.com/company/jobizic
   - 웹사이트: https://jobizic.com
   - 업종: 소프트웨어 개발
   - 회사 규모: 1-10명
   - 로고: 업로드 (정사각형, 최소 300x300px)
   - 커버 이미지: 업로드 (1536x768px)

3. **회사 소개 작성**
   ```
   🚀 AI 이력서 분석 플랫폼 Jobizic

   Claude AI 기반으로 1분 만에 정확한 이력서 분석을 제공합니다.

   ✓ 무료 3회 체험
   ✓ 기술역량, 경험연차, 도메인핏 4가지 분석
   ✓ 즉시 적용 가능한 구체적 개선안

   #이력서 #취업 #AI #Claude #Jobizic
   ```

### B. 첫 포스트 작성 (론칭 공지)
   ```
   🎉 Jobizic 정식 오픈!

   AI가 1분 만에 분석하는 합격 이력서의 비밀

   👉 무료 체험: https://jobizic.com

   #이력서분석 #AI #취업 #Claude
   ```

### C. 광고 캠페인 설정
   - 캠페인 목표: 웹사이트 방문
   - 타겟: 25-40세, 직장인
   - 예산: 월 500,000원
   - 광고 형식: 단일 이미지 광고

---

## 4️⃣ Instagram 비즈니스 계정

### A. 계정 생성
1. **Instagram 앱 설치**
   - 계정 생성: @jobizic.official

2. **비즈니스 계정 전환**
   - 설정 → 계정 → 프로페셔널 계정으로 전환
   - 카테고리: "제품/서비스"
   - 연락처: roche07he@gmail.com

3. **프로필 작성**
   ```
   🚀 AI 이력서 분석 1위
   ✓ Claude AI 기반 정확한 분석
   ✓ 무료 3회 체험
   👇 1분 만에 시작하기
   https://jobizic.com
   ```

### B. 첫 게시물 (론칭 공지)
   - 이미지: OG 이미지 (1080x1080px로 크롭)
   - 캡션:
     ```
     🎉 Jobizic 정식 오픈!

     AI가 1분 만에 분석하는 합격 이력서의 비밀 ✨

     무료 3회 체험 👉 링크 in bio

     #이력서 #취업 #AI #이력서분석 #Claude #Jobizic
     ```

### C. 릴스 콘텐츠 (Week 1)
   - "이력서 3초 만에 탈락?" (15초)
   - "AI가 본 합격 이력서의 비밀" (30초)
   - "Before/After 이력서 변화" (15초)

---

## 5️⃣ 블로그 (Tistory)

### A. Tistory 개설
1. **Tistory 접속**
   - URL: https://www.tistory.com
   - Kakao 계정으로 로그인
   - "블로그 개설하기"

2. **블로그 정보**
   - 블로그 주소: jobizic.tistory.com
   - 블로그 제목: "Jobizic - AI 이력서 분석 블로그"
   - 블로그 설명: "취업 성공하는 이력서 작성법"

3. **SEO 설정**
   - 검색 허용: ON
   - 메타 설명: "AI 이력서 분석, 취업 팁, 합격 노하우"

### B. 첫 글 작성
   - 제목: "2026 이력서 작성 완벽 가이드"
   - 내용: 3,000자 이상
   - 키워드: 이력서 작성, AI 이력서, 취업 준비
   - CTA: "AI 이력서 분석 무료 체험 →"

---

## 6️⃣ Product Hunt 등록

### A. 계정 생성
1. **Product Hunt 접속**
   - URL: https://www.producthunt.com
   - Google 계정으로 로그인

2. **제품 등록 준비**
   - 제품명: Jobizic
   - 태그라인: "AI Resume Analysis with Claude"
   - 설명: 
     ```
     Get AI-powered resume analysis in 1 minute.
     
     Features:
     - Claude AI-based analysis
     - 4 key evaluation criteria
     - Actionable improvement suggestions
     - Free 3 trials
     ```
   - 카테고리: Productivity, AI, Career
   - 이미지: OG 이미지 (1270x760px)
   - 갤러리: 스크린샷 3-5개

### B. 론칭 일정
   - 론칭일: D-Day (오전 12:01 AM PST)
   - 목표: Daily Top 5
   - 팀원 Upvote 동원
   - Product Hunt 커뮤니티 댓글 활동

---

## 📋 최종 체크리스트

### Week 1 (D-14 ~ D-7)
- [ ] Google Ads 계정 생성 + 첫 캠페인
- [ ] Naver 검색광고 계정 + 첫 캠페인
- [ ] LinkedIn 페이지 개설 + 첫 포스트
- [ ] Instagram 계정 개설 + 프로필 작성

### Week 2 (D-7 ~ D-Day)
- [ ] Tistory 블로그 개설 + 첫 글
- [ ] Product Hunt 등록 준비
- [ ] 콘텐츠 10개 사전 제작
- [ ] 광고 소재 10개 준비

### D-Day
- [ ] Product Hunt 론칭 (12:01 AM PST)
- [ ] 모든 채널 동시 발표
- [ ] 광고 예산 증액 (일 50k → 100k)

---

## 🎯 성과 측정

### 채널별 KPI (Week 1)
| 채널 | 목표 | 측정 지표 |
|------|------|-----------|
| Google Ads | 500 클릭 | CTR 2%, CPA 5,000원 |
| Naver | 300 클릭 | CTR 1.5%, CPA 6,000원 |
| LinkedIn | 200 클릭 | 노출 5,000, 클릭 200 |
| Instagram | 500 클릭 | 노출 10,000, 클릭 500 |
| 블로그 | 1,000 방문 | 검색 유입 80% |
| Product Hunt | Top 5 | 200+ Upvotes |

---

**마린, 채널 개설 가이드 완료!** 📱
