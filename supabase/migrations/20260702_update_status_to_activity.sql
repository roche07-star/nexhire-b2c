-- 기존 '지원준비', '지원 준비' 상태를 '구직활동'으로 변경
UPDATE job_applications
SET status = '구직활동'
WHERE status IN ('지원준비', '지원 준비');
