# 법적 준수 및 감사 추적 검증 가이드

## 개요

Soft Delete 구조의 법적 준수(GDPR/PIPA, 세법) 및 감사 추적 기능 검증 방법

---

## 1. Soft Delete 검증

### 1.1 탈퇴 후 데이터 상태 확인

```sql
-- 탈퇴한 사용자 조회
SELECT
  email,
  status,
  name,              -- NULL이어야 함 (익명화)
  image,             -- NULL이어야 함 (익명화)
  withdraw_requested_at,
  data_delete_at
FROM users
WHERE status IN ('withdrawing', 'withdrawn')
ORDER BY withdraw_requested_at DESC;
```

**기대 결과:**
- `name`: NULL (익명화 완료)
- `image`: NULL (익명화 완료)
- `status`: 'withdrawing' 또는 'withdrawn'

### 1.2 Soft Delete된 데이터 확인

```sql
-- Soft delete된 분석 데이터 조회
SELECT
  'analyses' as table_name,
  COUNT(*) as total,
  COUNT(deleted_at) as soft_deleted,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count
FROM analyses
WHERE user_email = 'test@example.com'

UNION ALL

SELECT
  'jd_analyses',
  COUNT(*),
  COUNT(deleted_at),
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM jd_analyses
WHERE user_email = 'test@example.com'

UNION ALL

SELECT
  'interview_guides',
  COUNT(*),
  COUNT(deleted_at),
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM interview_guides
WHERE user_email = 'test@example.com'

UNION ALL

SELECT
  'jobs',
  COUNT(*),
  COUNT(deleted_at),
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM jobs
WHERE user_email = 'test@example.com';
```

**기대 결과:**
- `deleted_count > 0`: Soft delete 적용됨
- 데이터는 여전히 존재 (hard delete 아님)

### 1.3 복구 가능성 확인

```sql
-- 복구 가능한 데이터 조회 (deleted_at이 있지만 아직 존재)
SELECT
  id,
  user_email,
  deleted_at,
  created_at,
  -- 복구 가능 기간 (90일)
  deleted_at + INTERVAL '90 days' as hard_delete_date,
  -- 남은 일수
  EXTRACT(DAY FROM (deleted_at + INTERVAL '90 days' - NOW())) as days_until_permanent_delete
FROM analyses
WHERE user_email = 'test@example.com'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

**기대 결과:**
- `days_until_permanent_delete > 0`: 복구 가능
- `days_until_permanent_delete < 0`: 곧 영구 삭제 예정

---

## 2. 감사 로그 검증

### 2.1 탈퇴 감사 로그 확인

```sql
-- 특정 사용자의 탈퇴 관련 감사 로그
SELECT
  id,
  action,
  user_email,
  deletion_stage,
  details,
  created_at
FROM audit_logs
WHERE user_email = 'test@example.com'
  AND action IN ('user_withdraw', 'user_withdrawn', 'data_hard_deleted')
ORDER BY created_at DESC;
```

**기대 결과:**
```json
{
  "action": "user_withdraw",
  "deletion_stage": "immediate",
  "details": {
    "status": "withdrawing",
    "plan": "FREE",
    "withdraw_type": "immediate"
  }
}
```

### 2.2 삭제 단계별 로그 확인

```sql
-- 삭제 단계별 집계
SELECT
  deletion_stage,
  COUNT(*) as count,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM audit_logs
WHERE action IN ('user_withdraw', 'user_withdrawn', 'data_hard_deleted')
GROUP BY deletion_stage
ORDER BY
  CASE deletion_stage
    WHEN 'immediate' THEN 1
    WHEN 'soft' THEN 2
    WHEN 'hard' THEN 3
    ELSE 4
  END;
```

**기대 결과:**
- `immediate`: 즉시 익명화 기록
- `soft`: 30일 soft delete 기록
- `hard`: 90일 hard delete 기록

### 2.3 감사 추적 완전성 확인

```sql
-- 탈퇴한 사용자 중 감사 로그가 없는 경우 찾기 (있으면 안 됨)
SELECT u.email, u.status, u.withdraw_requested_at
FROM users u
LEFT JOIN audit_logs a ON u.email = a.user_email
  AND a.action IN ('user_withdraw', 'user_withdrawn')
WHERE u.status IN ('withdrawing', 'withdrawn')
  AND a.id IS NULL;
