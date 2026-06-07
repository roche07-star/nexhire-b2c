# NexHire B2C (adam) 프로젝트 인수인계 문서
**작성일**: 2026-06-07  
**대상**: 디바(Backend 총괄), 테스(QA 테스터)  
**작성자**: ROCHE (프로젝트 오너)

---

## 📋 프로젝트 개요

### 기본 정보
- **프로젝트 코드명**: adam
- **제품명**: Jobizic (브랜드명), 회사명 HEDING
- **성격**: 한국 구직자 대상 AI 이력서 분석 B2C SaaS
- **디렉토리**: `c:\project\nexhire_b2c`
- **배포 URL**: https://jobizic.vercel.app/
- **GitHub**: https://github.com/roche07-star/nexhire-b2c.git (main 브랜치)

### 팀 구성
- **디바(DIVA)**: 15년차 Backend 개발자 + S/W 총괄
- **디아(DIA)**: 9년차 Frontend 전담 개발자
- **테스(TES)**: 13년차 S/W 전문 테스터 (ISTQB 자격증)

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Libraries**: React 19, CSS Modules
- **Auth**: NextAuth 5 (Google OAuth)
- **상태관리**: React Hooks, Context API

### Backend
- **Runtime**: Node.js (Vercel Serverless, maxDuration=60초)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (이력서 파일)
- **AI**: Anthropic Claude API
  - 기본 모델: `claude-haiku-4-5-20251001` (속도/비용 최적화)
  - 면접 가이드: `claude-sonnet-4-5` (고품질, EXPERT 플랜만)
  - **Prompt Caching 적용**: 90% 비용 절감

### DevOps
- **배포**: Vercel (자동 배포, main 브랜치 push 시)
- **환경변수**: `.env.local` (로컬), Vercel Dashboard (프로덕션)
- **버전관리**: Git + GitHub

---

## 📊 Database 스키마 (Supabase)

### 1. `users` 테이블
```sql
- email (text, PK) — 사용자 이메일
- plan (text) — FREE | EXPERT
- role (text) — USER | MANAGER | ADMIN
- created_at (timestamp)
```

### 2. `analyses` 테이블 (이력서 분석 결과)
```sql
- id (uuid, PK)
- user_email (text, FK → users.email)
- result (jsonb) — 분석 결과 JSON
- created_at (timestamp)
```

### 3. `jd_analyses` 테이블 (JD 기반 분석)
```sql
- id (uuid, PK)
- user_email (text, FK → users.email)
- result (jsonb) — JD 분석 결과 JSON
- created_at (timestamp)
```

### 4. `interview_guides` 테이블 (면접 가이드, EXPERT 전용)
```sql
- id (uuid, PK)
- user_email (text, FK → users.email)
- result (jsonb) — 면접 가이드 JSON (6개 섹션)
- created_at (timestamp)
- expires_at (timestamp) — 생성일 + 10일
```

### 5. `jd_templates` 테이블 (JD 템플릿 저장)
```sql
- id (uuid, PK)
- user_email (text, FK → users.email)
- template_name (text) — 사용자 정의 템플릿 이름
- jd_text (text) — JD 본문
- created_at (timestamp)
```

### 6. `coupons` 테이블 (쿠폰 시스템)
```sql
- id (uuid, PK)
- code (text, unique) — 쿠폰 코드
- plan (text) — EXPERT
- max_uses (int) — 최대 사용 횟수
- current_uses (int) — 현재 사용 횟수
- expiry_date (timestamp) — 만료일
- created_at (timestamp)
```

### 7. `coupon_redemptions` 테이블 (쿠폰 사용 기록)
```sql
- id (uuid, PK)
- user_email (text, FK → users.email)
- coupon_id (uuid, FK → coupons.id)
- redeemed_at (timestamp)
```

---

## 🎯 핵심 기능

### 1. 이력서 분석 (Resume Analysis)
- **경로**: `/analyze` (탭 1)
- **API**: `POST /api/analyze`
- **모델**: `claude-haiku-4-5-20251001`
- **기능**: 이력서(PDF/DOCX/TXT) 업로드 → AI 분석 → 5개 섹션 결과
  1. 경력 요약 (2-3줄)
  2. 핵심 강점 (5개)
  3. 개선 필요 영역 (5개, 상위 2개 빨간색 강조)
  4. 추천 직무 (3개)
  5. 발전 방향 (3개)
