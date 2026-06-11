# 오픈소스 라이선스 통합 공지 의무 보고서

**대상 프로젝트**: Adam (NexHire B2C) + Eve (Jobizic B2B)  
**작성자**: 코난 (CONAN) - 보안 및 법률 담당  
**협조**: 디바 (총괄), 디아 (Frontend), 테스 (QA)  
**날짜**: 2026-06-10  
**상태**: 🔴 긴급 - 법적 의무사항  

---

## 🎯 Executive Summary

### 현재 상태: 🔴 위험

```
❌ Adam(B2C): 오픈소스 라이선스 공지 없음
❌ Eve(B2B): 오픈소스 라이선스 공지 없음
❌ 법적 의무 미준수
❌ 잠재적 법적 리스크

→ 즉각 조치 필요!
```

### 권장 조치

```
✅ 즉시: NOTICE 파일 생성 (양 프로젝트)
✅ 단기: /licenses 페이지 추가
✅ 중기: 자동화 및 모니터링 체계
```

---

## 📊 프로젝트별 오픈소스 현황

### 🅰️ Adam (NexHire B2C)

**서비스**: https://jobizic.vercel.app  
**주요 의존성**: 11개  
**총 의존성**: 22개 (dev 포함)  

| 패키지 | 버전 | 라이선스 | 위험도 |
|--------|------|----------|--------|
| @anthropic-ai/sdk | ^0.98.0 | Apache 2.0 | 🟡 중간 |
| @supabase/supabase-js | ^2.106.1 | MIT | 🟢 낮음 |
| next | ^16.2.6 | MIT | 🟢 낮음 |
| react | ^19.1.0 | MIT | 🟢 낮음 |
| react-dom | ^19.1.0 | MIT | 🟢 낮음 |
| next-auth | ^5.0.0-beta.31 | ISC | 🟢 낮음 |
| docx | ^9.7.0 | MIT | 🟢 낮음 |
| mammoth | ^1.12.0 | BSD-2-Clause | 🟢 낮음 |
| jszip | ^3.10.1 | MIT/GPL | 🟡 중간 |
| unpdf | ^1.6.2 | MIT | 🟢 낮음 |

---

### 🅱️ Eve (Jobizic B2B)

**서비스**: (배포 URL 확인 필요)  
**주요 의존성**: 11개  
**총 의존성**: 20개 (dev 포함)  

| 패키지 | 버전 | 라이선스 | 위험도 |
|--------|------|----------|--------|
| @anthropic-ai/sdk | ^0.100.1 | Apache 2.0 | 🟡 중간 |
| @supabase/supabase-js | ^2.106.2 | MIT | 🟢 낮음 |
| @supabase/auth-helpers-nextjs | ^0.10.0 | MIT | 🟢 낮음 |
| @supabase/ssr | ^0.10.3 | MIT | 🟢 낮음 |
| next | 16.2.6 | MIT | 🟢 낮음 |
| react | 19.2.4 | MIT | 🟢 낮음 |
| react-dom | 19.2.4 | MIT | 🟢 낮음 |
| mammoth | ^1.12.0 | BSD-2-Clause | 🟢 낮음 |
| unpdf | ^1.6.2 | MIT | 🟢 낮음 |
| resend | ^6.12.4 | MIT | 🟢 낮음 |

---

### 📊 통합 분석

#### 공통 의존성

```
✅ @anthropic-ai/sdk (양 프로젝트)
✅ @supabase/supabase-js (양 프로젝트)
✅ next (양 프로젝트)
✅ react, react-dom (양 프로젝트)
✅ mammoth (양 프로젝트)
✅ unpdf (양 프로젝트)
```

#### 고유 의존성

**Adam만**:
- next-auth (인증)
- docx (문서 생성)
- jszip (ZIP 처리)

**Eve만**:
- @supabase/auth-helpers-nextjs (Supabase 인증)
- @supabase/ssr (SSR 지원)
- resend (이메일)

---

## 📜 라이선스별 통합 현황

### MIT License (가장 많음)

