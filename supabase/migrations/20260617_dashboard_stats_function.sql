-- ========================================
-- adam (nexhire_b2c) - Dashboard Stats Function
-- Phase 2 성능 최적화 - 단일 RPC 호출
-- 작성일: 2026년 6월 17일
-- 작성자: 미르팀 (디바 - Backend)
-- ========================================
--
-- 목적: Dashboard 통계 조회를 단일 쿼리로 통합
-- - 6개 병렬 쿼리 → 1개 RPC 호출
-- - 네트워크 round-trip 최소화
-- - 서버 사이드 집계로 성능 극대화
--
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 스크립트 전체를 붙여넣기
-- 3. "RUN" 버튼 클릭
--
-- ========================================

-- ========================================
-- Dashboard Stats Function
-- ========================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_email TEXT,
  p_first_day_of_month TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  v_total_candidates INTEGER;
  v_this_month_analyses INTEGER;
  v_avg_score INTEGER;
  v_pipeline_counts JSON;
  v_recent_activity JSON;
BEGIN
  -- 1. 전체 후보자 수 & 이번 달 분석 건수 (한 번에 조회)
  SELECT
    COUNT(*) FILTER (WHERE true) AS total,
    COUNT(*) FILTER (WHERE created_at >= p_first_day_of_month) AS this_month
  INTO v_total_candidates, v_this_month_analyses
  FROM analyses
  WHERE user_email = p_user_email;

  -- 2. 평균 적합도 계산 (정규화된 score 컬럼 사용)
  SELECT COALESCE(ROUND(AVG(score)), 0)
  INTO v_avg_score
  FROM (
    SELECT score
    FROM analyses
    WHERE user_email = p_user_email
      AND score > 0
    ORDER BY created_at DESC
    LIMIT 50
  ) recent_scores;

  -- 3. 파이프라인 단계별 카운트
  SELECT json_build_object(
    'pending', COUNT(*) FILTER (WHERE pipeline_stage = 'pending'),
    'screening', COUNT(*) FILTER (WHERE pipeline_stage = 'screening'),
    'interview', COUNT(*) FILTER (WHERE pipeline_stage = 'interview'),
    'final', COUNT(*) FILTER (WHERE pipeline_stage = 'final'),
    'completed', COUNT(*) FILTER (WHERE pipeline_stage = 'completed')
  )
  INTO v_pipeline_counts
  FROM analyses
  WHERE user_email = p_user_email;

  -- 4. 최근 활동 (이력서 분석 + JD 분석 통합)
  WITH resume_activity AS (
    SELECT
      id,
      'resume' AS type,
      COALESCE(candidate_name, '미정') AS name,
      COALESCE(position, '미정') AS position,
      COALESCE(score, 0) AS score,
      COALESCE(pipeline_stage, 'pending') AS stage,
      'jd' AS dummy_stage,
      created_at
    FROM analyses
    WHERE user_email = p_user_email
    ORDER BY created_at DESC
    LIMIT 10
  ),
  jd_activity AS (
    SELECT
      id,
      'jd' AS type,
      COALESCE(result->>'candidate_name', '미정') AS name,
      COALESCE(
        (result->>'company' || ' - ' || result->>'position'),
        '미정'
      ) AS position,
      COALESCE((result->>'fit_score')::INTEGER, 0) AS score,
      'jd' AS stage,
      'jd' AS dummy_stage,
      created_at
    FROM jd_analyses
    WHERE user_email = p_user_email
    ORDER BY created_at DESC
    LIMIT 10
  ),
  combined AS (
    SELECT * FROM resume_activity
    UNION ALL
    SELECT * FROM jd_activity
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'type', type,
      'name', name,
      'position', position,
      'score', score,
      'stage', stage,
      'createdAt', created_at
    ) ORDER BY created_at DESC
  )
  INTO v_recent_activity
  FROM (
    SELECT * FROM combined
    ORDER BY created_at DESC
    LIMIT 10
  ) top_activities;

  -- 5. 결과 반환 (단일 JSON)
  RETURN json_build_object(
    'totalCandidates', v_total_candidates,
    'thisMonthAnalyses', v_this_month_analyses,
    'avgScore', v_avg_score,
    'pipelineCounts', v_pipeline_counts,
    'recentActivity', COALESCE(v_recent_activity, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dashboard_stats(TEXT, TIMESTAMPTZ) IS 'Dashboard 통계를 단일 쿼리로 조회 - 6개 쿼리를 1개로 통합';

-- ========================================
-- 권한 설정
-- ========================================

-- 인증된 사용자만 호출 가능
GRANT EXECUTE ON FUNCTION get_dashboard_stats(TEXT, TIMESTAMPTZ) TO authenticated;

-- ========================================
-- 테스트 쿼리 (선택적)
-- ========================================

-- 사용 예시:
-- SELECT get_dashboard_stats('user@example.com', '2026-06-01'::timestamptz);

-- ========================================
-- 완료!
-- ========================================
--
-- 다음 단계:
-- 1. Dashboard API에서 이 함수 호출
--    const { data } = await supabase.rpc('get_dashboard_stats', {
--      p_user_email: email,
--      p_first_day_of_month: firstDayOfMonth.toISOString()
--    })
-- 2. 기존 6개 쿼리 제거
-- 3. 성능 비교 테스트
--
-- 예상 효과: 추가 20-30% 성능 향상
-- ========================================