- **저장**: `analyses` 테이블에 JSON 저장

### 2. 분석 Report (Analysis History)
- **경로**: `/analyze` (탭 2)
- **API**: `GET /api/analyze/list`, `GET /api/analyze/[id]`
- **기능**: 저장된 분석 목록 조회, 상세보기, 추가 질문 (`/api/analyze/refine`)

### 3. JD 기반 분석 (JD-Based Analysis)
- **경로**: `/analyze` (탭 3)
- **API**: `POST /api/analyze/jd`, `GET /api/analyze/jd/list`
- **기능**: JD 텍스트 입력 → 이력서와 적합도 분석 → 4개 섹션
  1. 적합도 점수 (0-100)
  2. 강점 매칭 (5개)
  3. 약점/격차 (5개)
  4. 추천 액션 (5개)
- **템플릿**: DB 저장 (`jd_templates`)

### 4. 이력서 생성 (Resume Rewrite)
- **경로**: `/analyze` (탭 4)
- **API**: `POST /api/analyze/rewrite`
- **모델**: `claude-haiku-4-5-20251001`
- **기능**: 기존 이력서 → Claude 리라이팅 → DOCX/PDF 다운로드
- **라이브러리**: `docx` (DOCX 생성), `unpdf` (PDF 변환)

### 5. 면접 가이드 (Interview Guide, EXPERT 전용)
- **경로**: `/analyze` (탭 5)
- **API**: `POST /api/analyze/interview`, `GET /api/analyze/interview/list`
- **모델**: `claude-sonnet-4-5` (고품질, max_tokens=8192)
- **권한**: EXPERT 플랜 또는 MANAGER role만 접근
- **기능**: 6개 섹션 맞춤 가이드 생성
  1. 예상 질문 (7개)
  2. 모범 답변 (각 질문당)
  3. 피해야 할 답변 (각 질문당)
  4. STAR 기법 적용 예시 (3개)
  5. 역질문 추천 (정확히 3개)
  6. 면접 준비 체크리스트 (5개)
- **저장**: `interview_guides` 테이블 (10일 후 만료)
- **다운로드**: HTML 파일로 다운로드 가능

### 6. Admin 페이지 (관리자 전용)
- **경로**: `/admin`
- **권한**: ADMIN role만 접근
- **기능**:
  - 전체 사용자 목록 조회
  - 플랜 변경 (FREE ↔ EXPERT)
  - Role 변경 (USER/MANAGER/ADMIN)
  - 쿠폰 생성/관리
  - 데이터 초기화 (테스트용)

---

## 🔌 주요 API 라우트

### 분석 관련
- `POST /api/analyze` — 이력서 분석 (tool_use 패턴)
- `POST /api/analyze/refine` — 분석 보완 질문
- `GET /api/analyze/list` — 저장된 분석 목록
- `GET /api/analyze/[id]` — 특정 분석 상세
- `POST /api/analyze/[id]/expand` — 섹션 확장 질문

### JD 분석
- `POST /api/analyze/jd` — JD 기반 분석
- `GET /api/analyze/jd/list` — JD 분석 목록
- `GET /api/analyze/jd/[id]` — JD 분석 상세

### 이력서 생성
- `POST /api/analyze/rewrite` — 이력서 리라이팅 (DOCX/PDF)

### 면접 가이드 (EXPERT)
- `POST /api/analyze/interview` — 면접 가이드 생성
- `GET /api/analyze/interview/list` — 면접 가이드 목록

### 사용자 관리
- `GET /api/my-info` — 현재 사용자 정보
- `POST /api/user/delete` — 회원 탈퇴

### Admin
- `GET /api/admin/user-detail` — 사용자 상세 정보
- `POST /api/admin/plan` — 플랜 변경
- `POST /api/admin/reset` — 데이터 초기화
- `POST /api/admin/coupons` — 쿠폰 생성
- `GET /api/admin/coupons` — 쿠폰 목록

