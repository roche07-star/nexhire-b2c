# 마이그레이션 계획: UUID 기반 사용자 식별자 전환

## Executive Summary

**목표:** 이메일 기반 사용자 식별에서 UUID 기반으로 전환하여 보안, 성능, 유연성 개선

**예상 기간:** 4-6주 (개발 2주, 테스트 1주, 배포 1주, 모니터링 1-2주)

**영향 범위:**
- DB 테이블: 15+ 테이블
- API 파일: 93개
- RLS 정책: 7개
- 인증 시스템: JWT, Session

**리스크 레벨:** 🔴 HIGH (전체 시스템 영향)

---

## 1. 현황 분석

### 1.1 현재 아키텍처

**Primary Key:**
```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,  -- ❌ 문제: 이메일이 PK
  ...
);
```

**외래 키 관계:**
```sql
-- 모든 테이블이 email 참조
user_email TEXT REFERENCES users(email)
claimed_by TEXT REFERENCES users(email)
issued_to TEXT              -- FK 아님, 하지만 이메일 저장
```

### 1.2 문제점

1. **보안 문제**
   - 이메일은 PII (개인정보)
   - URL, 로그에 이메일 노출 위험
   - 사용자 추측 가능 (email enumeration)

2. **성능 문제**
   - TEXT 기반 JOIN 느림 (UUID보다 4배)
   - 인덱스 크기 큼
   - 외래 키 체크 오버헤드

3. **유연성 문제**
   - 이메일 변경 시 모든 관련 데이터 업데이트 필요
   - CASCADE UPDATE 성능 저하
   - 이메일 재사용 불가 (탈퇴 후 재가입)

4. **규제 준수**
   - GDPR: 최소 정보 원칙 위반
   - 불필요한 곳에 이메일 노출

---

## 2. 목표 아키텍처

### 2.1 변경 후 스키마

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- ✅ 새로운 PK
  email      TEXT UNIQUE NOT NULL,                        -- 로그인용으로만
  ...
);

-- 외래 키 변경
user_id UUID REFERENCES users(id) ON DELETE CASCADE
```

### 2.2 이점

1. **보안 강화**
   - URL에 UUID 사용 (이메일 노출 없음)
   - 사용자 추측 불가능
   - 로그에 이메일 대신 UUID

2. **성능 개선**
   - UUID JOIN이 TEXT보다 빠름
   - 인덱스 크기 감소
   - 외래 키 체크 최적화

3. **유연성 증가**
   - 이메일 변경 자유로움
   - CASCADE 불필요
   - 이메일 재사용 가능

4. **규제 준수**
   - 최소 정보 원칙 준수
   - 이메일은 인증에만 사용

---

## 3. 영향 범위

### 3.1 DB 테이블 (15개)

#### Core 테이블
1. **users** - PK 변경 (email → id)
2. **analyses** - FK 변경 (user_email → user_id)
3. **jd_analyses** - FK 변경
4. **interview_guides** - FK 변경
5. **coupons** - FK 변경 (claimed_by, issued_to)
6. **payments** - FK 변경 (user_email → user_id)
7. **consents** - FK 변경
8. **jobs** - FK 변경

#### Adam B2C 테이블
9. **audit_logs** - FK 변경
10. **settlements** - FK 변경

#### Eve B2B 테이블
11. **hiring_process** - FK 변경
12. **job_applications** - FK 변경
13. **pipeline** - FK 변경
14. **notes** - FK 변경
15. **tags** - FK 변경

### 3.2 RLS 정책 (7개)

모든 RLS 정책의 `auth.email()` → `auth.uid()` 변경:
- users_policy
- analyses_policy
- jd_analyses_policy
- interview_guides_policy
- coupons_policy
- payments_policy
- consents_policy

### 3.3 코드 파일 (100+)

- **auth.ts** - JWT에 user.id 추가
- **lib/supabase.ts** - 타입 정의
- **app/api/** - 93개 API 파일
- **components/** - 사용자 정보 표시 컴포넌트

### 3.4 RPC 함수 (10+)

```sql
-- 모든 RPC 함수 시그니처 변경
increment_analyze_count(user_email TEXT)
→ increment_analyze_count(user_id UUID)
```

---

## 4. 마이그레이션 전략

### 4.1 점진적 전환 (Zero Downtime)

**Phase 0: 준비 (1일)**
- [ ] 백업 생성
- [ ] 마이그레이션 스크립트 검증
- [ ] 롤백 계획 확정

**Phase 1: 스키마 확장 (1주)**
- [ ] users 테이블에 id 컬럼 추가
- [ ] 기존 사용자에게 UUID 생성
- [ ] 새로운 컬럼에 인덱스 생성
- [ ] 하위 호환 유지 (email도 계속 동작)

**Phase 2: 외래 키 확장 (1주)**
- [ ] 각 테이블에 user_id 컬럼 추가
- [ ] 기존 user_email 데이터로 user_id 채우기
- [ ] user_id에 외래 키 제약 추가
- [ ] 이중 컬럼 유지 (user_email + user_id)

**Phase 3: 코드 전환 (1주)**
- [ ] auth.ts - JWT에 user.id 추가
- [ ] API - user_id 사용하도록 변경
- [ ] RLS 정책 - user_id 기반으로 변경
- [ ] 하위 호환 유지 (email도 읽기 가능)

**Phase 4: 검증 및 정리 (1주)**
- [ ] 전체 기능 테스트
- [ ] 성능 모니터링
- [ ] user_email 컬럼 제거 (FK 아닌 곳만)
- [ ] 레거시 코드 정리

**Phase 5: 최종 정리 (선택)**
- [ ] email FK 완전 제거
- [ ] 마이그레이션 코드 제거
- [ ] 문서 업데이트

---

## 5. 단계별 SQL 스크립트

### Phase 1: users 테이블 확장

```sql
-- ============================================
-- Phase 1: users 테이블에 UUID 추가
-- ============================================

