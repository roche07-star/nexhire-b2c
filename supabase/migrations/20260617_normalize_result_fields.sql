-- ========================================
-- adam (nexhire_b2c) - result 필드 정규화
-- Phase 2 성능 최적화
-- 작성일: 2026년 6월 17일
-- 작성자: 미르팀 (디바 - Backend)
-- ========================================
--
-- 목적: JSON 파싱 제거 및 쿼리 성능 향상
-- - analyses 테이블에 자주 사용하는 필드를 컬럼으로 추가
-- - 기존 result JSON에서 데이터 추출하여 컬럼에 저장
-- - 인덱스로 검색 성능 극대화
--
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 스크립트 전체를 붙여넣기
-- 3. "RUN" 버튼 클릭
--
-- ========================================

-- ========================================
-- STEP 1: 컬럼 추가
-- ========================================

-- analyses 테이블에 정규화된 필드 추가
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS candidate_name TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS candidate_email TEXT;

-- 코멘트 추가
COMMENT ON COLUMN analyses.candidate_name IS '후보자 이름 (result.candidate_name에서 추출)';
COMMENT ON COLUMN analyses.position IS '지원 직무 (result.position에서 추출)';
COMMENT ON COLUMN analyses.score IS '적합도 점수 (result.scores.job_fit에서 추출)';
COMMENT ON COLUMN analyses.phone IS '연락처 (result.phone에서 추출)';
COMMENT ON COLUMN analyses.candidate_email IS '후보자 이메일 (result.email에서 추출)';

-- ========================================
-- STEP 2: 기존 데이터 마이그레이션 함수
-- ========================================

CREATE OR REPLACE FUNCTION migrate_analyses_result_fields()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  rec RECORD;
  result_json JSONB;
BEGIN
  -- 모든 analyses 레코드를 순회하며 result에서 필드 추출
  FOR rec IN
    SELECT id, result
    FROM analyses
    WHERE candidate_name IS NULL  -- 아직 마이그레이션 안 된 레코드만
  LOOP
    BEGIN
      -- result를 JSONB로 변환 (문자열인 경우 파싱)
      IF pg_typeof(rec.result) = 'text'::regtype THEN
        result_json := rec.result::jsonb;
      ELSE
        result_json := rec.result;
      END IF;

      -- 필드 추출 및 업데이트
      UPDATE analyses
      SET
        candidate_name = COALESCE(
          result_json->>'candidate_name',
          result_json->>'name',
          result_json->>'candidateName',
          '미정'
        ),
        position = COALESCE(
          result_json->>'position',
          result_json->>'targetPosition',
          result_json->>'job_title',
          '미정'
        ),
        score = COALESCE(
          (result_json->'scores'->>'job_fit')::INTEGER,
          (result_json->>'score')::INTEGER,
          (result_json->>'totalScore')::INTEGER,
          0
        ),
        phone = COALESCE(
          result_json->>'phone',
          result_json->'contact'->>'phone',
          ''
        ),
        candidate_email = COALESCE(
          result_json->>'email',
          result_json->'contact'->>'email',
          ''
        )
      WHERE id = rec.id;

      updated_count := updated_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- JSON 파싱 오류 시 기본값으로 설정
      UPDATE analyses
      SET
        candidate_name = '미정',
        position = '미정',
        score = 0,
        phone = '',
        candidate_email = ''
      WHERE id = rec.id;

      RAISE NOTICE 'Failed to parse result for analysis_id: %. Error: %', rec.id, SQLERRM;
    END;
  END LOOP;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_analyses_result_fields() IS '기존 analyses 레코드의 result JSON에서 필드를 추출하여 정규화된 컬럼에 저장';

-- ========================================
-- STEP 3: 트리거 생성 (신규 레코드 자동 추출)
-- ========================================

CREATE OR REPLACE FUNCTION extract_result_fields()
RETURNS TRIGGER AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- result를 JSONB로 변환
  IF pg_typeof(NEW.result) = 'text'::regtype THEN
    result_json := NEW.result::jsonb;
  ELSE
    result_json := NEW.result;
  END IF;

  -- 필드 자동 추출
  NEW.candidate_name := COALESCE(
    result_json->>'candidate_name',
    result_json->>'name',
    result_json->>'candidateName',
    '미정'
  );

  NEW.position := COALESCE(
    result_json->>'position',
    result_json->>'targetPosition',
    result_json->>'job_title',
    '미정'
  );

  NEW.score := COALESCE(
    (result_json->'scores'->>'job_fit')::INTEGER,
    (result_json->>'score')::INTEGER,
    (result_json->>'totalScore')::INTEGER,
    0
  );

  NEW.phone := COALESCE(
    result_json->>'phone',
    result_json->'contact'->>'phone',
    ''
  );

  NEW.candidate_email := COALESCE(
    result_json->>'email',
    result_json->'contact'->>'email',
    ''
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (INSERT 또는 UPDATE 시 자동 실행)
DROP TRIGGER IF EXISTS trg_extract_result_fields ON analyses;

CREATE TRIGGER trg_extract_result_fields
  BEFORE INSERT OR UPDATE OF result
  ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION extract_result_fields();

COMMENT ON TRIGGER trg_extract_result_fields ON analyses IS 'result JSON 변경 시 자동으로 정규화된 필드 추출';

-- ========================================
-- STEP 4: 인덱스 생성
-- ========================================

-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_analyses_candidate_name
ON analyses(user_email, candidate_name);

CREATE INDEX IF NOT EXISTS idx_analyses_position
ON analyses(user_email, position);

CREATE INDEX IF NOT EXISTS idx_analyses_score
ON analyses(user_email, score DESC);

-- 복합 인덱스 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_analyses_search
ON analyses(user_email, candidate_name, position);

-- ========================================
-- STEP 5: 마이그레이션 실행
-- ========================================

-- 기존 데이터 마이그레이션 실행
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT migrate_analyses_result_fields() INTO migrated_count;
  RAISE NOTICE '✅ Migration completed: % records updated', migrated_count;
END $$;

-- ========================================
-- 완료!
-- ========================================
--
-- 이제 다음 작업을 수행하세요:
-- 1. API 코드에서 JSON 파싱 제거
-- 2. 직접 컬럼 조회 (candidate_name, position, score 등)
-- 3. 성능 테스트
--
-- ========================================
