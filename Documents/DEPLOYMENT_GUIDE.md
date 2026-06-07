# NexHire B2C (adam) - Deployment Guide

**작성일**: 2026-06-07  
**담당**: 디바 (S/W 총괄)

---

## 🚀 배포 환경

### Production
- **URL**: https://jobizic.vercel.app/
- **플랫폼**: Vercel
- **브랜치**: `main` (자동 배포)
- **배포 트리거**: `git push origin main`

### Development
- **URL**: http://localhost:3000
- **실행**: `npm run dev`

---

## 📋 환경변수 체크리스트

### 1. Vercel Dashboard 설정 (필수)

Vercel Dashboard > Project > Settings > Environment Variables

#### Production Environment Variables

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qpsudbdcmnudpiqddbou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# NextAuth
NEXTAUTH_SECRET=xxxxx (openssl rand -base64 32로 생성)
NEXTAUTH_URL=https://jobizic.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Manager Emails (EXPERT 플랜 자동 부여)
MANAGER_EMAILS=roche07he@gmail.com,other@example.com
```

**중요**: 
- 모든 환경변수는 `Production`, `Preview`, `Development` 모두 체크
- `NEXTAUTH_URL`은 프로덕션에서 반드시 `https://jobizic.vercel.app` (trailing slash 없음)

---

## 🔧 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/roche07-star/nexhire-b2c.git
cd nexhire-b2c
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
# .env.local.example을 복사
cp .env.local.example .env.local

# .env.local 파일 편집 (실제 API 키 입력)
# - ANTHROPIC_API_KEY
# - SUPABASE 관련 키 3개
# - NEXTAUTH_SECRET
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - MANAGER_EMAILS
```

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

### 5. 빌드 테스트 (배포 전 필수)
```bash
npm run build
npm start
```

---

## 🔑 API 키 발급 가이드

### 1. Anthropic API Key
1. https://console.anthropic.com/ 접속
2. Settings > API Keys
3. Create Key
4. 복사 후 환경변수에 설정

**현재 사용 모델**:
- 기본: `claude-haiku-4-5-20251001` (빠름, 저렴)
- 면접 가이드: `claude-sonnet-4-5` (고품질)

### 2. Supabase Keys
1. https://supabase.com/dashboard 접속
2. Project Settings > API
3. 3개 키 복사:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 클라이언트 노출 금지)

### 3. Google OAuth
1. https://console.cloud.google.com/ 접속
2. APIs & Services > Credentials
3. Create Credentials > OAuth 2.0 Client IDs
4. Application type: Web application
5. Authorized redirect URIs 추가:
   - `http://localhost:3000/api/auth/callback/google` (로컬)
   - `https://jobizic.vercel.app/api/auth/callback/google` (프로덕션)
6. Client ID, Client Secret 복사

### 4. NextAuth Secret
```bash
# 터미널에서 실행
openssl rand -base64 32
# 출력된 값을 NEXTAUTH_SECRET에 설정
```

---

## 📊 Supabase Database 관리

### Migration 실행
```bash
# Supabase CLI 설치 (한 번만)
npm install -g supabase

# 로컬 Supabase 시작
supabase start

# Migration 적용
supabase db push

# Production에 적용 (⚠️ 주의)
supabase db push --db-url "postgresql://postgres:[password]@[host]:5432/postgres"
```

### 주요 테이블
- `users` — 사용자 정보, 플랜, 역할
- `analyses` — 이력서 분석 결과
- `jd_analyses` — JD 기반 분석 결과
- `interview_guides` — 면접 가이드 (10일 만료)
- `jd_templates` — JD 템플릿
- `coupons` — 쿠폰
- `coupon_redemptions` — 쿠폰 사용 기록

### RLS (Row Level Security)
- **현재 상태**: Service Role Key로 RLS 우회 중
- **이유**: 서버 사이드에서만 DB 접근 (안전)
- **주의**: Anon Key는 클라이언트에서 Storage 접근용

---

## 🚨 배포 전 체크리스트

### 코드 품질
- [ ] `npm run lint` 통과
- [ ] `npm run build` 성공
- [ ] TypeScript 에러 없음
- [ ] Console 에러/경고 없음

### 기능 테스트 (로컬)
- [ ] 로그인/로그아웃 정상 동작
- [ ] 이력서 분석 (PDF/DOCX/TXT)
- [ ] JD 기반 분석
- [ ] 이력서 생성 (DOCX/PDF 다운로드)
- [ ] 면접 가이드 (EXPERT 플랜)
- [ ] Admin 페이지 (ADMIN role)