-- STEP 1: id 컬럼 추가
ALTER TABLE users
ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- STEP 2: 기존 사용자에게 UUID 생성 (이미 DEFAULT로 생성됨)
UPDATE users SET id = gen_random_uuid() WHERE id IS NULL;

-- STEP 3: NOT NULL 제약 추가
ALTER TABLE users
ALTER COLUMN id SET NOT NULL;

-- STEP 4: UNIQUE 제약 추가
ALTER TABLE users
ADD CONSTRAINT users_id_unique UNIQUE (id);

-- STEP 5: 인덱스 생성 (성능 최적화)
CREATE INDEX idx_users_id ON users(id);

-- 확인
SELECT email, id, created_at FROM users LIMIT 5;
```

### Phase 2: 외래 키 테이블 확장

```sql
-- ============================================
-- Phase 2: 각 테이블에 user_id 추가
-- ============================================

-- analyses 테이블
ALTER TABLE analyses
ADD COLUMN user_id UUID;

-- 기존 user_email로 user_id 채우기
UPDATE analyses a
SET user_id = u.id
FROM users u
WHERE a.user_email = u.email;

-- NOT NULL 제약 (데이터 검증 후)
ALTER TABLE analyses
ALTER COLUMN user_id SET NOT NULL;

-- 외래 키 제약
ALTER TABLE analyses
ADD CONSTRAINT fk_analyses_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 인덱스
CREATE INDEX idx_analyses_user_id ON analyses(user_id);

-- ============================================
-- jd_analyses, interview_guides도 동일 패턴
-- ============================================

-- jd_analyses
ALTER TABLE jd_analyses ADD COLUMN user_id UUID;
UPDATE jd_analyses a SET user_id = u.id FROM users u WHERE a.user_email = u.email;
ALTER TABLE jd_analyses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE jd_analyses ADD CONSTRAINT fk_jd_analyses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_jd_analyses_user_id ON jd_analyses(user_id);

-- interview_guides
ALTER TABLE interview_guides ADD COLUMN user_id UUID;
UPDATE interview_guides i SET user_id = u.id FROM users u WHERE i.user_email = u.email;
ALTER TABLE interview_guides ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE interview_guides ADD CONSTRAINT fk_interview_guides_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_interview_guides_user_id ON interview_guides(user_id);