**적용 패키지 (총 15개)**:
- @supabase/* (3개)
- next, react, react-dom
- docx, unpdf, resend
- eslint, typescript (dev)
- @types/* (dev)

**공지 의무**:
```
✅ 저작권 표시
✅ 라이선스 전문 포함
✅ 면책 조항
```

---

### Apache License 2.0 ⭐ 중요

**적용 패키지 (2개)**:
- **@anthropic-ai/sdk** (양 프로젝트 핵심!)
- typescript (dev)

**공지 의무**:
```
✅ 저작권 표시
✅ 라이선스 전문 포함
✅ NOTICE 파일 (있다면)
✅ 변경 사항 명시
✅ 면책 조항
```

**⚠️ 특별 주의**:
- Anthropic SDK는 양 프로젝트의 핵심
- Apache 2.0은 특허권 보호 포함
- NOTICE 파일 필수

---

### ISC License

**적용 패키지 (1개)**:
- next-auth (Adam만)

---

### BSD-2-Clause License

**적용 패키지 (1개)**:
- mammoth (양 프로젝트)

---

### MIT/GPL 듀얼

**적용 패키지 (1개)**:
- jszip (Adam만, MIT 선택)

---

## 🚨 법적 리스크 분석

### 위험도 평가

| 항목 | Adam | Eve | 통합 |
|------|------|-----|------|
| **라이선스 공지** | ❌ 없음 | ❌ 없음 | 🔴 높음 |
| **NOTICE 파일** | ❌ 없음 | ❌ 없음 | 🔴 높음 |
| **저작권 표시** | ❌ 없음 | ❌ 없음 | 🔴 높음 |
| **웹 페이지** | ❌ 없음 | ❌ 없음 | 🟡 중간 |
| **GPL 의존성** | ✅ 없음 | ✅ 없음 | 🟢 낮음 |

### 잠재적 리스크

```
🔴 높음: 법적 의무 위반
   - 라이선스 조건 미준수
   - 저작권법 위반 가능성
   - 오픈소스 커뮤니티 신뢰 손상

🟡 중간: 평판 리스크
   - 투명성 부족
   - 신뢰도 저하

🟢 낮음: GPL 리스크
   - GPL 의존성 없음
   - 소스 공개 의무 없음
```

---

## ✅ 조치 계획

### Phase 1: 즉시 조치 (오늘) 🔴 긴급

#### Adam (NexHire B2C)

**1.1 NOTICE 파일 생성**
```
위치: C:\project\nexhire_b2c\NOTICE
담당: 코난
소요: 1-2시간
```

**1.2 package.json 업데이트**
```json
{
  "license": "UNLICENSED",
  "author": "ROCHE",
  "homepage": "https://jobizic.vercel.app"
}
```
```
담당: 디바
소요: 5분
```

**1.3 Git 커밋**
```bash
git add NOTICE package.json
git commit -m "docs: Add NOTICE file for OSS licenses"
```
```
담당: 디바
소요: 5분
```

---

#### Eve (Jobizic B2B)

**1.4 NOTICE 파일 생성**
```
위치: C:\project\jobizic_b2b\NOTICE
담당: 코난
소요: 1-2시간
```

**1.5 package.json 업데이트**
```json
{
  "license": "UNLICENSED",
  "author": "ROCHE"
}
```
```
담당: 디바
소요: 5분
```

**1.6 Git 커밋**
```bash
git add NOTICE package.json
git commit -m "docs: Add NOTICE file for OSS licenses"
```
```
담당: 디바
소요: 5분
```

---

### Phase 2: 단기 조치 (이번 주)

#### Adam

**2.1 /licenses 페이지 개발**
```typescript
// app/licenses/page.tsx
export default function LicensesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        오픈소스 라이선스
      </h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          사용 중인 오픈소스
        </h2>
        <div className="space-y-4">
          {/* Anthropic SDK */}
          <div className="border p-4 rounded">
            <h3 className="font-bold">Anthropic SDK</h3>
            <p className="text-sm text-gray-600">
              License: Apache 2.0
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600">
                라이선스 전문 보기
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 overflow-x-auto">
                {/* Apache 2.0 텍스트 */}
              </pre>
            </details>
          </div>
          
          {/* 각 라이브러리 반복 */}
        </div>
      </section>
    </div>
  );
}
```
```
담당: 디아
소요: 4-6시간
```

**2.2 Footer 링크 추가**
```tsx
<footer>
  <a href="/licenses">오픈소스 라이선스</a>
</footer>
```
```
담당: 디아
소요: 30분
```

---

#### Eve

**2.3 /licenses 페이지 개발**
```
Adam과 동일한 구조
담당: 디아
소요: 3-4시간 (재사용)
```

**2.4 Footer 링크 추가**
```
담당: 디아
소요: 30분
```

---

### Phase 3: 중기 조치 (다음 달)

**3.1 자동화 스크립트**
```bash
# scripts/generate-licenses.sh
#!/bin/bash

echo "Generating licenses for Adam..."
cd nexhire_b2c
npx license-checker --production --out ../NOTICE_ADAM.txt

echo "Generating licenses for Eve..."
cd ../jobizic_b2b
npx license-checker --production --out ../NOTICE_EVE.txt

