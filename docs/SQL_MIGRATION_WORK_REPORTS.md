# Work Reports 테이블 마이그레이션

업무 Report 기능을 위한 Supabase 테이블 생성 SQL입니다.

## 실행 방법

Supabase Dashboard → SQL Editor → 아래 SQL 복사 후 실행

## SQL

```sql
-- work_reports 테이블 생성
CREATE TABLE IF NOT EXISTS work_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('company', 'school')),
  monthly_report_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (user_email 기준 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_work_reports_user_email 
ON work_reports(user_email);

-- 인덱스 생성 (created_at 기준 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_work_reports_created_at 
ON work_reports(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_work_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_reports_updated_at
BEFORE UPDATE ON work_reports
FOR EACH ROW
EXECUTE FUNCTION update_work_reports_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE work_reports ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own reports"
ON work_reports FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

-- 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert their own reports"
ON work_reports FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- 사용자는 자신의 데이터만 업데이트 가능
CREATE POLICY "Users can update their own reports"
ON work_reports FOR UPDATE
USING (auth.jwt() ->> 'email' = user_email);

-- 사용자는 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete their own reports"
ON work_reports FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);
```

## 테이블 구조

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 기본 키 |
| user_email | TEXT | 사용자 이메일 |
| organization | TEXT | 회사명 또는 학교명 |
| organization_type | TEXT | 'company' 또는 'school' |
| monthly_report_html | TEXT | 월간 Report HTML |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

## 확인 방법

```sql
-- 테이블 확인
SELECT * FROM work_reports ORDER BY created_at DESC;

-- 특정 사용자의 리포트 조회
SELECT * FROM work_reports 
WHERE user_email = 'user@example.com' 
ORDER BY created_at DESC;
```
