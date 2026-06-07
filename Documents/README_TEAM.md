# NexHire B2C (adam) - Team Guide

**프로젝트 코드명**: adam  
**제품명**: Jobizic  
**팀 구성**: 디바(총괄), 디아(Frontend), 테스(QA)

---

## 📚 문서 구조

### 1. [HANDOVER_DIVA_TES.md](./HANDOVER_DIVA_TES.md)
**대상**: 디바, 테스  
**내용**: 전체 프로젝트 인수인계 문서
- 프로젝트 개요
- 기술 스택
- Database 스키마
- 핵심 기능 (5개 분석 타입)
- API 라우트
- QA 체크리스트 (테스)
- Backlog

### 2. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**대상**: 디바  
**내용**: 배포 및 환경 설정 가이드
- Vercel 배포 프로세스
- 환경변수 체크리스트
- API 키 발급 방법
- Supabase 관리
- 트러블슈팅

### 3. Root 파일들
- `README.md`: 일반 사용자용 프로젝트 소개 (필요 시 작성)
- `.env.local.example`: 환경변수 템플릿

---

## 🎯 역할별 가이드

### 디바 (Backend 총괄)
**읽어야 할 문서**:
1. [HANDOVER_DIVA_TES.md](./HANDOVER_DIVA_TES.md) - 전체 시스템 이해
2. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 배포 및 환경 관리

**주요 책임**:
- API 라우트 개발 (`app/api/*`)
- Database 스키마 관리 (Supabase)
- AI 통합 (Claude API, Prompt Caching)
- 배포 관리 (Vercel)
- 환경변수 관리
- 성능 최적화

**일일 체크**:
- [ ] Vercel 배포 상태
- [ ] Anthropic API 사용량/비용
- [ ] Supabase Database 상태
- [ ] 에러 로그 (Vercel Functions)

### 디아 (Frontend 전담)
**읽어야 할 문서**:
1. [HANDOVER_DIVA_TES.md](./HANDOVER_DIVA_TES.md) - 전체 기능 이해
2. 디자인 시스템 섹션

**주요 책임**:
- UI/UX 개발 (`app/*`, `components/*`)
- 반응형 디자인 (모바일/데스크톱)
- 사용자 경험 최적화
- CSS/스타일링

**개발 시 주의**:
- 컬러: `#0a0a0f` (배경), `#e8ff47` (옐로우), `#7b61ff` (퍼플)
- 폰트: Outfit (영문), Noto Sans KR (한글)
- 모바일 브레이크포인트: 768px
- `toArr()` 헬퍼 사용 (배열 방어 처리)

### 테스 (QA 테스터)
**읽어야 할 문서**:
1. [HANDOVER_DIVA_TES.md](./HANDOVER_DIVA_TES.md) - QA 체크리스트 섹션
2. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 트러블슈팅 섹션

**주요 책임**:
- 기능 테스트 (9개 카테고리)
- 버그 리포트 (GitHub Issues)
- 회귀 테스트 (배포 전)
- 성능 테스트
- 크로스 브라우저 테스트

**테스트 환경**:
- **Staging**: Vercel Preview (PR 자동 생성)
- **Production**: https://jobizic.vercel.app/
- **로컬**: http://localhost:3000

**테스트 계정**:
- FREE 플랜: 일반 Google 계정
- EXPERT 플랜: `MANAGER_EMAILS`에 등록된 계정
- ADMIN: DB에서 role 수동 변경 필요

---

## 🔄 워크플로우

### 1. 기능 개발 프로세스
```
1. 디바/디아: GitHub Issues에서 작업 선택
2. 디바/디아: 로컬 브랜치 생성 (feature/xxx)
3. 디바/디아: 개발 + 로컬 테스트
4. 디바/디아: PR 생성 (main ← feature/xxx)
5. 테스: Vercel Preview에서 테스트
6. 테스: PR에 테스트 결과 코멘트
7. 디바: 코드 리뷰 + 승인
8. 디바: Merge → main (자동 배포)
9. 테스: Production 회귀 테스트
```

### 2. 긴급 버그 수정
```
1. 테스: GitHub Issues에 버그 리포트 (label: bug, priority: high)
2. 디바/디아: 즉시 수정 (hotfix/xxx 브랜치)
3. 디바: 로컬 테스트 후 main에 직접 push
4. 테스: Production 긴급 검증
```

### 3. 주간 배포 사이클
```
월요일: Sprint Planning (디바, 디아, 테스)
화-목: 개발 + PR 리뷰
금요일: 
  - 오전: 통합 테스트 (테스)
  - 오후: 배포 (디바)
  - 저녁: Production 검증 (테스)
```

---

## 🛠 개발 도구

### 필수 설치
- **Node.js**: v20 이상
- **npm**: v10 이상
- **Git**: 최신 버전
- **VS Code**: (권장) + TypeScript/ESLint 확장

### 권장 VS Code 확장
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

### CLI 도구
```bash
# Supabase CLI (디바)
npm install -g supabase

# Vercel CLI (디바)
npm install -g vercel
```

---

## 📊 성과 지표 (KPI)

### 개발 품질
- **빌드 성공률**: 100% (배포 전 필수)
- **TypeScript 에러**: 0개
- **Console 경고**: 최소화

### 성능
- **API 응답 시간**: 평균 <5초 (Prompt Caching 적용 후)
- **Vercel Function Timeout**: 0건 (60초 제한)
- **Prompt Cache Hit Rate**: >80% (목표: 90%)

### 품질
- **버그 리포트**: 주당 <5건
- **Critical 버그**: 즉시 수정 (24시간 이내)
- **회귀 테스트 통과율**: 100%

---

## 🚨 긴급 연락망

### Production Down 시
1. **디바**: Vercel Dashboard 확인 → 롤백
2. **테스**: 사용자 영향 범위 확인
3. **디아**: 필요 시 에러 페이지 개선

### API 크레딧 소진 시
1. **디바**: Anthropic Console → 크레딧 충전
2. **디바**: 비용 알림 설정 검토

### Database 장애 시
1. **디바**: Supabase Dashboard 확인
2. **디바**: Supabase Support 티켓 생성

---

## 📝 Git 컨벤션

### 커밋 메시지
```
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
style: 스타일링 변경 (CSS, UI)
docs: 문서 수정
test: 테스트 추가/수정
chore: 빌드 설정, 패키지 업데이트
```

### 브랜치 전략
- `main`: Production (보호됨, PR만 가능)
- `feature/xxx`: 기능 개발
- `hotfix/xxx`: 긴급 수정
- `refactor/xxx`: 리팩토링

---

## 📞 연락처

- **프로젝트 오너**: ROCHE (roche07he@gmail.com)
- **S/W 총괄 (디바)**: [이메일 추가 필요]
- **Frontend (디아)**: [이메일 추가 필요]
- **QA (테스)**: [이메일 추가 필요]

---

**작성일**: 2026-06-07  
**문서 버전**: 1.0
