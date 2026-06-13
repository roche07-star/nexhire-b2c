-- ========================================
-- Jobizic PRO 플랜 - DB 마이그레이션
-- Week 1: DB 스키마 설계
-- 작성일: 2026년 6월 13일
-- 작성자: 미르팀 (디바 - Backend)
-- ========================================
--
-- 사용 방법:
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 이 스크립트 전체를 붙여넣기
-- 4. "RUN" 버튼 클릭
--
-- ========================================

-- ========================================
-- 1. analyses 테이블에 pipeline_stage 컬럼 추가
-- ========================================

-- pipeline_stage 컬럼 추가 (기본값: 'pending')
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'pending';

-- 체크 제약 조건 추가 (5단계 고정)
ALTER TABLE analyses
ADD CONSTRAINT check_pipeline_stage
CHECK (pipeline_stage IN ('pending', 'screening', 'interview', 'final', 'completed'));

-- 인덱스 추가 (파이프라인 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_analyses_pipeline
ON analyses(user_email, pipeline_stage);

-- 코멘트 추가
COMMENT ON COLUMN analyses.pipeline_stage IS '파이프라인 단계: pending(접수), screening(서류), interview(면접), final(최종), completed(완료)';

-- ========================================
-- 2. candidate_notes 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  note TEXT NOT NULL CHECK (length(note) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notes_analysis
ON candidate_notes(analysis_id);

CREATE INDEX IF NOT EXISTS idx_notes_user
ON candidate_notes(user_email, created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE candidate_notes IS '후보자 메모 (PRO 플랜) - 최대 500자';
COMMENT ON COLUMN candidate_notes.note IS '메모 내용 (최대 500자)';

-- ========================================
-- 3. candidate_tags 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS candidate_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  tag TEXT NOT NULL CHECK (length(tag) <= 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(analysis_id, tag)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tags_analysis
ON candidate_tags(analysis_id);

CREATE INDEX IF NOT EXISTS idx_tags_user
ON candidate_tags(user_email, tag);

-- 코멘트 추가
COMMENT ON TABLE candidate_tags IS '후보자 태그 (PRO 플랜) - 최대 5개';
COMMENT ON COLUMN candidate_tags.tag IS '태그명 (최대 20자)';

-- ========================================
-- 4. pipeline_history 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS pipeline_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_history_analysis
ON pipeline_history(analysis_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_history_user
ON pipeline_history(user_email, created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE pipeline_history IS '파이프라인 단계 이동 히스토리';

-- ========================================
-- 5. RLS (Row Level Security) 정책 적용
-- ========================================

-- candidate_notes 테이블 RLS
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "사용자는 본인 메모만 조회" ON candidate_notes;
DROP POLICY IF EXISTS "사용자는 본인 메모만 삽입" ON candidate_notes;
DROP POLICY IF EXISTS "사용자는 본인 메모만 수정" ON candidate_notes;
DROP POLICY IF EXISTS "사용자는 본인 메모만 삭제" ON candidate_notes;

CREATE POLICY "사용자는 본인 메모만 조회"
ON candidate_notes FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 메모만 삽입"
ON candidate_notes FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 메모만 수정"
ON candidate_notes FOR UPDATE
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 메모만 삭제"
ON candidate_notes FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);

-- candidate_tags 테이블 RLS
ALTER TABLE candidate_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "사용자는 본인 태그만 조회" ON candidate_tags;
DROP POLICY IF EXISTS "사용자는 본인 태그만 삽입" ON candidate_tags;
DROP POLICY IF EXISTS "사용자는 본인 태그만 삭제" ON candidate_tags;

CREATE POLICY "사용자는 본인 태그만 조회"
ON candidate_tags FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 태그만 삽입"
ON candidate_tags FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 태그만 삭제"
ON candidate_tags FOR DELETE
USING (auth.jwt() ->> 'email' = user_email);

-- pipeline_history 테이블 RLS
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "사용자는 본인 히스토리만 조회" ON pipeline_history;
DROP POLICY IF EXISTS "사용자는 본인 히스토리만 삽입" ON pipeline_history;

CREATE POLICY "사용자는 본인 히스토리만 조회"
ON pipeline_history FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "사용자는 본인 히스토리만 삽입"
ON pipeline_history FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- ========================================
-- 6. 관리자 정책 (CTO 전체 조회)
-- ========================================

CREATE POLICY "관리자는 모든 메모 조회 가능"
ON candidate_notes FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

CREATE POLICY "관리자는 모든 태그 조회 가능"
ON candidate_tags FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

CREATE POLICY "관리자는 모든 히스토리 조회 가능"
ON pipeline_history FOR SELECT
USING (auth.jwt() ->> 'email' = 'roche07he@gmail.com');

-- ========================================
-- 7. 트리거 함수 - updated_at 자동 업데이트
-- ========================================

-- 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- candidate_notes 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_candidate_notes_updated_at ON candidate_notes;
CREATE TRIGGER update_candidate_notes_updated_at
BEFORE UPDATE ON candidate_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. 확인 쿼리
-- ========================================

/*
-- 새 테이블 확인
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('candidate_notes', 'candidate_tags', 'pipeline_history')
ORDER BY table_name, ordinal_position;

-- RLS 정책 확인
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('candidate_notes', 'candidate_tags', 'pipeline_history')
ORDER BY tablename, policyname;

-- analyses 테이블에 pipeline_stage 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'analyses' AND column_name = 'pipeline_stage';
*/

-- ========================================
-- 완료!
-- ========================================
-- PRO 플랜 DB 스키마가 성공적으로 생성되었습니다.
--
-- 생성된 테이블:
-- - candidate_notes (후보자 메모)
-- - candidate_tags (후보자 태그)
-- - pipeline_history (파이프라인 이동 히스토리)
--
-- 추가된 컬럼:
-- - analyses.pipeline_stage (파이프라인 단계)
--
-- 모든 테이블에 RLS 정책이 적용되었습니다.
-- ========================================
