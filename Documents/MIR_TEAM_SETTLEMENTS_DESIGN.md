# 🌍 미르팀 회의록: Adam 정산 기능 설계

**일시**: 2026-07-05  
**참석자**: 디바(Backend), 디아(Frontend), 자인(Frontend), 테스(QA), 코난(Security), 인배(Business)  
**주제**: Super Admin 정산 기능 설계 (실제 플랜 구독 발생 시)

---

## 📋 회의 안건

Adam(NexHire B2C)에서 실제 플랜 구독이 발생했을 때를 가정한 **Super Admin 정산 기능** 설계
- 가독성 높은 정산 대시보드
- UX 우선 고려

---

## 💡 핵심 요구사항 분석 (인배)

### 정산해야 할 데이터
1. **월별 구독 수익** (MRR)
   - 플랜별 구독자 수 × 단가
   - 할인 적용 반영

2. **결제 내역**
   - 사용자별 결제 이력
   - 결제 방법 (카드, 계좌이체 등)
   - 결제 상태 (성공/실패/환불)

3. **환불 내역**
   - 환불 사유
   - 환불 금액
   - 환불 일자

4. **쿠폰 사용 내역**
   - 쿠폰 발급/사용 통계
   - 쿠폰 할인액

5. **정산 지표**
   - 총 매출 (Gross Revenue)
   - 순 매출 (Net Revenue = 총 매출 - 환불)
   - ARPU (Average Revenue Per User)
   - LTV (Lifetime Value)
   - Churn Rate (이탈률)

---

## 🎨 UX/UI 설계 (디아 + 자인)

### 1️⃣ 대시보드 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  📊 정산 대시보드                    [기간 선택 ▼]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ 총매출 │  │ 순매출 │  │ 환불액 │  │ MRR    │   │
│  │ 450K   │  │ 420K   │  │ 30K    │  │ 150K   │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  📈 월별 매출 추이 (차트)                    │  │
│  │                                                │  │
│  │  [막대그래프 또는 라인 차트]                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  🔍 결제 내역                    [검색 🔎]    │  │
│  ├──────┬────────┬────────┬────────┬──────────┤  │
│  │ 일자 │ 사용자 │ 플랜   │ 금액   │ 상태     │  │
│  ├──────┼────────┼────────┼────────┼──────────┤  │
│  │ 7/5  │ user@  │ PRO    │ 6,930  │ ✅ 성공  │  │
│  │ 7/4  │ head@  │ EXPERT │ 34,930 │ ✅ 성공  │  │
│  │ 7/3  │ test@  │ PRO    │ 6,930  │ ❌ 실패  │  │
│  └──────┴────────┴────────┴────────┴──────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2️⃣ 색상 시스템 (디아 제안)

**KPI 타일:**
- 총매출: `linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)` (파란색)
- 순매출: `linear-gradient(135deg, #10b981 0%, #34d399 100%)` (초록색)
- 환불액: `linear-gradient(135deg, #ef4444 0%, #f87171 100%)` (빨간색)
- MRR: `linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)` (보라색)

**결제 상태:**
- ✅ 성공: `#10b981`
- ❌ 실패: `#ef4444`
- 🔄 환불: `#f59e0b`
- ⏳ 대기: `#6b7280`

### 3️⃣ 기간 선택 (자인 제안)

```
[오늘] [이번 주] [이번 달] [지난달] [직접 선택 ▼]
```

- 기본값: 이번 달
- 직접 선택: 날짜 범위 선택 (DatePicker)
- 실시간 업데이트

### 4️⃣ 결제 내역 필터 (디아 + 자인)

```
[전체 플랜 ▼] [전체 상태 ▼] [사용자 검색 🔎]
```

- 플랜: FREE / PRO / EXPERT / 전체
- 상태: 성공 / 실패 / 환불 / 대기 / 전체
- 검색: 이메일, 이름으로 검색

---

## 🛠️ 기술 설계 (디바)

### DB 스키마 (Supabase)

