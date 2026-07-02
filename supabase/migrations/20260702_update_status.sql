-- 기존 '지원 준비' 상태를 '지원 완료'로 변경
UPDATE job_applications
SET status = '지원 완료'
WHERE status = '지원 준비';
