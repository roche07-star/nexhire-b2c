# Supabase RLS 마이그레이션 가이드

## 개요
Service Role Key (RLS 우회) → Anon Key (RLS 적용) 전환 가이드

## 현재 상태
- ✅ `lib/supabase.ts` - 기본 export는 여전히 `supabaseAdmin` (기존 호환성 유지)
- ✅ `lib/supabase-admin.ts` - Service Role Key (관리자 전용)
- ✅ `lib/supabase-client.ts` - Anon Key (RLS 적용)
- ⚠️ RLS 정책 미설정 (Supabase Dashboard에서 설정 필요)

## 마이그레이션 단계

### 1단계: RLS 정책 설정 (Supabase Dashboard)
```bash
# supabase-rls-policies.sql 파일을 Supabase SQL Editor에서 실행
```

**실행 방법:**
1. https://app.supabase.com 접속
2. 프로젝트 선택
3. SQL Editor 메뉴
4. `supabase-rls-policies.sql` 내용 복사하여 실행

### 2단계: API별 전환 우선순위

#### 🔴 우선순위 1 (즉시 전환 - 사용자 데이터 읽기)
- `app/api/my-info/route.ts` - 본인 정보 조회
- `app/api/dashboard/stats/route.ts` - 본인 대시보드
- `app/api/analyze/history/route.ts` - 본인 분석 기록
- `app/api/jobs/[id]/route.ts` - 본인 Job 조회

#### 🟡 우선순위 2 (데이터 생성)
- `app/api/analyze/route.ts` - 이력서 분석 생성
- `app/api/analyze/jd/route.ts` - JD 분석 생성
- `app/api/analyze/interview/route.ts` - 면접 가이드 생성
- `app/api/coupons/claim/route.ts` - 쿠폰 등록

#### 🟢 우선순위 3 (관리자 기능은 그대로 유지)
- `app/api/admin/*` - 모든 관리자 API는 `supabaseAdmin` 계속 사용

### 3단계: 코드 수정 패턴

#### Before (현재):
```typescript
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  const email = session.user.email
  
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)  // ⚠️ 이메일로 필터링해도 Service Role이라 전체 접근 가능
    .single()
}
```

#### After (RLS 적용):
```typescript
import { supabaseClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  
  // RLS 정책이 자동으로 email = auth.jwt()->>'email' 체크
  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('email', session.user.email)  // ✅ RLS에서 이중 체크
    .single()
}
```

#### 관리자 API (변경 없음):
```typescript
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  
  // ✅ 관리자는 계속 supabaseAdmin 사용
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
}
```

### 4단계: 검증 방법

#### 테스트 1: 일반 사용자 본인 데이터 접근
```bash
# 로그인 후 /api/my-info 호출
# 본인 데이터만 반환되는지 확인
```

#### 테스트 2: 다른 사용자 데이터 접근 시도 (실패해야 함)
```typescript
// Postman 등으로 직접 테스트
const { data, error } = await supabaseClient
  .from('users')
  .select('*')
  .eq('email', 'other-user@example.com')  // ❌ RLS에 의해 차단되어야 함

console.log(data) // []
console.log(error) // null (에러는 아니지만 빈 배열 반환)
```

#### 테스트 3: 관리자 전체 사용자 조회
```bash
# SUPER_ADMIN으로 로그인 후 /api/admin/users 호출
# 전체 사용자 목록 반환되는지 확인
```

### 5단계: 롤백 계획

RLS 설정 후 문제 발생 시:

```sql
-- 긴급 롤백: RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
-- ... 기타 테이블
```

또는:

```typescript
// lib/supabase.ts에서 기본 export 변경
export const supabase = supabaseAdmin  // 원복
```

## 예상 이슈 및 해결

### 이슈 1: NextAuth JWT에 email이 없음
**증상**: RLS 정책에서 `auth.jwt() ->> 'email'`이 null 반환

**해결**:
```typescript
// auth.ts에서 JWT에 email 포함 확인
async jwt({ token, user }) {
  if (user?.email) {
    token.email = user.email  // ✅ 확인
  }
  return token
}
```

### 이슈 2: Service Role Key로 설정한 함수가 RLS 정책 오류
**증상**: RPC 함수에서 "new row violates row-level security policy" 에러

**해결**:
```sql
-- RPC 함수를 SECURITY DEFINER로 설정
CREATE OR REPLACE FUNCTION increment_analyze_count(user_email TEXT)
RETURNS void
SECURITY DEFINER  -- ✅ Service Role 권한으로 실행
SET search_path = public
AS $$ ... $$;
```

### 이슈 3: 성능 저하
**증상**: RLS 정책으로 인한 쿼리 속도 저하

**해결**:
```sql
-- 인덱스 추가
CREATE INDEX idx_analyses_user_email ON analyses(user_email);
CREATE INDEX idx_jd_analyses_user_email ON jd_analyses(user_email);
```

## 완료 체크리스트

- [ ] `supabase-rls-policies.sql` Supabase Dashboard에서 실행
- [ ] RLS 활성화 확인 (`SELECT * FROM pg_tables WHERE rowsecurity = true`)
- [ ] 우선순위 1 API 수정 (`supabaseClient` 사용)
- [ ] 로컬 환경 테스트
  - [ ] 일반 사용자 본인 데이터 접근 성공
  - [ ] 다른 사용자 데이터 접근 실패
  - [ ] SUPER_ADMIN 전체 데이터 접근 성공
- [ ] 스테이징 배포 및 테스트
- [ ] 프로덕션 배포
- [ ] 우선순위 2 API 단계적 전환
- [ ] `lib/supabase.ts`의 기본 export를 `supabaseClient`로 변경

## 추가 보안 강화

### 1. Supabase Auth 통합
현재는 NextAuth 사용 중이지만, 향후 Supabase Auth로 전환 시:
- JWT 자동 갱신
- RLS 정책에서 `auth.uid()` 사용 가능
- 더 강력한 보안

### 2. 민감 필드 제외
```typescript
// 비밀번호 해시 등 민감 필드 제외
const { data } = await supabaseClient
  .from('users')
  .select('email, name, plan')  // ✅ 필요한 필드만
  .eq('email', email)
```

### 3. Realtime 구독도 RLS 적용
```typescript
const subscription = supabaseClient
  .channel('public:jobs')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'jobs',
    filter: `user_email=eq.${email}`  // ✅ RLS도 적용됨
  }, (payload) => { ... })
  .subscribe()
```

## 문의
RLS 전환 중 문제 발생 시 디바 또는 코난에게 문의
