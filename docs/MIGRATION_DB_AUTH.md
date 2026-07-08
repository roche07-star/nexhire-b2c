# 마이그레이션 가이드: DB 기반 권한 검증

## 개요

환경변수 `MANAGER_EMAILS` 제거하고 DB `user_type` 필드 기반 권한 검증으로 전환

**변경 사항:**
- ❌ 환경변수로 관리자 지정 (정적, 배포 필요)
- ✅ DB로 관리자 지정 (동적, 즉시 반영)

---

## 마이그레이션 단계

### ⚠️ 중요: 반드시 순서대로 진행

### 1단계: 현재 MANAGER_EMAILS 확인

`.env.local` 파일에서 현재 설정된 관리자 이메일 확인:

```bash
MANAGER_EMAILS=roche07he@gmail.com,admin@example.com
```

### 2단계: SQL 실행 (배포 전 필수!)

**Supabase Dashboard → SQL Editor**에서 실행:

```sql
-- 기존 매니저를 SUPER_ADMIN으로 설정
UPDATE users
SET
  user_type = 'SUPER_ADMIN',
  plan = 'EXPERT'
WHERE email IN (
  -- ✅ .env.local의 MANAGER_EMAILS 값으로 교체
  'roche07he@gmail.com'
  -- 'admin@example.com',
  -- 'manager@example.com'
);

-- 확인
SELECT email, user_type, plan, created_at
FROM users
WHERE user_type = 'SUPER_ADMIN';
```

### 3단계: 코드 배포

```bash
git push
```

Vercel에서 자동 배포됨.

### 4단계: 배포 후 확인

1. **관리자 계정 로그인**
   - 정상 로그인되는지 확인
   - `/admin` 페이지 접근 가능한지 확인

2. **일반 사용자 로그인**
   - 정상 로그인되는지 확인
   - `/admin` 페이지 접근 불가능한지 확인

### 5단계: .env.local 정리 (선택사항)

배포 후 정상 동작 확인되면 `.env.local`에서 제거:

```bash
# ❌ 더 이상 사용하지 않음
# MANAGER_EMAILS=roche07he@gmail.com
```

---

## 새로운 관리자 추가 방법

### 방법 1: Admin 페이지에서 추가 (권장)

1. SUPER_ADMIN 계정으로 로그인
2. `/admin` → 사용자 목록
3. 대상 사용자 찾기
4. `user_type` 변경: `MANAGER` 또는 `SUPER_ADMIN`

### 방법 2: SQL로 직접 추가

```sql
UPDATE users
SET
  user_type = 'SUPER_ADMIN',
  plan = 'EXPERT'
WHERE email = 'new-admin@example.com';
```

---

## 권한 레벨

| user_type    | 권한                          | 용도                     |
|--------------|-------------------------------|--------------------------|
| SUPER_ADMIN  | 무제한 + Admin 페이지 접근    | 시스템 최고 관리자       |
| MANAGER      | 무제한 + Admin 페이지 접근    | 운영 관리자              |
| HEADHUNTER   | 플랜별 제한 (proposal 가능)   | 헤드헌터 회원            |
| JOBSEEKER    | 플랜별 제한 (proposal 불가)   | 구직자 회원              |

---

## 롤백 방법

문제 발생 시 긴급 롤백:

1. **Git 롤백**
   ```bash
   git revert HEAD
   git push
   ```

2. **환경변수 복원** (이전 방식으로 되돌림)
   ```bash
   # .env.local
   MANAGER_EMAILS=roche07he@gmail.com
   ```

---

## 변경된 파일

- `auth.ts` - MANAGER_EMAILS 제거, DB user_type 기반 권한
- `CLAUDE.md` - 문서 업데이트
- `supabase-migration-set-super-admin.sql` - 마이그레이션 SQL

---

## 주의사항

⚠️ **SQL 실행 없이 배포하면 기존 관리자 권한 상실!**

- 배포 전 반드시 SQL 실행
- 최소 1명 이상의 SUPER_ADMIN 필요
- 테스트 환경 먼저 적용 권장
