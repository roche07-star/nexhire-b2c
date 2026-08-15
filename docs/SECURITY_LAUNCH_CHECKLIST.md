# 🔒 Adam 정식 오픈 전 보안 체크리스트

**작성자:** 코난 (CISO)  
**목적:** 정식 오픈 전 필수 보안 점검  
**업데이트:** 2026-08-15

---

## ✅ 1. 인증 / 권한

### 1.1 인증 시스템
- [x] NextAuth.js 설정 완료
- [x] Google OAuth 연동
- [x] 세션 관리 (JWT)
- [ ] Session timeout 설정 (권장: 7일)
- [ ] Refresh token 구현 (선택)

### 1.2 권한 관리
- [x] User Type 구분 (JOBSEEKER, HEADHUNTER, MANAGER, SUPER_ADMIN)
- [x] 플랜별 기능 제한 (FREE/PRO/EXPERT)
- [x] Middleware 인증 체크
- [ ] API 라우트별 권한 검증

---

## ✅ 2. 데이터 보호

### 2.1 HTTPS
- [x] Vercel 자동 HTTPS
- [ ] Custom domain (jobizic.com) SSL 확인
- [ ] HSTS 헤더 설정

### 2.2 이력서 파일 보안
- [ ] 파일 업로드 타입 검증 (PDF, DOC, DOCX만)
- [ ] 파일 크기 제한 (권장: 10MB)
- [ ] 악성 파일 스캔 (선택)
- [ ] 파일 저장 암호화 (Supabase Storage)

### 2.3 데이터베이스
- [x] Supabase RLS (Row Level Security) 설정
- [x] 개인정보 접근 로그
- [ ] 백업 자동화 (Supabase 기본 제공)
- [ ] 데이터 암호화 (at rest)

---

## ✅ 3. API 보안

### 3.1 Rate Limiting
- [x] Sentry Rate Limiting (분당 5회)
- [ ] API 라우트별 Rate Limit
  - `/api/analyze`: 분당 3회
  - `/api/payment`: 분당 1회
- [ ] IP 기반 차단 (Vercel Firewall)

### 3.2 Input Validation
- [ ] 이력서 텍스트 길이 제한
- [ ] SQL Injection 방어 (Supabase ORM 사용)
- [ ] XSS 방어 (React 기본 제공)
- [ ] CSRF 방어 (NextAuth.js 기본 제공)

### 3.3 API 키 관리
- [x] 환경변수 분리 (.env.local)
- [x] Anthropic API Key 서버 사이드만 사용
- [x] Supabase Service Role Key 서버 사이드만 사용
- [ ] API 키 교체 프로세스 문서화

---

## ✅ 4. 웹 보안

### 4.1 헤더 보안
```typescript
// next.config.mjs에 추가 필요
headers: [
  {
    source: '/(.*)',
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
    ],
  },
]
```

- [ ] X-Content-Type-Options
- [ ] X-Frame-Options
- [ ] X-XSS-Protection
- [ ] Referrer-Policy
- [ ] Content-Security-Policy (선택)

### 4.2 쿠키 보안
- [x] HttpOnly 플래그
- [x] Secure 플래그 (HTTPS)
- [x] SameSite 설정

---

## ✅ 5. 개인정보 보호

### 5.1 법적 문서
- [ ] 개인정보처리방침 게시
- [ ] 이용약관 게시
- [ ] 쿠키 정책 게시
- [ ] 환불 정책 게시

### 5.2 사용자 권리
- [ ] 개인정보 다운로드 기능
- [ ] 회원 탈퇴 기능
- [ ] 데이터 삭제 요청 프로세스

### 5.3 제3자 공유
- [ ] Anthropic (Claude AI) - 이력서 분석용
- [ ] Vercel - 호스팅
- [ ] Supabase - 데이터베이스
- [ ] 개인정보처리방침에 명시

---

## ✅ 6. 결제 보안

### 6.1 PortOne (NHN KCP)
- [x] PG사 연동 (PortOne V2)
- [x] 결제 검증 (서버 사이드)
- [ ] 결제 로그 저장
- [ ] 환불 프로세스 문서화

### 6.2 민감 정보
- [ ] 카드 정보 직접 저장 금지 (PG사 처리)
- [ ] 결제 내역 암호화
- [ ] 거래 ID 로깅

---

## ✅ 7. 모니터링 / 로깅

### 7.1 Sentry
- [x] 에러 자동 캡처
- [x] User Context 포함
- [x] Slack 알림 연동
- [ ] 보안 이벤트 필터링

### 7.2 Supabase Audit
- [x] 데이터베이스 접근 로그
- [ ] 민감 데이터 조회 알림
- [ ] 비정상 패턴 감지

---

## ✅ 8. 사고 대응

### 8.1 보안 사고 대응 계획
1. **발견**: Sentry/Slack 알림
2. **평가**: 심각도 판단 (Critical/High/Medium/Low)
3. **격리**: 공격 차단 (IP 차단, API 키 교체)
4. **복구**: 데이터 복구, 패치 배포
5. **보고**: 사용자 공지, 개인정보보호위원회 신고 (필요 시)

### 8.2 긴급 연락망
- **코난 (CISO)**: [연락처]
- **디바 (Backend)**: [연락처]
- **ROCHE (CEO)**: [연락처]

---

## ✅ 9. 컴플라이언스

### 9.1 GDPR (선택, 글로벌 서비스 시)
- [ ] 동의 수집
- [ ] 데이터 다운로드 권리
- [ ] 삭제 권리 (Right to be forgotten)

### 9.2 개인정보보호법 (한국)
- [ ] 개인정보 수집 동의
- [ ] 개인정보처리방침 게시
- [ ] 개인정보 관리책임자 지정

---

## ✅ 10. 오픈 전 최종 점검

### Critical (오픈 블로커)
- [ ] **HTTPS 적용**
- [ ] **환경변수 분리**
- [ ] **개인정보처리방침 게시**
- [ ] **결제 검증 로직**
- [ ] **Sentry 에러 모니터링**

### High (1주 이내 해결)
- [ ] Rate Limiting
- [ ] 보안 헤더 설정
- [ ] 파일 업로드 검증
- [ ] API 권한 검증

### Medium (1개월 이내)
- [ ] 데이터 암호화
- [ ] 보안 감사 로그
- [ ] 침투 테스트

---

## 🚨 보안 취약점 발견 시

**즉시 보고:**
1. Slack #dev-alerts 채널
2. 코난 (CISO) 직접 연락
3. 디바 (Backend Lead)

**심각도 판단:**
- **Critical**: 즉시 서비스 중단 (데이터 유출, 인증 우회)
- **High**: 24시간 이내 패치 (XSS, SQL Injection)
- **Medium**: 1주 이내 패치 (정보 노출)
- **Low**: 다음 릴리스 시 수정

---

## 📋 보안 체크리스트 서명

**코난 (CISO) 최종 승인:**
- [ ] Critical 항목 100% 완료
- [ ] High 항목 90% 이상 완료
- [ ] 보안 사고 대응 계획 수립
- [ ] 긴급 연락망 구축

**승인 날짜:** _____________

**서명:** 코난 (CONAN)

---

**보안 승인 후 오픈 진행 가능!** 🔒✅