```

**기대 결과:**
- 0건 (모든 탈퇴에 감사 로그 존재)

---

## 3. 법적 보존 검증 (GDPR/세법)

### 3.1 결제 정보 보존 확인 (세법: 5년)

```sql
-- 탈퇴한 사용자의 결제 정보가 보존되는지 확인
SELECT
  u.email,
  u.status,
  u.withdraw_requested_at,
  COUNT(p.id) as payment_count,
  SUM(p.amount) as total_amount
FROM users u
LEFT JOIN payments p ON u.email = p.user_email
WHERE u.status IN ('withdrawing', 'withdrawn')
GROUP BY u.email, u.status, u.withdraw_requested_at
HAVING COUNT(p.id) > 0
ORDER BY u.withdraw_requested_at DESC;
```

**기대 결과:**
- `payment_count > 0`: 결제 정보 보존됨 ✅
- 탈퇴해도 payments 테이블 데이터 존재

### 3.2 쿠폰 보존 확인 (부정사용 방지)

```sql
-- 탈퇴한 사용자의 쿠폰 기록 보존 확인
SELECT
  u.email,
  u.status,
  COUNT(c.id) as coupon_count,
  SUM(c.used) as total_used
FROM users u
LEFT JOIN coupons c ON u.email = c.claimed_by
WHERE u.status IN ('withdrawing', 'withdrawn')
GROUP BY u.email, u.status
HAVING COUNT(c.id) > 0;
```

**기대 결과:**
- 쿠폰 기록 보존됨 (부정사용 방지)

### 3.3 삭제되어야 할 데이터 확인

```sql
-- 탈퇴 후 삭제되어야 할 데이터 (개인정보)
SELECT
  email,
  name,              -- NULL이어야 함
  image,             -- NULL이어야 함
  status
FROM users
WHERE status IN ('withdrawing', 'withdrawn')
  AND (name IS NOT NULL OR image IS NOT NULL);
```

**기대 결과:**
- 0건 (모든 개인정보 익명화됨)

---

## 4. GDPR/PIPA 준수 검증

### 4.1 삭제 요청 증빙

```sql
-- GDPR Article 17: Right to Erasure (삭제권)
-- 사용자 삭제 요청 시점 기록
SELECT
  email,
  withdraw_requested_at as deletion_request_date,
  data_delete_at as scheduled_deletion_date,
  status,
  -- 처리 기간 (30일 이내 처리)
  data_delete_at - withdraw_requested_at as processing_period
FROM users
WHERE status IN ('withdrawing', 'withdrawn')
ORDER BY withdraw_requested_at DESC;
```

**GDPR 준수 체크:**
- ✅ 삭제 요청 기록 (`withdraw_requested_at`)
- ✅ 삭제 예정일 기록 (`data_delete_at`)
- ✅ 처리 기간 30일 이내

### 4.2 데이터 최소화 원칙

```sql
-- GDPR Article 5(1)(c): Data Minimization
-- 필요 이상의 개인정보를 보유하지 않는지 확인
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('analyses', 'jd_analyses', 'interview_guides')
  AND column_name IN ('name', 'phone', 'address', 'ssn')
ORDER BY table_name, column_name;
```

**기대 결과:**
- 0건 (분석 데이터에 개인식별정보 없음)

### 4.3 복구 요청 대응 능력

```sql
-- 실수로 탈퇴한 경우 복구 가능한 데이터 조회
SELECT
  'analyses' as data_type,
  COUNT(*) as recoverable_items
FROM analyses
WHERE user_email = 'test@example.com'
  AND deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '90 days'

UNION ALL

SELECT 'jd_analyses', COUNT(*)
FROM jd_analyses
WHERE user_email = 'test@example.com'
  AND deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '90 days'

UNION ALL

SELECT 'interview_guides', COUNT(*)
FROM interview_guides
WHERE user_email = 'test@example.com'
  AND deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '90 days';
```

**기대 결과:**
- 90일 이내 데이터는 복구 가능

---

## 5. 세법 준수 검증 (한국)

### 5.1 전자세금계산서 보존 (5년)

```sql
-- 국세기본법 제85조의3: 장부 등의 비치와 보존
-- 결제 기록 5년 보존 여부 확인
SELECT
  EXTRACT(YEAR FROM paid_at) as payment_year,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount,
  -- 5년 보존 기한
  MIN(paid_at) + INTERVAL '5 years' as retention_deadline,
  -- 삭제 가능 여부
  CASE
    WHEN MIN(paid_at) + INTERVAL '5 years' < NOW() THEN 'Deletable'
    ELSE 'Must Retain'
  END as retention_status
