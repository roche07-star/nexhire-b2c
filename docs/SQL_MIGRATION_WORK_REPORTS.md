# Work Reports 테이블 마이그레이션 (v2)

업무 Report 기능을 위한 Supabase 테이블 생성 SQL입니다.

## 변경 사항 (v2)
- `weekly_reports` 테이블 추가 (주간 리포트 저장)
- `monthly_reports` 테이블 추가 (월간 리포트 저장)
- 조직 정보를 users 테이블에 저장

## 실행 방법

Supabase Dashboard → SQL Editor → 아래 SQL 복사 후 실행

---

## SQL

```sql
-- 1. users 테이블에 조직 정보 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS organization_type TEXT CHECK (organization_type IN ('company', 'school'));

-- 2. weekly_reports 테이블 생성 (주간 리포트)
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  week_of DATE NOT NULL,
  original_content TEXT NOT NULL,
  ai_generated_html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_email 
ON weekly_reports(user_email);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_of 
ON weekly_reports(week_of DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_weekly_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_weekly_reports_updated_at
BEFORE UPDATE ON weekly_reports
FOR EACH ROW
EXECUTE FUNCTION update_weekly_reports_updated_at();

-- RLS 정책
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly reports"
ON weekly_reports FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own weekly reports"
ON weekly_reports FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own weekly reports"
ON weekly_reports FOR UPDATE
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete their own weekly reports"
ON weekly_reports FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);

-- 3. monthly_reports 테이블 생성 (월간 리포트)
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  month_of DATE NOT NULL,
  aggregated_html TEXT NOT NULL,
  applied_to_resume BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_email 
ON monthly_reports(user_email);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_month_of 
ON monthly_reports(month_of DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_monthly_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_reports_updated_at
BEFORE UPDATE ON monthly_reports
FOR EACH ROW
EXECUTE FUNCTION update_monthly_reports_updated_at();

-- RLS 정책
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly reports"
ON monthly_reports FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert their own monthly reports"
ON monthly_reports FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update their own monthly reports"
ON monthly_reports FOR UPDATE
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete their own monthly reports"
ON monthly_reports FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);
```

---

## 테이블 구조

### 1. users (조직 정보 추가)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| organization | TEXT | 회사명 또는 학교명 |
| organization_type | TEXT | 'company' 또는 'school' |

### 2. weekly_reports (주간 리포트)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 기본 키 |
| user_email | TEXT | 사용자 이메일 |
| week_of | DATE | 해당 주의 월요일 날짜 |
| original_content | TEXT | 사용자가 작성한 원본 내용 |
| ai_generated_html | TEXT | AI가 정리한 HTML |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

### 3. monthly_reports (월간 리포트)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 기본 키 |
| user_email | TEXT | 사용자 이메일 |
| month_of | DATE | 해당 월의 1일 날짜 |
| aggregated_html | TEXT | 주간 리포트 집계 HTML |
| applied_to_resume | BOOLEAN | 이력서 반영 여부 |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

---

## 확인 방법

```sql
-- 주간 리포트 확인
SELECT * FROM weekly_reports 
WHERE user_email = 'roche07he@gmail.com' 
ORDER BY week_of DESC;

-- 월간 리포트 확인
SELECT * FROM monthly_reports 
WHERE user_email = 'roche07he@gmail.com' 
ORDER BY month_of DESC;

-- 사용자 조직 정보 확인
SELECT email, organization, organization_type 
FROM users 
WHERE email = 'roche07he@gmail.com';
```
