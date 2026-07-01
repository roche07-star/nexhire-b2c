# Goals 컬럼 추가 마이그레이션

## 목적
대시보드의 "목표 설정" 기능을 localStorage가 아닌 Supabase에 저장하기 위해 users 테이블에 goals 컬럼 추가

## 실행 방법

### Supabase Dashboard에서 실행

1. Supabase Dashboard 접속
2. SQL Editor 메뉴 선택
3. 아래 SQL 복사하여 실행

```sql
-- users 테이블에 goals JSONB 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{
  "hiredTarget": 10,
  "passedTarget": 20,
  "proposalTarget": 10
}'::jsonb;

-- 기존 사용자들에게 기본값 설정 (null인 경우만)
UPDATE users
SET goals = '{
  "hiredTarget": 10,
  "passedTarget": 20,
  "proposalTarget": 10
}'::jsonb
WHERE goals IS NULL;

-- 인덱스 추가 (선택사항 - 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_goals ON users USING GIN (goals);
```

## 데이터 구조

### goals JSONB 형식
```json
{
  "hiredTarget": 10,      // 입사 목표 (숫자)
  "passedTarget": 20,     // 합격 목표 (숫자)
  "proposalTarget": 10    // 제안 목표 (숫자)
}
```

## 변경사항

### Before (localStorage)
- 브라우저 로컬 스토리지에만 저장
- 다른 기기/브라우저에서 접근 불가
- 캐시 삭제 시 데이터 손실

### After (Supabase)
- 데이터베이스에 영구 저장
- 모든 기기에서 동기화
- 안정적인 데이터 관리

## API 엔드포인트

### GET /api/dashboard/goals
목표 조회

### POST /api/dashboard/goals
목표 저장

**Request Body:**
```json
{
  "hiredTarget": 10,
  "passedTarget": 20,
  "proposalTarget": 10
}
```

## 롤백 방법

만약 문제가 생기면:

```sql
-- goals 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS goals;

-- 인덱스 제거
DROP INDEX IF EXISTS idx_users_goals;
```

## 확인 방법

SQL Editor에서 확인:
```sql
-- goals 컬럼 확인
SELECT email, goals FROM users LIMIT 10;

-- 특정 사용자 goals 확인
SELECT email, goals FROM users WHERE email = 'your-email@example.com';
```

## 주의사항

1. **백업**: 마이그레이션 전 데이터 백업 권장
2. **타입**: goals는 JSONB 타입 (PostgreSQL JSON)
3. **기본값**: 새 사용자는 자동으로 기본 목표값 설정
4. **Fallback**: API 실패 시 localStorage 사용 (하위 호환성)

## 실행 완료 체크리스트

- [ ] SQL 마이그레이션 실행
- [ ] 기존 사용자 데이터 확인
- [ ] 새 사용자 기본값 확인
- [ ] 목표 설정 기능 테스트
- [ ] 다른 기기에서 동기화 확인