FROM payments
GROUP BY EXTRACT(YEAR FROM paid_at)
ORDER BY payment_year DESC;
```

**세법 준수 체크:**
- ✅ 5년 이내 결제 기록 보존
- ⚠️ 5년 경과 기록만 삭제 가능

### 5.2 부가가치세법 준수

```sql
-- 부가가치세법 시행령 제74조: 세금계산서 보관
-- 결제 정보 및 영수증 데이터 보존 확인
SELECT
  p.user_email,
  p.amount,
  p.paid_at,
  p.transaction_id,
  -- 보존 기한
  p.paid_at + INTERVAL '5 years' as retention_end_date,
  -- 삭제 가능까지 남은 일수
  EXTRACT(DAY FROM (p.paid_at + INTERVAL '5 years' - NOW())) as days_until_deletable
FROM payments p
WHERE p.user_email IN (
  SELECT email FROM users WHERE status IN ('withdrawing', 'withdrawn')
)
ORDER BY p.paid_at DESC;
```

**기대 결과:**
- 모든 결제 기록 보존
- 5년 경과 전까지 삭제 불가

---

## 6. 단계적 삭제 검증

### 6.1 삭제 단계별 데이터 현황

```sql
-- 삭제 단계별 집계
WITH deletion_stages AS (
  SELECT
    'Immediate (Name/Image)' as stage,
    COUNT(*) as user_count
  FROM users
  WHERE status IN ('withdrawing', 'withdrawn')
    AND name IS NULL
    AND image IS NULL

  UNION ALL

  SELECT
    'Soft Delete (30 days)',
    COUNT(DISTINCT user_email)
  FROM analyses
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() + INTERVAL '30 days'

  UNION ALL

  SELECT
    'Hard Delete Pending (90 days)',
    COUNT(DISTINCT user_email)
  FROM analyses
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days'
)
SELECT * FROM deletion_stages;
```

### 6.2 Cron Job 실행 이력

```sql
-- Cron job 실행 기록 (audit_logs에서)
SELECT
  action,
  deletion_stage,
  details->>'count' as affected_count,
  details->>'threshold_date' as deletion_threshold,
  created_at
FROM audit_logs
WHERE action = 'data_hard_deleted'
ORDER BY created_at DESC
LIMIT 10;
```

**기대 결과:**
- Cron job이 매일 실행되는지 확인
- Hard delete가 90일 기준으로 실행되는지 확인

---

## 7. 테스트 시나리오

### 시나리오 1: 일반 탈퇴 프로세스

1. **사용자 탈퇴 요청**
   ```bash
   POST /api/user/withdraw
   { "confirmed": true }
   ```

2. **즉시 확인 (1분 이내)**
   ```sql
   SELECT name, image, status FROM users WHERE email = 'test@example.com';
   -- 기대: name=NULL, image=NULL, status='withdrawing' or 'withdrawn'
   ```

3. **감사 로그 확인**
   ```sql
   SELECT * FROM audit_logs WHERE user_email = 'test@example.com' ORDER BY created_at DESC LIMIT 1;
   -- 기대: action='user_withdraw', deletion_stage='immediate'
   ```

4. **데이터 상태 확인**
   ```sql
   SELECT COUNT(*), COUNT(deleted_at) FROM analyses WHERE user_email = 'test@example.com';
   -- 기대: 데이터 존재하지만 deleted_at 설정됨
   ```

### 시나리오 2: 법적 보존 데이터 확인

1. **탈퇴 후 결제 정보 확인**
   ```sql
   SELECT * FROM payments WHERE user_email = 'test@example.com';
   -- 기대: 데이터 존재 (삭제 안 됨)
   ```

2. **쿠폰 기록 확인**
   ```sql
   SELECT * FROM coupons WHERE claimed_by = 'test@example.com';
   -- 기대: 데이터 존재 (삭제 안 됨)
   ```

### 시나리오 3: 복구 가능성

1. **Soft delete 데이터 조회**
   ```sql
   SELECT id, deleted_at FROM analyses 
   WHERE user_email = 'test@example.com' AND deleted_at IS NOT NULL;
   ```

2. **복구 시뮬레이션**
   ```sql
   -- (실제 실행 금지 - 시뮬레이션만)
   UPDATE analyses SET deleted_at = NULL WHERE user_email = 'test@example.com';
   -- 기대: 데이터 복구 가능
   ```

---

## 8. 대시보드 쿼리 (모니터링용)

### 8.1 일일 탈퇴 현황

```sql
-- 오늘 탈퇴한 사용자 수
SELECT
  DATE(withdraw_requested_at) as withdrawal_date,
  COUNT(*) as withdrawal_count,
  COUNT(*) FILTER (WHERE status = 'withdrawing') as pending_count,
  COUNT(*) FILTER (WHERE status = 'withdrawn') as completed_count