echo "Done!"
```
```
담당: 코난
소요: 2-3시간
```

**3.2 CI/CD 체크**
```yaml
# .github/workflows/license-check.yml
name: License Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check licenses
        run: |
          npx license-checker --production --failOn "GPL;AGPL"
```
```
담당: 디바
소요: 1-2시간
```

---

## 📝 NOTICE 파일 템플릿

### Adam (NexHire B2C) NOTICE

```
================================================================================
NexHire B2C (Adam) - 오픈소스 라이선스 공지
================================================================================

Copyright (c) 2026 ROCHE
Website: https://jobizic.vercel.app

This product includes software developed by third parties under the
following open source licenses:

================================================================================
PRIMARY DEPENDENCIES
================================================================================

1. Anthropic SDK (@anthropic-ai/sdk)
   Version: ^0.98.0
   Copyright (c) 2024 Anthropic, Inc.
   Licensed under the Apache License, Version 2.0
   https://github.com/anthropics/anthropic-sdk-typescript
   
2. Supabase JavaScript Client (@supabase/supabase-js)
   Version: ^2.106.1
   Copyright (c) 2024 Supabase, Inc.
   Licensed under the MIT License
   https://github.com/supabase/supabase-js

3. Next.js (next)
   Version: ^16.2.6
   Copyright (c) 2024 Vercel, Inc.
   Licensed under the MIT License
   https://github.com/vercel/next.js

4. React (react, react-dom)
   Version: ^19.1.0
   Copyright (c) Meta Platforms, Inc. and affiliates.
   Licensed under the MIT License
   https://github.com/facebook/react

5. NextAuth.js (next-auth)
   Version: ^5.0.0-beta.31
   Licensed under the ISC License
   https://github.com/nextauthjs/next-auth

6. docx
   Version: ^9.7.0
   Licensed under the MIT License
   https://github.com/dolanmiu/docx

7. Mammoth
   Version: ^1.12.0
   Copyright (c) 2013 Michael Williamson
   Licensed under the BSD 2-Clause License
   https://github.com/mwilliamson/mammoth.js

8. JSZip
   Version: ^3.10.1
   Licensed under the MIT License (chosen from MIT/GPL dual license)
   https://github.com/Stuk/jszip

9. unpdf
   Version: ^1.6.2
   Licensed under the MIT License
   https://github.com/unjs/unpdf

================================================================================
DEVELOPMENT DEPENDENCIES
================================================================================