### 기타
- `GET /api/jd-templates` — JD 템플릿 목록
- `POST /api/jd-templates` — JD 템플릿 저장
- `POST /api/coupons/claim` — 쿠폰 사용
- `GET /api/coupons/mine` — 내 쿠폰 목록

---

## 🎨 디자인 시스템

### 컬러 팔레트
- **배경**: `#0a0a0f` (다크)
- **액센트 옐로우**: `#e8ff47`
- **액센트 퍼플**: `#7b61ff`
- **텍스트**: `#f0f0f0` (밝은 회색)

### 폰트
- **영문**: Outfit (Google Fonts)
- **한글**: Noto Sans KR (Google Fonts)

### 반응형 디자인
- **모바일 우선**: 최근 모바일 최적화 대폭 강화
- **브레이크포인트**: 768px (모바일 ↔ 데스크톱)
- **최근 작업**: 모든 분석 페이지 모바일 UI 크기 축소, `!important` 적용

---

## 🔐 환경변수 (.env.local)

```env
# Anthropic API
ANTHROPIC_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 📝 중요 패턴 및 컨벤션

### 1. `toArr()` 헬퍼 함수
- **위치**: 클라이언트/서버 양쪽에서 사용
- **목적**: DB/AI에서 오는 필드가 `string | array | null` 가변 타입일 때 방어적 처리
```typescript
function toArr(v: any): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return [v];
  return [];
}
```

### 2. Prompt Caching
- **적용 파일**: `POST /api/analyze`, `/api/analyze/jd`, `/api/analyze/interview`
- **패턴**: system prompt에 `cache_control: { type: "ephemeral" }` 추가
- **효과**: 90% 비용 절감 (반복 호출 시 캐싱)

### 3. Tool Use 패턴 (Claude API)
- **분석 API**: `tool_use` 패턴으로 구조화된 JSON 응답 강제
- **Tool Schema**: 각 API마다 고정된 스키마 정의
- **면접 가이드**: `reverse_questions` 정확히 3개 고정

### 4. 권한 체크
- **FREE 플랜**: 이력서 분석만
- **EXPERT 플랜**: 모든 기능 + 면접 가이드
- **MANAGER role**: 자동 EXPERT 권한 부여
- **ADMIN role**: 모든 권한 + Admin 페이지 접근

### 5. DB 접근 패턴
- **Service Role Key 사용**: RLS 우회 (서버 사이드에서만)
- **Anon Key**: 클라이언트에서 Supabase Storage 접근

---

## 🚀 최근 주요 업데이트 (Git Log)

### 2026-06-03: Prompt Caching 완료
- **커밋**: `64ca93f`, `6adf36f`
- **내용**: 모든 분석 API에 Prompt Caching 적용 (90% 비용 절감)
- **파일**: `/api/analyze`, `/api/analyze/jd`, `/api/analyze/interview`

### 2026-06-01~02: 모바일 최적화
- **커밋**: `55d39b8`, `9ae92d9`, `edbbcec`, `4fd9721`, `27402fd`, `e6e34aa`, `232b6d2`, `21ab380`
- **내용**: 전면적인 모바일 반응형 디자인 개선
  - 모든 분석 페이지 UI 크기 축소
  - `!important` 플래그로 모바일 스타일 우선순위 강제
  - 중복 미디어 쿼리 제거
  - Footer 링크 중앙 정렬

### 2026-05-31: JD 템플릿 DB 저장
- **커밋**: `ba589f6`
- **내용**: localStorage → Supabase DB로 마이그레이션
- **테이블**: `jd_templates` 추가

### 2026-05-28~30: 분석 품질 개선
- **커밋**: `a3be54a`, `b779fee`, `de1a6e9`, `3268026`, `d455b7f`, `fbce6c4`
- **내용**:
  - 모든 분석 프롬프트에 일관성 요구사항 추가
  - 개선 영역 상위 2개 빨간색 강조
  - 리스크 키워드 자동 감지
  - Summary 레이블에서 콜론 제거
  - 중점(middot) 사용 금지, 강제 줄바꿈

---

## 🧪 테스트 체크리스트 (테스 담당)

### 1. 인증 플로우
- [ ] Google 로그인 정상 동작
- [ ] 로그아웃 후 보호된 페이지 접근 차단
- [ ] 세션 만료 시 자동 리다이렉트

### 2. 이력서 분석
- [ ] PDF/DOCX/TXT 업로드 정상
- [ ] 분석 결과 5개 섹션 모두 표시
- [ ] 개선 영역 상위 2개 빨간색 강조 확인
- [ ] DB 저장 확인 (`analyses` 테이블)
- [ ] 분석 목록에서 조회 가능

### 3. JD 기반 분석
- [ ] JD 텍스트 입력 후 분석 정상
- [ ] 적합도 점수 0-100 범위
- [ ] 4개 섹션 모두 표시
- [ ] 템플릿 저장 후 불러오기 정상

### 4. 이력서 생성
- [ ] DOCX 다운로드 정상
- [ ] PDF 다운로드 정상
- [ ] 기존 이력서 내용 보존 확인
- [ ] 파일명 자동 생성 (`resume_YYYYMMDD_HHMMSS`)

### 5. 면접 가이드 (EXPERT)
- [ ] FREE 플랜 접근 차단 확인
- [ ] EXPERT/MANAGER 플랜 정상 접근
- [ ] 6개 섹션 모두 생성
- [ ] `reverse_questions` 정확히 3개 확인
- [ ] HTML 다운로드 정상
- [ ] DB 저장 및 10일 만료 확인

### 6. Admin 페이지
- [ ] ADMIN role만 접근 가능
- [ ] 사용자 목록 조회
- [ ] 플랜 변경 정상 동작
- [ ] Role 변경 정상 동작
- [ ] 쿠폰 생성 및 목록 조회

### 7. 모바일 반응형
- [ ] 모든 페이지 모바일 레이아웃 확인
- [ ] 탭 전환 정상 동작
- [ ] 버튼 크기 적정 (터치 가능)
- [ ] 텍스트 가독성 확인

### 8. 성능
- [ ] 분석 API 응답 시간 (60초 이내)
- [ ] Prompt Caching 적용 확인 (2번째 호출부터 빠름)
- [ ] 대용량 이력서 (10MB+) 업로드 테스트

### 9. 에러 핸들링
- [ ] 네트워크 오류 시 에러 메시지 표시
- [ ] 권한 없음 시 접근 차단
- [ ] 잘못된 파일 형식 업로드 시 경고
- [ ] API 타임아웃 시 재시도 안내

---

## 🛠 개발 환경 설정 (로컬)

### 1. 저장소 클론
```bash
git clone https://github.com/roche07-star/nexhire-b2c.git
cd nexhire-b2c
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
cp .env.local.example .env.local
# .env.local 파일 편집 (API 키 입력)
```

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

### 5. 빌드 및 배포
```bash
npm run build  # 로컬 빌드 테스트
git push origin main  # Vercel 자동 배포
```

---

## 🔗 관련 링크

- **프로덕션**: https://jobizic.vercel.app/
- **GitHub**: https://github.com/roche07-star/nexhire-b2c
- **Vercel Dashboard**: (디바에게 초대 필요)
- **Supabase Dashboard**: (디바에게 초대 필요)
- **Anthropic Console**: (디바에게 API 키 공유)

---

## 📌 다음 작업 (Backlog)

### 우선순위 High
- [ ] 쿠폰 시스템 프론트엔드 UI 개선 (디아)
- [ ] 분석 결과 PDF 저장 기능 (디바)
- [ ] 면접 가이드 템플릿 다양화 (디바)

### 우선순위 Medium
- [ ] 이력서 분석 히스토리 검색 기능 (디아 + 디바)
- [ ] 사용자 대시보드 개선 (디아)
- [ ] 이메일 알림 기능 (디바)

### 우선순위 Low
- [ ] 다국어 지원 (영문) (디아 + 디바)
- [ ] 분석 결과 공유 기능 (디아 + 디바)

---

## 📞 연락처

- **프로젝트 오너**: ROCHE (roche07he@gmail.com)
- **디바(Backend 총괄)**: [이메일 추가 필요]
- **디아(Frontend 전담)**: [이메일 추가 필요]
- **테스(QA 테스터)**: [이메일 추가 필요]

---

**작성일**: 2026-06-07  
**문서 버전**: 1.0  
**마지막 업데이트**: 디바, 테스 인수인계용 초안
