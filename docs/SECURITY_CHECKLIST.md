# 🔐 보안 체크리스트

프로덕션 배포 전 필수 확인 사항

---

## ✅ 환경변수 설정 (Vercel Dashboard)

### 1. 인증
- [ ] `NEXTAUTH_SECRET` - openssl rand -base64 32로 생성
- [ ] `NEXTAUTH_URL` - https://yourdomain.com
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### 2. 데이터베이스
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY`

### 3. AI API
- [ ] `ANTHROPIC_API_KEY` - 프로덕션용 키

### 4. 캐시 & Rate Limiting
- [ ] `KV_REST_API_URL` (Vercel KV 자동 생성)
- [ ] `KV_REST_API_TOKEN` (Vercel KV 자동 생성)
- [ ] `VERCEL_KV_REST_API_URL` (Vercel KV 자동 생성)

### 5. 결제 게이트웨이
#### PortOne (프로덕션 모드)
- [ ] `NEXT_PUBLIC_PORTONE_STORE_ID` - 실제 Store ID
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` - 프로덕션 채널 키
- [ ] `PORTONE_API_SECRET` - 프로덕션 API Secret

#### Toss Payments (프로덕션 모드)
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY` - 실제 클라이언트 키 (live_ck_...)
- [ ] `TOSS_SECRET_KEY` - 실제 시크릿 키 (live_sk_...)

### 6. 알림
- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_ADMIN_CHAT_ID`
- [ ] `SLACK_SECURITY_WEBHOOK_URL`

### 7. 모니터링 (선택)
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`

---

## 🔒 보안 설정 확인

### 1. API 보안
- [x] NextAuth 세션 인증
- [x] Super Admin 권한 체크
- [x] Rate Limiting (Vercel KV)
- [x] IP 차단 시스템
- [x] PII 마스킹

### 2. 네트워크 보안
- [x] CSP 헤더 설정
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy 설정
- [x] CORS 정책 (Same-origin)

### 3. 데이터 보안
- [x] 환경변수 .gitignore
- [x] .env.example 제공
- [x] Supabase Row Level Security (RLS)
- [x] 민감 정보 마스킹

---

## 🚨 프로덕션 배포 전 필수 확인

### 1. 결제 시스템
```bash
# PortOne 프로덕션 모드 확인
- 테스트 키(test_)가 아닌 실제 키 사용 확인
- Webhook URL 설정 확인
- 환불 플로우 테스트

# Toss Payments 프로덕션 모드 확인
- 테스트 키(test_)가 아닌 실제 키(live_) 사용 확인
- 결제 플로우 End-to-End 테스트
```

### 2. API 키 검증
```bash
# Anthropic API
- 월간 사용량 한도 확인
- 비용 알림 설정

# Supabase
- 프로덕션 프로젝트 사용 확인
- 데이터베이스 백업 설정
- RLS 정책 활성화 확인
```

### 3. Rate Limiting
```bash
# Vercel KV 연결 확인
curl https://your-domain.com/api/analyze \
  -H "Cookie: authjs.session-token=..." \
  -X POST \
  --data-binary @test.pdf

# 응답 헤더 확인
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

### 4. 보안 헤더 확인
```bash
# 배포 후 헤더 검증
curl -I https://your-domain.com

# 확인 항목
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy
```

---

## 🔐 보안 모니터링

### 1. Sentry 에러 추적
- [ ] Sentry DSN 설정
- [ ] 에러 알림 설정
- [ ] 사용자 컨텍스트 확인

### 2. 텔레그램 알림
- [ ] 결제 성공/실패 알림
- [ ] 보안 이벤트 알림
- [ ] 관리자 작업 알림

### 3. Slack 보안 알림
- [ ] 비정상 사용 패턴 감지
- [ ] IP 차단 알림
- [ ] API 남용 탐지

---

## 🛡️ 취약점 대응

### 1. SQL Injection
- [x] Supabase 파라미터화된 쿼리 사용
- [x] 사용자 입력 검증

### 2. XSS (Cross-Site Scripting)
- [x] CSP 헤더로 인라인 스크립트 제한
- [x] React의 자동 이스케이핑

### 3. CSRF (Cross-Site Request Forgery)
- [x] NextAuth CSRF 토큰
- [x] Same-origin 정책

### 4. Clickjacking
- [x] X-Frame-Options: DENY
- [x] CSP frame-ancestors 'none'

### 5. 무차별 대입 공격
- [x] Rate Limiting
- [x] 로그인 시도 제한 (5분당 5회)

---

## 📋 정기 보안 점검 (월 1회)

### 1. 의존성 업데이트
```bash
npm audit
npm audit fix

# 주요 패키지 버전 확인
- next
- @anthropic-ai/sdk
- @supabase/supabase-js
- next-auth
```

### 2. 접근 로그 분석
```sql
-- Supabase에서 비정상 접근 패턴 조회
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### 3. API 사용량 모니터링
- Anthropic API 사용량
- Supabase DB 용량
- Vercel KV 사용량

---

## 🔗 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Vercel Security Best Practices](https://vercel.com/docs/security/secure-your-application)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