#### 1. `subscriptions` 테이블 (신규)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES users(email),
  plan TEXT NOT NULL CHECK (plan IN ('FREE', 'PRO', 'EXPERT')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  billing_cycle TEXT DEFAULT 'monthly',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_email ON subscriptions(user_email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_started_at ON subscriptions(started_at);
```

#### 2. `payments` 테이블 (신규)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'refunded', 'pending')),
  payment_method TEXT, -- 'card', 'bank_transfer', 'coupon'
  payment_gateway TEXT, -- 'tosspayments', 'portone', etc.
  transaction_id TEXT UNIQUE,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_email ON payments(user_email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
```

#### 3. `refunds` 테이블 (신규)

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_by TEXT, -- user or admin
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
```

### API 엔드포인트

```typescript
// 정산 대시보드 요약
GET /api/admin/settlements/summary?start=2026-07-01&end=2026-07-31

// 결제 내역 조회
GET /api/admin/settlements/payments?page=1&limit=50&plan=PRO&status=success

// 환불 처리
POST /api/admin/settlements/refund
Body: { paymentId, amount, reason }

// 월별 매출 차트 데이터
GET /api/admin/settlements/chart?start=2026-01-01&end=2026-12-31
```

---

## 🔒 보안 검토 (코난)

### 1. 권한 체크
```typescript
// SUPER_ADMIN만 접근 가능
const session = await auth()
if (!isSuperAdmin(session)) {
  return NextResponse.json({ error: '권한 없음' }, { status: 403 })
}
```

### 2. 민감 정보 마스킹
- 사용자 이메일: `user****@gmail.com`
- 결제 카드번호: `****-****-****-1234`
- 계좌번호: `***-**-12345`

### 3. 환불 처리 로그
- 환불 요청자 기록 (user / admin)
- 환불 사유 필수 입력
- 환불 승인 2단계 확인

### 4. 데이터 암호화
- 결제 정보는 암호화 저장
- transaction_id는 해시 처리 가능

---

## ✅ QA 체크리스트 (테스)

### 기능 테스트
- [ ] 기간별 정산 조회 정확도
- [ ] 결제 내역 필터링 동작
- [ ] 환불 처리 프로세스
- [ ] 차트 데이터 정확도
- [ ] 페이지네이션 동작

### UX 테스트
- [ ] 대시보드 로딩 속도 (< 2초)
- [ ] 모바일 반응형 레이아웃
- [ ] 필터/검색 UX 직관성
- [ ] 에러 메시지 명확성
- [ ] 다운로드/엑스포트 기능

### 엣지 케이스
- [ ] 결제 내역 0건일 때
- [ ] 환불액이 매출보다 클 때
- [ ] 동일 사용자 중복 결제
- [ ] 결제 취소 후 재결제

---

## 📊 정산 지표 계산 로직 (인배)

### 1. MRR (Monthly Recurring Revenue)
```
MRR = Σ(활성 구독자 수 × 플랜 단가)

예시:
- PRO 10명 × 10,430원 = 104,300원
- EXPERT 5명 × 27,930원 = 139,650원
- MRR = 243,950원
```

### 2. ARPU (Average Revenue Per User)
```
ARPU = 총 매출 / 활성 사용자 수
```

### 3. Churn Rate (이탈률)
```
Churn Rate = (이번 달 해지 사용자 / 지난달 활성 사용자) × 100
```

### 4. LTV (Lifetime Value)
```
LTV = ARPU / Churn Rate
```

---

## 🎯 1차 개발 우선순위 (전체 합의)

### Phase 1 (필수)
1. ✅ Nav 메뉴 추가 (완료)
2. 정산 대시보드 페이지 생성
   - 4개 KPI 타일 (총매출/순매출/환불/MRR)
   - 기간 선택 UI
3. DB 테이블 생성 (subscriptions, payments, refunds)
4. 결제 내역 테이블 (필터/검색)

### Phase 2 (추가)
5. 월별 매출 차트 (Recharts)
6. 환불 처리 기능
7. 엑셀 다운로드

### Phase 3 (고도화)
8. 플랜별 전환율 분석
9. 코호트 분석
10. 예측 매출 (Forecast)

---

## 💬 미르팀 의견

### 디바 (Backend)
> "DB 설계가 핵심이에요. subscriptions와 payments를 분리해서 히스토리 추적이 가능하도록 설계했습니다. RLS(Row Level Security)는 SUPER_ADMIN만 접근 가능하도록 설정하겠습니다."

### 디아 (Frontend)
> "AdminClient처럼 하나의 페이지에서 탭으로 구분하는 게 좋을 것 같아요. '요약/결제내역/환불' 3개 탭으로 나누고, 차트는 요약 탭에 포함시키죠."

### 자인 (Frontend)
> "기간 선택 UI는 react-datepicker 대신 직접 만드는 게 일관성 있을 것 같습니다. 버튼으로 빠른 선택 + 커스텀 날짜 범위 선택 두 가지 방식을 제공하면 UX가 좋을 거예요."

### 테스 (QA)
> "결제 내역이 많아지면 페이지네이션이 필수인데, 무한 스크롤보다는 페이지 번호로 하는 게 관리자 화면에는 맞을 것 같아요. 그리고 엑셀 다운로드는 필수입니다."

### 코난 (Security)
> "환불 처리는 특히 조심해야 해요. 승인 프로세스 없이 바로 환불되면 안 되고, 환불 사유와 처리자를 반드시 로깅해야 합니다. 또한 PG사 연동 시 API 키는 환경변수로 관리하고, 결제 정보는 암호화 필수입니다."

### 인배 (Business)
> "투자 유치나 IR 자료 만들 때 MRR과 Churn Rate가 가장 중요해요. 이 지표들은 월별로 추적해서 차트로 보여주면 좋겠어요. 그리고 나중에 코호트 분석까지 가면 금상첨화죠."

---

## 📌 결론 및 다음 단계

### 합의 사항
1. **DB 설계 우선**: subscriptions, payments, refunds 테이블 생성
2. **UI/UX**: 깔끔한 대시보드 + 직관적 필터링
3. **보안**: SUPER_ADMIN 전용, 민감정보 마스킹, 환불 로깅
4. **Phase 1 목표**: 기본 정산 대시보드 + 결제 내역 조회

### 다음 작업
- [ ] **디바**: DB 마이그레이션 파일 작성
- [ ] **디아 + 자인**: 정산 페이지 UI 컴포넌트 개발
- [ ] **코난**: 보안 가이드라인 문서화
- [ ] **테스**: QA 체크리스트 상세화
- [ ] **인배**: 비즈니스 지표 대시보드 와이어프레임

---

**작성자**: 미르팀 전체  
**검토자**: ROCHE (대표)  
**문서 버전**: 1.0  
**최종 수정**: 2026-07-05
