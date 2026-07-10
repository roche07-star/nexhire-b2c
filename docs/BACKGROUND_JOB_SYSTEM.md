# 백그라운드 Job 시스템 가이드 (계획 문서)

## ⚠️ 현재 상태

**작성 날짜**: 2026-06-19  
**최종 업데이트**: 2026-07-10  
**실제 진행률**: ~15% (계획 단계, 대부분 미구현)

> **중요**: 이 문서는 당초 계획이며, 실제 구현과 큰 차이가 있습니다.  
> 현재 모든 분석 기능은 **동기 방식**으로 작동 중이며, Job 시스템은 제한적으로만 적용되어 있습니다.

---

## 📊 실제 구현 상태

### 1. 면접 가이드 (부분 적용 ~40%)
- ✅ Job 생성 코드 존재
- ⚠️ 즉시 동기 처리 (비동기 이점 없음)
- ❌ Frontend polling 없음
- ❌ 실시간 진행 상황 표시 없음
- ✅ 기능 자체는 정상 작동

**실제 동작 방식:**
```typescript
// Job 생성 → 즉시 처리 → 결과 반환 (기존 동기 방식과 동일)
await createJob(...)  
await processInterviewJob(...)  // 동기 처리
return NextResponse.json(job.result)
```

**사용자 경험:**
- 60-120초 대기 (블로킹)
- 진행 상황 표시 없음

---

## ❌ 미구현 기능

### 2. JD 분석 (0%)
- ❌ Job 시스템 미사용
- ✅ 기존 동기 방식으로 정상 작동

### 3. 이력서 분석 (0%)
- ❌ Job 시스템 미사용
- ✅ 기존 동기 방식으로 정상 작동

### 4. 리라이팅 (0%)
- ❌ Job 시스템 미사용
- ✅ 기존 동기 방식으로 정상 작동

---

## 🏗️ 아키텍처

### 전체 구조

```
사용자 요청
   ↓
POST /api/analyze/[feature]
   → Job 생성 (0.5초)
   → Job ID 반환
   ↓
POST /api/jobs/[id]/process (Frontend 자동 호출)
   → 실제 처리 (60-120초)
   → Job 상태 계속 업데이트
   ↓
GET /api/jobs/[id] (2초마다 polling)
   → 진행 상황 표시
   → 완료 시 결과 자동 표시
```

### Database 스키마

**Supabase `jobs` 테이블:**

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_email TEXT NOT NULL,
  job_type TEXT NOT NULL,  -- 'analyze', 'jd', 'rewrite', 'interview'
  status TEXT NOT NULL,     -- 'pending', 'processing', 'completed', 'failed'
  input_data JSONB NOT NULL,
  result JSONB,
  error TEXT,
  progress_message TEXT,
  progress_step INTEGER,
  progress_total INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 📂 파일 구조

### Core 라이브러리
```
lib/
├── jobs.ts                    # Job 관리 함수
│   ├── createJob()           # Job 생성
│   ├── updateJobProgress()   # 진행 상황 업데이트
│   ├── completeJob()         # Job 완료
│   ├── failJob()             # Job 실패
│   └── getJobStatus()        # 상태 조회
```

### API 엔드포인트
```
app/api/
├── jobs/
│   └── [id]/
│       ├── route.ts          # GET: 상태 조회
│       └── process/
│           └── route.ts      # POST: 처리 시작
│
└── analyze/
    ├── route.ts              # 이력서 분석 Job 생성
    ├── interview/
    │   ├── route.ts          # 면접 가이드 Job 생성
    │   └── process.ts        # 면접 가이드 처리 (완성 ✅)
    ├── jd/
    │   ├── route.ts          # JD 분석 Job 생성
    │   └── process.ts        # JD 분석 처리 (스켈레톤)
    └── rewrite/
        ├── route.ts          # 리라이팅 Job 생성
        └── process.ts        # 리라이팅 처리 (작성 필요)
```

### 백업 파일
```
*-backup.ts                   # 기존 동기 방식 코드 (참고용)
```

---

## 🚀 향후 완성하려면 (80% 작업 필요)

### Step 1: JD 분석 process.ts 완성

**파일**: `app/api/analyze/jd/process.ts`

**참고**: `app/api/analyze/jd/route-backup.ts` (기존 로직)

**작업**:
1. route-backup.ts의 Claude API 호출 로직 복사
2. `processJdJob` 함수에 통합
3. 진행 단계별 `updateJobProgress` 호출
4. 완료 시 `completeJob` 호출

**예상 시간**: 30분

**패턴** (면접 가이드 참고):
```typescript
export async function processJdJob(jobId, email, role, inputData) {
  try {
    // Step 1: 데이터 조회
    await updateJobProgress(jobId, 1, '이력서 분석 결과를 확인하는 중...')
    
    // Step 2: Claude API 호출
    await updateJobProgress(jobId, 2, 'JD를 분석하는 중...')
    const message = await client.messages.create({ ... })
    
    // Step 3: 결과 저장
    await updateJobProgress(jobId, 3, '결과를 저장하는 중...')
    await supabase.from('jd_analyses').insert({ ... })
    
    // Step 4: 완료
    await completeJob(jobId, result)
    
  } catch (error) {
    await failJob(jobId, error.message)
  }
}
```