FROM users
WHERE withdraw_requested_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(withdraw_requested_at)
ORDER BY withdrawal_date DESC;
```

### 8.2 삭제 대상 데이터 현황

```sql
-- 90일 후 영구 삭제 예정 데이터
SELECT
  'analyses' as table_name,
  COUNT(*) as pending_hard_delete
FROM analyses
WHERE deleted_at < NOW() - INTERVAL '90 days'

UNION ALL

SELECT 'jd_analyses', COUNT(*)
FROM jd_analyses
WHERE deleted_at < NOW() - INTERVAL '90 days'

UNION ALL

SELECT 'interview_guides', COUNT(*)
FROM interview_guides
WHERE deleted_at < NOW() - INTERVAL '90 days';
```

### 8.3 법적 보존 현황

```sql
-- 법적 보존 중인 데이터 현황
SELECT
  '결제 정보 (5년 보존)' as category,
  COUNT(*) as record_count,
  COUNT(*) FILTER (WHERE paid_at > NOW() - INTERVAL '5 years') as must_retain,
  COUNT(*) FILTER (WHERE paid_at <= NOW() - INTERVAL '5 years') as deletable
FROM payments

UNION ALL

SELECT
  '쿠폰 (영구 보존)',
  COUNT(*),
  COUNT(*),
  0
FROM coupons;
```

---

## 9. 체크리스트

### GDPR/PIPA 준수
- [ ] 삭제 요청 기록 (`withdraw_requested_at`)
- [ ] 삭제 예정일 기록 (`data_delete_at`)
- [ ] 감사 로그 생성 (`audit_logs`)
- [ ] 개인정보 즉시 익명화 (`name`, `image`)
- [ ] 복구 가능 기간 제공 (90일)
- [ ] 데이터 최소화 (불필요한 PII 없음)

### 세법 준수
- [ ] 결제 정보 5년 보존
- [ ] 영수증/거래 기록 보존
- [ ] 삭제 시점 기록

### 감사 추적
- [ ] 모든 삭제 단계 로그 기록
- [ ] deletion_stage 명시
- [ ] 실행 주체 기록 (user vs system)
- [ ] 상세 정보 JSON 저장

### 기술적 구현
- [ ] Soft delete (deleted_at)
- [ ] Hard delete (90일 후)
- [ ] Cron job 자동 실행
- [ ] 트랜잭션 보장

---

## 10. 문제 발생 시 대응

### 문제: 감사 로그가 없는 탈퇴 발견
```sql
-- 감사 로그 수동 생성
INSERT INTO audit_logs (action, user_email, details, deletion_stage, created_at)
VALUES (
  'user_withdraw',
  'test@example.com',
  '{"status": "withdrawn", "manual_entry": true}',
  'immediate',
  NOW()
);
```

### 문제: 잘못된 데이터 복구
```sql
-- Soft delete 취소
UPDATE analyses
SET deleted_at = NULL
WHERE user_email = 'test@example.com'
  AND deleted_at > NOW() - INTERVAL '90 days';
```

### 문제: 5년 경과 결제 정보 삭제
```sql
-- 세법 보존 기한 경과 데이터만 삭제
DELETE FROM payments
WHERE paid_at < NOW() - INTERVAL '5 years';

-- 감사 로그 기록
INSERT INTO audit_logs (action, user_email, details, deletion_stage)
VALUES (
  'payment_permanent_delete',
  'system',
  '{"reason": "5-year retention period expired"}',
  'permanent'
);
```

---

**문서 버전:** 1.0  
**작성일:** 2026-07-08  
**작성자:** MIR Team