- TypeScript (Apache 2.0)
- ESLint (MIT)
- Various @types/* packages (MIT)

================================================================================
FULL LICENSE TEXTS
================================================================================

[Apache 2.0, MIT, ISC, BSD-2-Clause 전문 포함]

================================================================================
```

---

### Eve (Jobizic B2B) NOTICE

```
================================================================================
Jobizic B2B (Eve) - 오픈소스 라이선스 공지
================================================================================

Copyright (c) 2026 ROCHE

This product includes software developed by third parties under the
following open source licenses:

================================================================================
PRIMARY DEPENDENCIES
================================================================================

1. Anthropic SDK (@anthropic-ai/sdk)
   Version: ^0.100.1
   Copyright (c) 2024 Anthropic, Inc.
   Licensed under the Apache License, Version 2.0
   https://github.com/anthropics/anthropic-sdk-typescript

2. Supabase Libraries
   - @supabase/supabase-js (^2.106.2)
   - @supabase/auth-helpers-nextjs (^0.10.0)
   - @supabase/ssr (^0.10.3)
   Copyright (c) 2024 Supabase, Inc.
   Licensed under the MIT License
   https://github.com/supabase

3. Next.js (next)
   Version: 16.2.6
   Copyright (c) 2024 Vercel, Inc.
   Licensed under the MIT License
   https://github.com/vercel/next.js

4. React (react, react-dom)
   Version: 19.2.4
   Copyright (c) Meta Platforms, Inc. and affiliates.
   Licensed under the MIT License
   https://github.com/facebook/react

5. Mammoth
   Version: ^1.12.0
   Copyright (c) 2013 Michael Williamson
   Licensed under the BSD 2-Clause License
   https://github.com/mwilliamson/mammoth.js

6. unpdf
   Version: ^1.6.2
   Licensed under the MIT License
   https://github.com/unjs/unpdf

7. Resend
   Version: ^6.12.4
   Licensed under the MIT License
   https://github.com/resendlabs/resend-node

================================================================================
FULL LICENSE TEXTS
================================================================================

[Apache 2.0, MIT, BSD-2-Clause 전문 포함]

================================================================================
```

---

## 📊 일정 및 리소스

### 타임라인

```
Day 1 (오늘):
├─ NOTICE 파일 생성 (Adam) - 코난 (1-2h)
├─ NOTICE 파일 생성 (Eve) - 코난 (1-2h)
├─ package.json 수정 - 디바 (20분)
└─ Git 커밋 - 디바 (10분)

Day 2-3 (내일~모레):
├─ /licenses 페이지 (Adam) - 디아 (4-6h)
├─ /licenses 페이지 (Eve) - 디아 (3-4h)
├─ Footer 링크 - 디아 (1h)
└─ 테스트 - 테스 (2h)

Day 4-5:
├─ 배포 (Adam) - 디바 (30분)
├─ 배포 (Eve) - 디바 (30분)
└─ 최종 검증 - 테스 (1h)

Week 2-4:
└─ 자동화 및 CI/CD - 코난 + 디바 (4-6h)
```

---

### 인력 배분

| 담당자 | 작업 | 소요 시간 |
|--------|------|-----------|
| **코난** | NOTICE 파일 생성 (양쪽) | 2-4시간 |
| **디바** | package.json, Git, 배포 | 2시간 |
| **디아** | /licenses 페이지 (양쪽) | 8-10시간 |
| **테스** | 테스트 및 검증 | 3-4시간 |

**총 소요**: 15-20시간 (2-3일)

---

### 비용

```
개발: 0원 (내부 작업)
법률 자문: 0원 (필요 시 50-100만원)
자동화 도구: 0원 (NPM 패키지)

총 비용: 0원
```

---

## 🎯 미르팀 회의 결과

### 참석자 의견

**코난**: "Apache 2.0(Anthropic SDK)이 핵심이므로 NOTICE 파일 필수입니다!"

**디바**: "즉시 조치하겠습니다. 오늘 안에 NOTICE 파일 추가할 수 있습니다."

**디아**: "/licenses 페이지는 이번 주 안에 완성하겠습니다. 디자인도 깔끔하게!"

**테스**: "배포 전 철저히 검증하겠습니다. 라이선스 텍스트 정확성도 확인하겠습니다."

---

### 만장일치 결론

```
✅ 즉시 조치 필요
✅ NOTICE 파일 우선
✅ /licenses 페이지 단기 추가
✅ 자동화 체계 중기 구축

→ CTO 승인 대기 중
```

---

## ⚠️ 특별 경고

### Anthropic SDK (Apache 2.0)

```
🔴 양 프로젝트의 핵심 의존성
🔴 Apache 2.0은 특별 요구사항 있음
🔴 NOTICE 파일 필수
🔴 특허권 보호 조항 준수

→ 최우선 처리!
```

### GPL 리스크

```
✅ 현재 GPL 의존성 없음
⚠️ jszip은 MIT 선택 (GPL 아님)
⚠️ 향후 패키지 추가 시 주의

→ 지속 모니터링 필요
```

---

## 📞 문의 및 지원

### 법률 자문
- 변호사 (필요 시)
- 오픈소스 라이선스 전문가

### 기술 지원
- 코난 (오픈소스 라이선스)
- 디바 (시스템 통합)
- 디아 (UI 구현)

---

## ✅ CTO 승인 체크리스트

### 검토 항목

- [ ] 위험도 평가 동의
- [ ] 조치 우선순위 승인
- [ ] 일정 승인
- [ ] 리소스 배분 승인
- [ ] NOTICE 파일 내용 검토

### 승인 후 즉시 시작

```
코난 → NOTICE 파일 생성
디바 → package.json 수정 및 커밋
디아 → /licenses 페이지 개발 시작
테스 → 테스트 계획 수립
```

---

## 🎯 최종 권고사항

### 즉시 (오늘)

```
1. NOTICE 파일 생성 (Adam, Eve)
2. package.json 업데이트
3. Git 커밋 및 푸시

→ 법적 리스크 1차 완화
```

### 단기 (이번 주)

```
4. /licenses 페이지 추가
5. Footer 링크
6. 배포

→ 투명성 확보
```

### 중기 (다음 달)

```
7. 자동화 스크립트
8. CI/CD 체크
9. 정기 검토

→ 지속 가능한 관리 체계
```

---

<div align="center">

## 🚨 긴급 조치 요청

**법적 의무 미준수 → 즉각 조치 필요**

**미르팀 전원 대기 중!**

**CTO 승인만 있으면 즉시 시작합니다! 🛡️**

</div>

---

**작성**: 코난 (CONAN) - 보안 및 법률 담당  
**검토**: 디바, 디아, 테스  
**승인**: CTO 로체 (대기 중)  
**우선순위**: 🔴 최긴급  
**날짜**: 2026-06-10  

**미르팀, 준비 완료! 🌍**