---

### Step 2: 이력서 분석 process.ts 작성

**파일**: `app/api/analyze/process.ts` (신규 생성)

**참고**: `app/api/analyze/route-backup.ts`

**작업**:
1. `processAnalyzeJob` 함수 생성
2. 기존 로직 복사 및 Job 시스템 통합
3. `/api/jobs/[id]/process/route.ts`에서 import

**예상 시간**: 30분

---

### Step 3: 리라이팅 process.ts 작성

**파일**: `app/api/analyze/rewrite/process.ts` (신규 생성)

**참고**: `app/api/analyze/rewrite/route-backup.ts`

**작업**:
1. `processRewriteJob` 함수 생성
2. 기존 로직 복사 및 Job 시스템 통합
3. `/api/jobs/[id]/process/route.ts`에서 import

**예상 시간**: 30분

---

### Step 4: Frontend polling 구현

**파일**: `app/analyze/AnalyzeClient.tsx`

**작업**:
1. JD 분석 버튼 핸들러에 polling 추가 (면접 가이드 패턴 복사)
2. 이력서 분석 버튼 핸들러에 polling 추가
3. 리라이팅 버튼 핸들러에 polling 추가

**패턴** (면접 가이드에서 복사):
```typescript
// Job 생성
const createRes = await fetch('/api/analyze/jd', { method: 'POST', ... })
const { jobId } = await createRes.json()

// Process 시작
fetch(`/api/jobs/${jobId}/process`, { method: 'POST' })

// Polling
const pollInterval = setInterval(async () => {
  const statusRes = await fetch(`/api/jobs/${jobId}`)
  const statusData = await statusRes.json()
  
  if (statusData.status === 'completed') {
    clearInterval(pollInterval)
    setResult(statusData.result)
  }
  
  if (statusData.status === 'failed') {
    clearInterval(pollInterval)
    setError(statusData.error)
  }
  
  setLoadingMsg(statusData.progress_message)
}, 2000)
```

**예상 시간**: 30분

---

## 🎓 학습 포인트

### Vercel 서버리스 제한

**문제**: Response 반환 시 함수 종료
**해결**: 2단계 API 분리
- Step 1: Job 생성 → 즉시 반환
- Step 2: Process API → 실제 처리

### Job 시스템 장점

1. **즉시 반응**: 사용자는 0.5초 내 응답
2. **실시간 진행**: 6-7단계 진행 상황 표시
3. **오류 처리**: Job 상태로 명확한 오류 추적
4. **확장성**: 다른 기능 쉽게 추가

---

## 📊 성능 비교

### Before (동기 방식)
```
사용자 대기: 60-90초
진행 상황: 알 수 없음
오류 시: 전체 실패
```

### After (백그라운드 Job)
```
사용자 대기: 0.5초
진행 상황: 실시간 표시
오류 시: 재시도 가능
```

---

## 🔧 유지보수

### Job 정리

**만료된 Job 자동 삭제**:

Supabase에서 Cron으로 실행:
```sql
SELECT cron.schedule(
  'delete-expired-jobs',
  '0 2 * * *',  -- 매일 새벽 2시
  $$SELECT delete_expired_jobs()$$
);
```

### 모니터링

**Job 상태 확인**:
```sql
SELECT 
  job_type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration
FROM jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY job_type, status;
```

---

## 📝 현실 평가 (2026-07-10 업데이트)

**실제 구현 상태:**
- ⏸️ Job 시스템 아키텍처 설계됨 (코드 일부 존재)
- ⚠️ 면접 가이드: Job 형식만, 실제는 동기 처리
- ❌ Frontend polling 미구현
- ❌ 나머지 기능 모두 기존 동기 방식

**완성하려면:**
- 예상 소요: 8-12시간 (당초 예상 1.5시간과 차이)
- jobs 테이블 migration 적용 필요
- 모든 API 비동기 전환
- Frontend polling 구현

**현재 시스템 평가:**
- ✅ 모든 분석 기능은 동기 방식으로 정상 작동 중
- ⚠️ Job 시스템은 계획 단계에 머물러 있음
- ❓ 향후 완성 여부는 미정

**결론:**
이 문서는 **계획 문서**로, 실제 구현과 차이가 큽니다.  
현재 시스템은 동기 방식으로 안정적으로 작동하고 있으며,  
Job 시스템 전환은 선택적 개선 사항입니다.

---

**작성자**: 미르팀 (디바, 디아, 테스, 코난)  
**날짜**: 2026-06-19  
**업데이트**: 2026-07-10 (실제 구현 상태 반영)  
**문의**: roche07he@gmail.com