### 환경변수 확인
- [ ] Vercel 환경변수 모두 설정됨
- [ ] `NEXTAUTH_URL` = `https://jobizic.vercel.app` (trailing slash 없음)
- [ ] Google OAuth redirect URI에 프로덕션 URL 추가
- [ ] `MANAGER_EMAILS` 정확한 이메일 입력

### 보안
- [ ] `.env.local` 파일 git ignore 확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY` Vercel에만 설정 (코드에 하드코딩 금지)
- [ ] API 라우트에서 인증 체크
- [ ] CORS 설정 확인

---

## 🐛 트러블슈팅

### 1. "Invalid redirect URI" (Google OAuth 에러)
**원인**: Google OAuth redirect URI 미등록  
**해결**: Google Console > Credentials에서 redirect URI 추가
```
https://jobizic.vercel.app/api/auth/callback/google
```

### 2. "Failed to fetch" (Supabase 연결 실패)
**원인**: Supabase URL/Key 오류  
**해결**: 
1. Vercel 환경변수 확인
2. Supabase Dashboard에서 키 재확인
3. `NEXT_PUBLIC_` 접두사 확인 (클라이언트 노출용)

### 3. "Anthropic API Error: 401"
**원인**: API 키 오류 또는 크레딧 부족  
**해결**:
1. https://console.anthropic.com/ 에서 키 확인
2. Billing 페이지에서 크레딧 확인
3. 키 재발급 후 Vercel 환경변수 업데이트

### 4. "Function execution timeout" (Vercel)
**원인**: API 라우트 60초 초과  
**해결**:
1. `vercel.json` 또는 API route에서 `maxDuration` 확인
2. 현재 설정: 60초 (Hobby 플랜 최대)
3. Prompt Caching으로 응답 속도 개선 (90% 빨라짐)

### 5. 면접 가이드 생성 실패
**원인**: `max_tokens` 부족 또는 tool schema 불일치  
**해결**:
1. `POST /api/analyze/interview` 확인
2. `max_tokens: 8192` 설정 확인
3. `reverse_questions` 정확히 3개 생성 확인

---

## 📈 모니터링

### Vercel Dashboard
- **Deployments**: 배포 상태, 로그
- **Analytics**: 트래픽, 성능
- **Logs**: 실시간 에러 로그 (Functions > Logs)

### Supabase Dashboard
- **Table Editor**: 데이터 직접 조회/수정
- **SQL Editor**: 커스텀 쿼리 실행
- **Logs**: Database, API, Auth 로그

### Anthropic Console
- **Usage**: API 호출량, 비용
- **Prompt Caching**: 캐시 히트율 (90% 목표)

---

## 🔄 배포 프로세스

### 일반 배포 (기능 추가/버그 수정)
```bash
# 1. 로컬 테스트
npm run build
npm start

# 2. Git 커밋
git add .
git commit -m "feat: 새 기능 추가"

# 3. Push (자동 배포 트리거)
git push origin main

# 4. Vercel Dashboard에서 배포 확인
# https://vercel.com/nexhire-s-projects/nexhire-b2c/deployments
```

### 긴급 롤백
```bash
# Vercel Dashboard > Deployments
# 이전 성공한 배포 선택 > Promote to Production
```

### 환경변수 변경
```bash
# Vercel Dashboard > Settings > Environment Variables
# 변경 후 Redeploy 필요 (Deployments > ... > Redeploy)
```

---

## 📞 연락처 및 권한

### 서비스 관리자
- **Vercel**: roche07he@gmail.com
- **Supabase**: roche07he@gmail.com
- **Google Cloud**: roche07he@gmail.com
- **Anthropic**: roche07he@gmail.com

### 팀원 초대 방법
1. **Vercel**: Settings > Team > Invite (디바, 디아, 테스)
2. **Supabase**: Settings > Team > Invite (디바)
3. **GitHub**: Settings > Collaborators (디바, 디아, 테스)

---

## 📝 배포 기록

### 2026-06-03
- ✅ Prompt Caching 적용 (90% 비용 절감)
- ✅ 모바일 반응형 최적화

### 2026-06-01
- ✅ JD 템플릿 DB 저장 (localStorage → Supabase)

### 2026-05-28
- ✅ 분석 품질 개선 (일관성, 키워드 강조)

---

**작성일**: 2026-06-07  
**문서 버전**: 1.0  
**담당**: 디바 (S/W 총괄)
