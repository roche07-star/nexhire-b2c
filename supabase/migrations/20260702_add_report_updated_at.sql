-- work_report_ideas 테이블에 리포트 업데이트 시간 추가
ALTER TABLE work_report_ideas
ADD COLUMN IF NOT EXISTS report_updated_at TIMESTAMP WITH TIME ZONE;

-- 기존 데이터는 NULL로 두어 재분석 트리거
