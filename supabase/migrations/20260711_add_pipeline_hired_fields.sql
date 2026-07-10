-- 채용 파이프라인에 합격 관련 필드 추가

ALTER TABLE hiring_pipeline
ADD COLUMN IF NOT EXISTS hired_date DATE,
ADD COLUMN IF NOT EXISTS fee DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS salary INTEGER;

COMMENT ON COLUMN hiring_pipeline.hired_date IS '입사일';
COMMENT ON COLUMN hiring_pipeline.fee IS '수수료 (%)';
COMMENT ON COLUMN hiring_pipeline.salary IS '처우/연봉 (만원)';