-- coupons (claimed_by만, issued_to는 나중에)
ALTER TABLE coupons ADD COLUMN claimed_by_id UUID;
UPDATE coupons c SET claimed_by_id = u.id FROM users u WHERE c.claimed_by = u.email;
ALTER TABLE coupons ADD CONSTRAINT fk_coupons_claimed_by_id FOREIGN KEY (claimed_by_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_coupons_claimed_by_id ON coupons(claimed_by_id);

-- payments
ALTER TABLE payments ADD COLUMN user_id UUID;
UPDATE payments p SET user_id = u.id FROM users u WHERE p.user_email = u.email;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ADD CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- consents
ALTER TABLE consents ADD COLUMN user_id UUID;
UPDATE consents c SET user_id = u.id FROM users u WHERE c.user_email = u.email;
ALTER TABLE consents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE consents ADD CONSTRAINT fk_consents_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_consents_user_id ON consents(user_id);

-- jobs
ALTER TABLE jobs ADD COLUMN user_id UUID;
UPDATE jobs j SET user_id = u.id FROM users u WHERE j.user_email = u.email;
ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_jobs_user_id ON jobs(user_id);

-- 확인: 모든 user_id가 채워졌는지
SELECT 
  (SELECT COUNT(*) FROM analyses WHERE user_id IS NULL) as analyses_null,
  (SELECT COUNT(*) FROM jd_analyses WHERE user_id IS NULL) as jd_null,
  (SELECT COUNT(*) FROM interview_guides WHERE user_id IS NULL) as interview_null,
  (SELECT COUNT(*) FROM payments WHERE user_id IS NULL) as payments_null,
  (SELECT COUNT(*) FROM consents WHERE user_id IS NULL) as consents_null,
  (SELECT COUNT(*) FROM jobs WHERE user_id IS NULL) as jobs_null;
```

### Phase 3: RLS 정책 변경

```sql
-- ============================================
-- Phase 3: RLS 정책을 user_id 기반으로 변경
-- ============================================

-- users 테이블 정책 삭제 및 재생성
DROP POLICY IF EXISTS users_policy ON users;

CREATE POLICY users_policy ON users
FOR ALL
USING (id = auth.uid()::uuid);  -- ✅ auth.uid() 사용

-- analyses 정책
DROP POLICY IF EXISTS analyses_policy ON analyses;

CREATE POLICY analyses_policy ON analyses
FOR ALL
USING (user_id = auth.uid()::uuid);

-- jd_analyses 정책
DROP POLICY IF EXISTS jd_analyses_policy ON jd_analyses;

CREATE POLICY jd_analyses_policy ON jd_analyses
FOR ALL
USING (user_id = auth.uid()::uuid);

-- interview_guides 정책
DROP POLICY IF EXISTS interview_guides_policy ON interview_guides;

CREATE POLICY interview_guides_policy ON interview_guides
FOR ALL
USING (user_id = auth.uid()::uuid);

-- coupons 정책
DROP POLICY IF EXISTS coupons_policy ON coupons;

CREATE POLICY coupons_policy ON coupons
FOR ALL
USING (claimed_by_id = auth.uid()::uuid);

-- payments 정책
DROP POLICY IF EXISTS payments_policy ON payments;

CREATE POLICY payments_policy ON payments
FOR ALL
USING (user_id = auth.uid()::uuid);

-- consents 정책
DROP POLICY IF EXISTS consents_policy ON consents;

CREATE POLICY consents_policy ON consents
FOR ALL
USING (user_id = auth.uid()::uuid);
```

### Phase 4: RPC 함수 변경

```sql
-- ============================================
-- Phase 4: RPC 함수 시그니처 변경
-- ============================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS increment_analyze_count(TEXT);
DROP FUNCTION IF EXISTS increment_jd_count(TEXT);
DROP FUNCTION IF EXISTS increment_rewrite_count(TEXT);
DROP FUNCTION IF EXISTS increment_interview_count(TEXT);
DROP FUNCTION IF EXISTS increment_proposal_count(TEXT);
DROP FUNCTION IF EXISTS check_and_reset_usage(TEXT);
DROP FUNCTION IF EXISTS increment_coupon_used(TEXT);
DROP FUNCTION IF EXISTS try_start_job(TEXT, TEXT);

-- 새로운 함수 (UUID 기반)
CREATE OR REPLACE FUNCTION increment_analyze_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET analyze_count = analyze_count + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- (나머지 함수도 동일 패턴)
```

### Phase 5: 정리 (선택사항)

```sql
-- ============================================
-- Phase 5: 레거시 컬럼 제거 (충분한 검증 후)
-- ============================================

-- ⚠️ 주의: 모든 코드가 user_id로 전환된 후에만 실행

-- 외래 키 제약 제거
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_user_email_fkey;
ALTER TABLE jd_analyses DROP CONSTRAINT IF EXISTS jd_analyses_user_email_fkey;
-- ... (모든 테이블)

-- user_email 컬럼 제거
ALTER TABLE analyses DROP COLUMN user_email;
ALTER TABLE jd_analyses DROP COLUMN user_email;
-- ... (모든 테이블)

-- users 테이블 PK 변경 (최종)
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users ADD PRIMARY KEY (id);
```

---

## 6. 코드 변경 가이드

### 6.1 auth.ts

```typescript
// Before
async jwt({ token, user }) {
  if (user?.email) {
    token.email = user.email  // ✅ RLS용 유지
    // ...
  }
}

// After
async jwt({ token, user }) {
  if (user?.email) {
    token.email = user.email  // ✅ RLS용 유지
    
    // ✅ NEW: user.id 추가
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single()
    
    token.sub = data?.id  // JWT sub claim에 UUID 저장
  }
}

session({ session, token }) {
  if (session.user) {
    session.user.id = token.sub  // ✅ session에 user.id 포함
  }
}
```

### 6.2 API 파일 패턴

```typescript
// Before
const { data } = await supabase
  .from('analyses')
  .select('*')
  .eq('user_email', session.user.email)

// After
const { data } = await supabase
  .from('analyses')
  .select('*')
  .eq('user_id', session.user.id)  // ✅ user_id 사용
```

### 6.3 타입 정의

```typescript
// types/user.ts
export interface User {
  id: string         // ✅ NEW: UUID
  email: string
  name: string | null
  // ...
}

// Session 타입
declare module 'next-auth' {
  interface Session {
    user: {
      id: string      // ✅ NEW
      email: string
      name?: string | null
      // ...
    }
  }
}
```

---

## 7. 테스트 계획

### 7.1 단위 테스트

- [ ] auth.ts JWT 생성 테스트
- [ ] RLS 정책 테스트 (user_id 기반)
- [ ] RPC 함수 테스트 (UUID 파라미터)

### 7.2 통합 테스트

- [ ] 회원가입 → UUID 생성 확인
- [ ] 로그인 → JWT에 user.id 포함 확인
- [ ] 이력서 분석 → user_id로 저장 확인
- [ ] 쿠폰 등록 → claimed_by_id 저장 확인

### 7.3 성능 테스트

- [ ] JOIN 성능 비교 (email vs UUID)
- [ ] 인덱스 크기 비교
- [ ] RLS 정책 성능 측정

### 7.4 보안 테스트

- [ ] URL에 이메일 노출 확인 (없어야 함)
- [ ] 로그에 이메일 최소화 확인
- [ ] RLS 우회 시도 (실패해야 함)

---

## 8. 롤백 계획

### 8.1 Phase별 롤백

**Phase 1 롤백:**
```sql
ALTER TABLE users DROP COLUMN id;
```

**Phase 2 롤백:**
```sql
ALTER TABLE analyses DROP COLUMN user_id;
-- (각 테이블 반복)
```

**Phase 3 롤백:**
```sql
-- RLS 정책을 email 기반으로 복원
DROP POLICY users_policy ON users;
CREATE POLICY users_policy ON users
FOR ALL USING (email = auth.email());
```

### 8.2 긴급 롤백 (전체)

```bash
# Git 롤백
git revert <commit-hash>
git push

# DB 롤백
psql < backup_before_migration.sql
```

---

## 9. 리스크 및 완화 전략

### 9.1 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| 데이터 손실 | 낮음 | 치명적 | 백업 필수, 트랜잭션 사용 |
| 다운타임 | 중간 | 높음 | 점진적 전환, Blue-Green 배포 |
| 성능 저하 | 낮음 | 중간 | 성능 테스트, 인덱스 최적화 |
| 버그 발생 | 중간 | 높음 | 철저한 테스트, 카나리 배포 |
| RLS 보안 허점 | 낮음 | 치명적 | 보안 감사, 침투 테스트 |

### 9.2 완화 전략

1. **백업**
   - 매 Phase 전 전체 DB 백업
   - Point-in-Time Recovery 활성화

2. **점진적 배포**
   - Phase별 검증 후 다음 단계
   - 카나리 배포 (5% → 50% → 100%)

3. **모니터링**
   - 에러율 실시간 모니터링
   - 성능 메트릭 추적
   - 알림 설정

4. **롤백 준비**
   - 각 Phase별 롤백 스크립트 준비
   - 롤백 시뮬레이션 실행

---

## 10. 타임라인

### Week 1-2: 개발
- Phase 1 SQL 실행 (Day 1-2)
- Phase 2 SQL 실행 (Day 3-5)
- auth.ts 수정 (Day 6-7)
- API 파일 수정 시작 (Day 8-10)

### Week 3: 코드 전환
- API 파일 수정 완료 (Day 11-15)
- 컴포넌트 수정 (Day 16-17)

### Week 4: 테스트
- 단위 테스트 (Day 18-19)
- 통합 테스트 (Day 20-21)
- 성능 테스트 (Day 22)

### Week 5: 배포
- Staging 배포 (Day 23-24)
- Production 카나리 배포 (Day 25-26)
- 전체 배포 (Day 27)

### Week 6: 모니터링 및 정리
- 성능 모니터링 (Day 28-30)
- Phase 5 정리 (Day 31-33, 선택)

---

## 11. 체크리스트

### 사전 준비
- [ ] 전체 DB 백업 생성
- [ ] 롤백 계획 검증
- [ ] 팀원 교육 (마이그레이션 절차)
- [ ] 모니터링 대시보드 설정

### Phase 1
- [ ] users 테이블 id 컬럼 추가
- [ ] 기존 사용자 UUID 생성
- [ ] 인덱스 생성
- [ ] 검증 쿼리 실행

### Phase 2
- [ ] 각 테이블 user_id 추가
- [ ] 데이터 마이그레이션 (user_email → user_id)
- [ ] 외래 키 제약 추가
- [ ] NULL 체크 (0건이어야 함)

### Phase 3
- [ ] auth.ts 수정
- [ ] JWT에 user.id 포함 확인
- [ ] 93개 API 파일 수정
- [ ] RLS 정책 변경

### Phase 4
- [ ] 전체 기능 테스트
- [ ] 성능 테스트
- [ ] 보안 감사
- [ ] Production 배포

### Phase 5 (선택)
- [ ] 레거시 컬럼 제거
- [ ] 문서 업데이트
- [ ] 마이그레이션 코드 정리

---

## 12. 참고 자료

- **Supabase UUID Best Practices**: https://supabase.com/docs/guides/database/postgres/uuid
- **PostgreSQL UUID Performance**: https://www.postgresql.org/docs/current/datatype-uuid.html
- **RLS with UUID**: https://supabase.com/docs/guides/auth/row-level-security

---

## 13. 연락처

**질문/이슈:**
- GitHub Issues: https://github.com/roche07-star/nexhire-b2c/issues
- 긴급: roche07he@gmail.com

---

**문서 버전:** 1.0
**작성일:** 2026-07-08
**작성자:** MIR Team (DIVA, DIA, Claude)
