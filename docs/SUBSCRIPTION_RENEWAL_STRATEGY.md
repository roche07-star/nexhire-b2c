# 구독 갱신 전략 (Subscription Renewal Strategy)

## 📋 목차

1. [개요](#개요)
2. [Phase 1: 수동 갱신 (현재)](#phase-1-수동-갱신-현재)
3. [Phase 2: 자동 갱신 (나중에)](#phase-2-자동-갱신-나중에)
4. [구현 가이드](#구현-가이드)
5. [타임라인](#타임라인)

---

## 개요

JOBIZIC의 PRO/EXPERT 플랜은 **월 구독제**입니다.

- **구독 기간**: 30일
- **결제 방식**: 토스페이먼츠
- **갱신 전략**: 단계별 접근 (수동 → 자동)

---

## Phase 1: 수동 갱신 (현재)

### ✅ 완료된 기능

#### 1. 만료일 자동 저장
```tsx
// app/api/payment/confirm/route.ts
const now = new Date()
const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후

await supabase
  .from('users')
  .update({
    plan: 'PRO',
    plan_started_at: now.toISOString(),
    plan_expires_at: expiresAt.toISOString(),
  })
```

**저장 데이터:**
- `plan_started_at`: 결제 시작일
- `plan_expires_at`: 만료일 (시작일 + 30일)

---

### ⏳ 다음 단계 (필요 시 구현)

#### 2. 만료 플랜 자동 처리 (Vercel Cron Job)

**파일 생성:** `app/api/cron/expire-plans/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

/**
 * Vercel Cron Job: 매일 실행
 * 만료된 플랜을 FREE로 다운그레이드
 */
export async function GET(req: Request) {
  // Cron 보안 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()

    // 만료된 플랜 조회
    const { data: expiredUsers, error: selectError } = await supabase
      .from('users')
      .select('email, name, plan, plan_expires_at')
      .lt('plan_expires_at', now)
      .neq('plan', 'FREE')

    if (selectError) throw selectError

    console.log(`[Cron] 만료된 플랜: ${expiredUsers?.length || 0}개`)

    // FREE로 다운그레이드
    for (const user of expiredUsers || []) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: 'FREE',
          updated_at: new Date().toISOString(),
        })
        .eq('email', user.email)

      if (updateError) {
        console.error(`[Cron] ${user.email} 다운그레이드 실패:`, updateError)
        continue
      }

      console.log(`[Cron] ${user.email} → FREE 전환 완료`)

      // TODO: 만료 알림 이메일 발송
      // await sendExpirationEmail(user.email, user.name)
    }

    return NextResponse.json({
      success: true,
      processed: expiredUsers?.length || 0,
      timestamp: now,
    })
  } catch (error: any) {
    console.error('[Cron] 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Vercel 설정:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-plans",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**스케줄:** 매일 오전 2시 (한국 시간 11시)

---

#### 3. 만료 알림 이메일

**파일 생성:** `app/api/cron/send-expiration-reminders/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

/**
 * 만료 3일 전 알림 이메일
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    const { data: expiringUsers } = await supabase
      .from('users')
      .select('email, name, plan, plan_expires_at')
      .gte('plan_expires_at', threeDaysLater.toISOString())
      .lt('plan_expires_at', new Date(threeDaysLater.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .neq('plan', 'FREE')

    for (const user of expiringUsers || []) {
      // TODO: 이메일 발송
      console.log(`[Reminder] ${user.email} - 3일 후 만료`)
    }

    return NextResponse.json({
      success: true,
      sent: expiringUsers?.length || 0,
    })
  } catch (error: any) {
    console.error('[Reminder] 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Vercel 설정:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-plans",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-expiration-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

---

### 📊 수동 갱신 플로우

```
결제 완료
    ↓
plan_expires_at 저장 (2026-07-30)
    ↓
[30일 사용]
    ↓
만료 3일 전
    ↓
이메일 알림: "플랜이 곧 만료됩니다"
    ↓
만료일 도달 (2026-07-30)
    ↓
Cron job 실행
    ↓
FREE로 자동 다운그레이드
    ↓
이메일 알림: "플랜이 만료되었습니다. 갱신하세요."
    ↓
사용자가 수동으로 재결제
```

---

## Phase 2: 자동 갱신 (나중에)

**시기:** 사용자 100명 이상, 월 매출 100만원 이상

### 🎯 목표

- 사용자 편의성 향상
- 구독 유지율 증가
- 안정적인 매출

---

### 구현 단계

#### 1. 빌링키 발급

**토스페이먼츠 빌링 인증:**

```typescript
// app/payment/page.tsx
const handleBillingAuth = async () => {
  const tossPayments = await loadTossPayments(clientKey)

  await tossPayments.requestBillingAuth({
    customerKey: session.user.email, // 고유 식별자
    successUrl: `${window.location.origin}/payment/billing-success`,
    failUrl: `${window.location.origin}/payment/billing-fail`,
  })
}
```

**빌링 성공 처리:**

```typescript
// app/payment/billing-success/page.tsx
const searchParams = useSearchParams()
const authKey = searchParams.get('authKey')
const customerKey = searchParams.get('customerKey')

// 빌링키 발급
const res = await fetch('https://api.tosspayments.com/v1/billing/authorizations/{authKey}', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${encodedSecretKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerKey,
  })
})

const { billingKey } = await res.json()

// DB에 저장
await supabase
  .from('users')
  .update({
    billing_key: billingKey,
    auto_renew: true,
  })
  .eq('email', customerKey)
```

---

#### 2. DB 스키마 추가

```sql
-- users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN billing_key TEXT;
ALTER TABLE users ADD COLUMN auto_renew BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_billed_at TIMESTAMPTZ;
```

---

#### 3. 자동 결제 Cron Job

**파일 생성:** `app/api/cron/auto-renew/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 300 // 5분

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 내일 만료되는 자동 갱신 사용자 조회
    const { data: renewalUsers } = await supabase
      .from('users')
      .select('*')
      .eq('auto_renew', true)
      .lte('plan_expires_at', tomorrow.toISOString())
      .not('billing_key', 'is', null)

    const results = []

    for (const user of renewalUsers || []) {
      try {
        // 금액 계산
        const amount = user.plan === 'PRO' 
          ? (user.user_type === 'HEADHUNTER' ? 13930 : 6930)
          : (user.user_type === 'HEADHUNTER' ? 34930 : 20930)

        // 빌링키로 자동 결제
        const res = await fetch(`https://api.tosspayments.com/v1/billing/${user.billing_key}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerKey: user.email,
            amount,
            orderId: `auto_${Date.now()}_${user.email}`,
            orderName: `JOBIZIC ${user.plan} 자동 갱신`,
          })
        })

        if (!res.ok) {
          throw new Error('결제 실패')
        }

        // 만료일 연장
        const newExpiresAt = new Date(new Date(user.plan_expires_at).getTime() + 30 * 24 * 60 * 60 * 1000)

        await supabase
          .from('users')
          .update({
            plan_expires_at: newExpiresAt.toISOString(),
            last_billed_at: new Date().toISOString(),
          })
          .eq('email', user.email)

        // 결제 내역 저장
        await supabase.from('payments').insert({
          user_email: user.email,
          order_id: `auto_${Date.now()}_${user.email}`,
          amount,
          status: 'DONE',
          method: 'BILLING',
          is_auto_renewal: true,
        })

        results.push({ email: user.email, success: true })

        // TODO: 성공 이메일 발송
      } catch (error: any) {
        console.error(`[AutoRenew] ${user.email} 실패:`, error)
        
        // 실패 시 자동 갱신 OFF
        await supabase
          .from('users')
          .update({ auto_renew: false })
          .eq('email', user.email)

        results.push({ email: user.email, success: false, error: error.message })

        // TODO: 실패 이메일 발송 (결제 수단 확인 요청)
      }
    }

    return NextResponse.json({
      success: true,
      processed: renewalUsers?.length || 0,
      results,
    })
  } catch (error: any) {
    console.error('[AutoRenew] 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Vercel 설정:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-plans",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-expiration-reminders",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/auto-renew",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

#### 4. 구독 관리 UI

**파일 생성:** `app/subscription/page.tsx`

```tsx
'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const [autoRenew, setAutoRenew] = useState(true)

  const toggleAutoRenew = async () => {
    const res = await fetch('/api/subscription/toggle', {
      method: 'POST',
      body: JSON.stringify({ autoRenew: !autoRenew }),
    })

    if (res.ok) {
      setAutoRenew(!autoRenew)
    }
  }

  return (
    <div>
      <h1>구독 관리</h1>
      
      <div>
        <h2>현재 플랜: {session?.user?.plan}</h2>
        <p>만료일: 2026-07-30</p>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={toggleAutoRenew}
          />
          자동 갱신
        </label>
        <p>
          {autoRenew 
            ? '매월 자동으로 결제됩니다.' 
            : '만료 시 수동으로 갱신해야 합니다.'}
        </p>
      </div>

      <button>결제 수단 변경</button>
      <button>구독 취소</button>
    </div>
  )
}
```

---

### 📊 자동 갱신 플로우

```
최초 결제 + 빌링키 발급
    ↓
billing_key 저장
auto_renew = true
    ↓
[30일 사용]
    ↓
만료 1일 전
    ↓
Cron job 실행
    ↓
빌링키로 자동 결제
    ↓
성공 → plan_expires_at 연장 (+ 30일)
실패 → auto_renew OFF + 이메일 알림
    ↓
[계속 사용 또는 수동 갱신]
```

---

## 구현 가이드

### Phase 1 구현 (30분)

#### 1. 환경변수 추가

```env
# .env.local
CRON_SECRET=your-random-secret-key-here
```

#### 2. vercel.json 생성

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-plans",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-expiration-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### 3. Cron API 생성

위의 코드 복사해서 생성:
- `app/api/cron/expire-plans/route.ts`
- `app/api/cron/send-expiration-reminders/route.ts`

#### 4. Vercel 배포

```bash
git add .
git commit -m "feat: 플랜 만료 자동 처리 Cron job 추가"
git push
```

#### 5. Vercel 대시보드에서 환경변수 설정

```
CRON_SECRET = your-random-secret-key
```

---

### Phase 2 구현 (3-5일)

#### 1. DB 스키마 추가

Supabase SQL Editor:
```sql
ALTER TABLE users ADD COLUMN billing_key TEXT;
ALTER TABLE users ADD COLUMN auto_renew BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_billed_at TIMESTAMPTZ;
```

#### 2. 빌링 인증 페이지 생성

위의 코드 참고

#### 3. 자동 갱신 Cron 추가

위의 코드 참고

#### 4. 구독 관리 UI 추가

위의 코드 참고

---

## 타임라인

### MVP (현재)
```
✅ 결제 완료
✅ 만료일 저장
→ 수동 갱신
```

### 1개월 후 (사용자 30명+)
```
+ Cron job 추가
+ 만료 알림 이메일
→ 자동 만료 처리
```

### 3개월 후 (사용자 100명+)
```
+ 빌링키 발급
+ 자동 갱신
+ 구독 관리 UI
→ 완전 자동화
```

---

## 비용 분석

### 수동 갱신
- 개발 비용: 30분
- 운영 비용: 무료 (Vercel Cron)
- 유지율: 40-60%

### 자동 갱신
- 개발 비용: 3-5일
- 운영 비용: 무료 (Vercel Cron)
- 유지율: 80-90%

---

## 법적 고려사항

### 자동 갱신 시 필수사항

1. **명시적 동의**
   - 최초 결제 시 자동 갱신 동의 체크박스
   - 약관에 명시

2. **사전 알림**
   - 자동 결제 3일 전 이메일 발송
   - 결제 예정 금액 명시

3. **쉬운 해지**
   - 언제든 자동 갱신 OFF 가능
   - 대시보드에서 원클릭 해지

4. **환불 정책**
   - 자동 결제 후 7일 이내 전액 환불

---

## 추천 사항

**인배:** "초기에는 수동 갱신으로 시작하세요!"

### 이유:
1. 빠른 출시
2. 간단한 운영
3. 사용자 피드백 수집
4. 법적 리스크 최소화

### 자동 갱신 전환 시점:
- 월 활성 사용자 100명 이상
- 월 구독 매출 100만원 이상
- 사용자 요청 증가

---

## 참고 자료

- [토스페이먼츠 빌링 문서](https://docs.tosspayments.com/guides/billing)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**작성일:** 2026-06-30  
**작성자:** 미르팀 (DIVA, DIA, TES, CONAN, INBAE)  
**버전:** 1.0
