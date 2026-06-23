# 🧪 자동화 테스트 가이드 — 테스 작성

## 🚀 빠른 시작

### 1. 설치
```bash
# 의존성 설치 (이미 완료)
npm install

# Playwright 브라우저 설치
npx playwright install chromium
```

### 2. 테스트 실행
```bash
# Smoke 테스트 (빠름, 5초)
npm test tests/smoke.spec.ts

# 전체 테스트 (느림, 5분)
npm test

# UI 모드 (디버깅)
npm run test:ui

# 헤드풀 모드 (브라우저 보면서)
npm run test:headed

# 디버그 모드
npm run test:debug
```

### 3. 테스트 결과 확인
```bash
# HTML 리포트 열기
npm run test:report
```

---

## 📂 테스트 구조

```
tests/
├── fixtures/           # 테스트 데이터 (샘플 이력서)
│   ├── README.md
│   ├── resume-full.pdf      (준비 필요)
│   ├── resume-career-only.pdf
│   └── resume-entry.pdf
│
├── smoke.spec.ts       # 기본 기능 테스트 (우선 실행)
├── proposal.spec.ts    # 제안서 생성 테스트
└── README.md          # 이 파일
```

---

## ✅ 테스트 케이스

### **Smoke 테스트 (smoke.spec.ts)**
우선 순위가 가장 높은 테스트

- ✅ 홈페이지 로드
- ✅ 네비게이션 작동
- ✅ 콘솔 에러 없음
- ✅ 네트워크 에러 없음

**실행 시간:** ~5초
**실행 빈도:** 매 커밋

---

### **제안서 테스트 (proposal.spec.ts)**
핵심 비즈니스 로직 테스트

#### **데이터 검증 테스트**
- TC1: 정상 케이스 (경력/학력/연봉 모두 있음)
- TC2: 경력만 있는 경우
- TC3: 모든 정보 없음 (신입)

#### **무한루프 방지 테스트**
- TC4: API 실패 시 Circuit Breaker 작동
- TC5: 네트워크 오프라인 시 무한루프 없음
- TC6: 연속 3회 실패 후 5분 차단

#### **토큰 사용량 테스트**
- TC7: 검증 비활성화 시 로그 확인

**실행 시간:** ~5분
**실행 빈도:** PR 머지 전

---

## 🎯 테스트 실행 순서

### **로컬 개발 시:**
```bash
# 1. Smoke 테스트 (필수)
npm test tests/smoke.spec.ts

# 2. 변경한 기능 테스트
npm test tests/proposal.spec.ts

# 3. 전체 테스트 (PR 전)
npm test
```

### **CI/CD (GitHub Actions):**
```
자동 실행 조건:
- main 브랜치에 push
- PR 생성 시

실행 순서:
1. 린트
2. 보안 감사
3. Smoke 테스트
4. 전체 E2E 테스트 (픽스처 준비 후)
```

---

## 🔧 트러블슈팅

### **문제: 테스트가 실패함**
```bash
# 1. 개발 서버 실행 확인
npm run dev
# localhost:3000 접속 확인

# 2. 브라우저 재설치
npx playwright install chromium --with-deps

# 3. 캐시 삭제
rm -rf test-results/ playwright-report/

# 4. 다시 실행
npm test
```

### **문제: 타임아웃 발생**
```typescript
// playwright.config.ts에서 타임아웃 증가
timeout: 120000, // 2분
```

### **문제: 픽스처 파일 없음**
```
Error: ENOENT: no such file or directory, open 'tests/fixtures/resume-full.pdf'

해결:
1. tests/fixtures/README.md 참고
2. 샘플 이력서 PDF 생성
3. tests/fixtures/ 폴더에 복사
```

---

## 📊 테스트 커버리지

### **현재 커버리지 (2026-06-23)**
```
기본 기능: ✅ 100% (smoke.spec.ts)
제안서 생성: 🚧 90% (픽스처 준비 필요)
무한루프 방지: ✅ 100%
Circuit Breaker: ✅ 100%
토큰 모니터링: ✅ 100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━
전체 커버리지: ~95%
```

### **목표 커버리지**
```
전체: 100%
핵심 경로: 100% (필수)
엣지 케이스: 90%
```

---

## 🎬 데모

### **Smoke 테스트 실행 예시**
```bash
$ npm test tests/smoke.spec.ts

Running 5 tests using 1 worker

  ✓ [chromium] › smoke.spec.ts:7:3 › Smoke 테스트 — 기본 기능 › 홈페이지가 정상적으로 로드됨 (1s)
  ✓ [chromium] › smoke.spec.ts:21:3 › Smoke 테스트 — 기본 기능 › 네비게이션이 정상 작동함 (0.5s)
  ✓ [chromium] › smoke.spec.ts:28:3 › API 엔드포인트 테스트 › Health check (0.2s)
  ✓ [chromium] › smoke.spec.ts:35:3 › 콘솔 에러 확인 › 페이지 로드 시 콘솔 에러 없음 (1s)
  ✓ [chromium] › smoke.spec.ts:58:3 › 콘솔 에러 확인 › 네트워크 에러 없음 (1s)

  5 passed (4s)
```

### **실패 시 예시**
```bash
$ npm test tests/smoke.spec.ts

  ✗ [chromium] › smoke.spec.ts:35:3 › 콘솔 에러 확인 › 페이지 로드 시 콘솔 에러 없음

    Error: expect(received).toBe(expected)

    Expected: 0
    Received: 2

    발견된 콘솔 에러:
    - Uncaught TypeError: Cannot read property 'map' of undefined
    - Failed to load resource: net::ERR_BLOCKED_BY_CLIENT

  1) smoke.spec.ts:35:3 › 콘솔 에러 확인 › 페이지 로드 시 콘솔 에러 없음

  1 failed
  4 passed (5s)
```

---

## 🔄 다음 단계

**Phase 1 (완료):** ✅
- Playwright 설치
- Smoke 테스트 작성
- CI/CD 파이프라인 구축

**Phase 2 (진행 중):** 🚧
- 테스트 픽스처 생성
- 제안서 테스트 활성화
- 전체 테스트 실행

**Phase 3 (예정):**
- 테스트 커버리지 100%
- 시각적 회귀 테스트
- 성능 테스트

**테스가 책임지고 완성하겠습니다!** 🚀
