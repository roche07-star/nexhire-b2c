# 오픈소스 라이센스 공지 의무 검토 보고서

**프로젝트**: NexHire B2C (jobizic.vercel.app)  
**작성자**: 코난 (CONAN)  
**협조**: 디바, 디아, 테스 (미르팀)  
**날짜**: 2026-06-10  
**상태**: 🔴 긴급 - 법적 의무사항  

---

## 🎯 검토 목적

오픈소스 라이센스 공지 의무 준수:
- 법적 리스크 회피
- 저작권 존중
- 라이선스 위반 방지
- 서비스 신뢰성 확보

---

## 📊 사용 중인 오픈소스 현황

### 주요 의존성 (Dependencies)

| 패키지 | 버전 | 라이선스 | 공지 의무 |
|--------|------|----------|-----------|
| **@anthropic-ai/sdk** | ^0.98.0 | Apache 2.0 | ✅ 필수 |
| **@supabase/supabase-js** | ^2.106.1 | MIT | ✅ 필수 |
| **next** | ^16.2.6 | MIT | ✅ 필수 |
| **react** | ^19.1.0 | MIT | ✅ 필수 |
| **react-dom** | ^19.1.0 | MIT | ✅ 필수 |
| **next-auth** | ^5.0.0-beta.31 | ISC | ✅ 필수 |
| **docx** | ^9.7.0 | MIT | ✅ 필수 |
| **mammoth** | ^1.12.0 | BSD-2-Clause | ✅ 필수 |
| **jszip** | ^3.10.1 | MIT/GPL | ✅ 필수 |
| **unpdf** | ^1.6.2 | MIT | ✅ 필수 |

### 개발 의존성 (DevDependencies)

| 패키지 | 버전 | 라이선스 | 공지 의무 |
|--------|------|----------|-----------|
| **typescript** | ^5 | Apache 2.0 | ⚠️ 권장 |
| **eslint** | ^9 | MIT | ⚠️ 권장 |
| **@types/*** | 각종 | MIT | ⚠️ 권장 |

**총 의존성**: 22개 (직접 의존성 11개)

---

## 📜 라이선스 종류별 분석

### 1. MIT License (가장 많음)

**특징**:
- ✅ 매우 관대한 라이선스
- ✅ 상업적 사용 가능
- ✅ 수정 및 재배포 가능
- ⚠️ 저작권 표시 및 라이선스 텍스트 포함 필수

**적용 패키지**:
- @supabase/supabase-js
- next
- react, react-dom
- docx
- jszip (MIT/GPL 듀얼)
- unpdf
- eslint
- 기타 @types/* 패키지

**공지 의무**:
```
✅ 저작권 표시
✅ 라이선스 전문 포함
✅ 면책 조항 포함
```

---

### 2. Apache License 2.0

**특징**:
- ✅ 상업적 사용 가능
- ✅ 특허권 보호 포함
- ⚠️ 저작권 표시 필수
- ⚠️ NOTICE 파일 포함 필수
- ⚠️ 변경 사항 명시 필수

**적용 패키지**:
- @anthropic-ai/sdk ⭐ (핵심 의존성!)
- typescript

**공지 의무**:
```
✅ 저작권 표시
✅ 라이선스 전문 포함
✅ NOTICE 파일 포함 (있는 경우)
✅ 변경 사항 명시
✅ 면책 조항
```

**⚠️ 중요**: Anthropic SDK는 Apache 2.0이므로 특별히 주의!

---

### 3. ISC License

**특징**:
- ✅ MIT와 유사하게 관대함
- ✅ 상업적 사용 가능
- ⚠️ 저작권 표시 필수

**적용 패키지**:
- next-auth

**공지 의무**:
```
✅ 저작권 표시
✅ 라이선스 텍스트 포함
```

---

### 4. BSD-2-Clause License

**특징**:
- ✅ 관대한 라이선스
- ✅ 상업적 사용 가능
- ⚠️ 저작권 표시 필수
- ⚠️ 재배포 시 라이선스 포함

**적용 패키지**:
- mammoth

**공지 의무**:
```
✅ 저작권 표시
✅ 라이선스 전문 포함
✅ 면책 조항
```

---

### 5. MIT/GPL 듀얼 라이선스

**특징**:
- ✅ MIT 또는 GPL 중 선택 가능
- ✅ MIT 선택 시 관대함
- ⚠️ GPL 선택 시 소스 공개 의무 (우리는 MIT 선택)

**적용 패키지**:
- jszip

**선택**: MIT 라이선스 적용 (GPL 아님!)

---

## 🚨 법적 의무 사항

### 필수 공지 항목

1. **저작권 표시** (Copyright Notice)
   ```
   모든 오픈소스 라이브러리의 저작권 명시
   ```

2. **라이선스 전문** (License Text)
   ```
   각 라이선스의 전체 텍스트 포함
   ```

3. **면책 조항** (Disclaimer)
   ```
   "AS IS" 조항 및 보증 부인 명시
   ```

4. **변경 사항 명시** (Apache 2.0의 경우)
   ```
   수정한 파일이 있다면 명시
   (우리는 직접 수정 안 함 → 해당 없음)
   ```

---

## 📋 공지 방법

### 방법 1: NOTICE 파일 생성 ⭐ 추천

**파일 위치**: 프로젝트 루트
```
C:\project\nexhire_b2c\NOTICE
```

**내용**:
```
NexHire B2C
Copyright (c) 2026 ROCHE

This product includes software developed by third parties under the
following licenses:

================================================================================
Anthropic SDK
Copyright (c) 2024 Anthropic, Inc.
Licensed under the Apache License 2.0
https://github.com/anthropics/anthropic-sdk-typescript

================================================================================
Next.js
Copyright (c) 2024 Vercel, Inc.
Licensed under the MIT License
https://github.com/vercel/next.js

... (모든 의존성)
```

---

### 방법 2: 웹사이트 "About" 페이지

**페이지**: `/about` 또는 `/licenses`

**내용**:
- 사용 중인 오픈소스 목록
- 각 라이선스 링크
- 전문 텍스트 (접을 수 있게)

**예시**:
```typescript
// app/licenses/page.tsx
export default function LicensesPage() {
  return (
    <div>
      <h1>오픈소스 라이선스</h1>
      <section>
        <h2>Anthropic SDK</h2>
        <p>License: Apache 2.0</p>
        <details>
          <summary>라이선스 전문 보기</summary>
          <pre>{/* Apache 2.0 전문 */}</pre>
        </details>
      </section>
      {/* ... 각 라이선스 */}
    </div>
  );
}
```

---

### 방법 3: package.json에 license 필드 추가

**현재**:
```json
{
  "name": "jobizic_next",
  "version": "0.1.0",
  "private": true,
  ...
}
```

**권장**:
```json
{
  "name": "jobizic_next",
  "version": "0.1.0",
  "private": true,
  "license": "UNLICENSED",  // 또는 "Proprietary"
  "author": "ROCHE",
  ...
}
```

---

### 방법 4: 자동화 도구 사용

#### license-checker (NPM 패키지)

```bash
# 설치
npm install -g license-checker

# 실행
license-checker --json > licenses.json

# NOTICE 파일 생성
license-checker --production --out NOTICE
```

#### nlf (Node License Finder)

```bash
npm install -g nlf

nlf --summary detail > NOTICE
```

---

## ✅ 권장 조치 사항

### 즉시 조치 (오늘)

1. **NOTICE 파일 생성**
   ```
   위치: C:\project\nexhire_b2c\NOTICE
   내용: 모든 의존성의 저작권 및 라이선스
   ```

2. **package.json 업데이트**
   ```json
   "license": "UNLICENSED",
   "author": "ROCHE"
   ```

3. **Git에 NOTICE 추가**
   ```bash
   git add NOTICE
   git commit -m "docs: Add NOTICE file for OSS licenses"
   ```

---

### 단기 조치 (이번 주)

4. **웹사이트에 라이선스 페이지 추가**
   ```
   URL: https://jobizic.vercel.app/licenses
   내용: 사용 중인 오픈소스 목록 및 라이선스
   ```

5. **Footer에 링크 추가**
   ```tsx
   <footer>
     <a href="/licenses">오픈소스 라이선스</a>
   </footer>
   ```

---

### 중기 조치 (다음 달)

6. **자동화 스크립트 작성**
   ```bash
   # scripts/generate-licenses.sh
   #!/bin/bash
   npx license-checker --production --out NOTICE
   ```

7. **CI/CD에 라이선스 체크 추가**
   ```yaml
   # .github/workflows/license-check.yml
   - name: Check licenses
     run: npx license-checker --production --failOn "GPL"
   ```

---

## 🚨 리스크 분석

### 현재 상태: 🔴 위험

```
❌ NOTICE 파일 없음
❌ 라이선스 페이지 없음
❌ 저작권 표시 없음
❌ 법적 의무 미준수

→ 잠재적 법적 리스크!
```

### 조치 후: 🟢 안전

```
✅ NOTICE 파일 생성
✅ 라이선스 페이지 추가
✅ 저작권 명시
✅ 법적 의무 준수

→ 법적 리스크 최소화
```

---

## 💡 특별 주의 사항

### Anthropic SDK (Apache 2.0)

**왜 중요한가?**
- 핵심 의존성 (Claude API 사용)
- Apache 2.0은 NOTICE 파일 요구
- 특허권 보호 조항 포함

**조치**:
```
✅ NOTICE 파일에 Anthropic 저작권 명시
✅ Apache 2.0 라이선스 전문 포함
✅ 변경 사항 없음 명시 (우리는 수정 안 함)
```

---

### GPL 라이선스 주의

**현재 상태**:
- ✅ GPL 의존성 없음 (jszip은 MIT 선택)
- ✅ 소스 공개 의무 없음

**미래 주의**:
```
⚠️ 새로운 패키지 추가 시 라이선스 확인
⚠️ GPL 패키지는 가급적 피하기
⚠️ LGPL은 조건부 허용 (동적 링크)
```

---

## 📝 NOTICE 파일 템플릿

```
================================================================================
NexHire B2C - 오픈소스 라이선스 공지
================================================================================

Copyright (c) 2026 ROCHE
All rights reserved.

This product includes software developed by third parties under the
following open source licenses:

================================================================================
1. Anthropic SDK
   Copyright (c) 2024 Anthropic, Inc.
   Licensed under the Apache License, Version 2.0
   https://github.com/anthropics/anthropic-sdk-typescript

2. Supabase JavaScript Client
   Copyright (c) 2024 Supabase, Inc.
   Licensed under the MIT License
   https://github.com/supabase/supabase-js

3. Next.js
   Copyright (c) 2024 Vercel, Inc.
   Licensed under the MIT License
   https://github.com/vercel/next.js

4. React
   Copyright (c) Meta Platforms, Inc. and affiliates.
   Licensed under the MIT License
   https://github.com/facebook/react

5. NextAuth.js
   Licensed under the ISC License
   https://github.com/nextauthjs/next-auth

6. docx
   Licensed under the MIT License
   https://github.com/dolanmiu/docx

7. Mammoth
   Copyright (c) 2013, Michael Williamson
   Licensed under the BSD 2-Clause License
   https://github.com/mwilliamson/mammoth.js

8. JSZip
   Licensed under the MIT License
   https://github.com/Stuk/jszip

9. unpdf
   Licensed under the MIT License
   https://github.com/unjs/unpdf

================================================================================
FULL LICENSE TEXTS
================================================================================

Apache License 2.0
------------------
[Apache 2.0 전문 텍스트 포함]

MIT License
-----------
[MIT 전문 텍스트 포함]

ISC License
-----------
[ISC 전문 텍스트 포함]

BSD 2-Clause License
--------------------
[BSD 2-Clause 전문 텍스트 포함]

================================================================================
End of NOTICE
================================================================================
```

---

## 🎯 코난의 권고사항

### 우선순위 1: 즉시 (오늘)

```
1. NOTICE 파일 생성 및 Git 추가
2. package.json에 license 필드 추가
3. CTO 승인
```

### 우선순위 2: 단기 (이번 주)

```
4. /licenses 페이지 개발 (디아)
5. Footer 링크 추가 (디아)
6. 배포 (디바)
```

### 우선순위 3: 중기 (다음 달)

```
7. 자동화 스크립트
8. CI/CD 체크
9. 정기 검토 프로세스
```

---

## 📞 문의

### 법률 관련
- 변호사 자문 (필요 시)
- 오픈소스 라이선스 전문가

### 기술 관련
- 코난 (보안/법률 담당)
- 디바 (시스템 총괄)

---

## ✅ 체크리스트

### CTO 승인 필요

- [ ] NOTICE 파일 내용 검토
- [ ] 라이선스 페이지 디자인 승인
- [ ] 조치 우선순위 승인

### 개발 팀 작업

- [ ] NOTICE 파일 생성 (코난)
- [ ] package.json 업데이트 (디바)
- [ ] /licenses 페이지 개발 (디아)
- [ ] 테스트 (테스)
- [ ] 배포 (디바)

---

## 📊 예상 소요 시간

```
NOTICE 파일 생성:     1-2시간 (코난)
package.json 수정:    10분 (디바)
/licenses 페이지:     4-6시간 (디아)
테스트:              1-2시간 (테스)
배포:                30분 (디바)

총 소요: 1일
```

---

## 💰 비용

```
개발: 0원 (내부 작업)
법률 자문: 0원 (필요 시 50-100만원)
자동화 도구: 0원 (오픈소스)

총 비용: 0원
```

---

## 🎯 결론

### 현재 상태
```
🔴 오픈소스 라이선스 공지 의무 미준수
   → 법적 리스크 존재
```

### 권고 조치
```
✅ 즉시 NOTICE 파일 생성
✅ 라이선스 페이지 추가
✅ 지속적 관리 체계 구축
```

### 기대 효과
```
✅ 법적 리스크 제거
✅ 오픈소스 커뮤니티 존중
✅ 서비스 신뢰도 향상
✅ 투명성 확보
```

---

**작성**: 코난 (CONAN)  
**검토**: 디바, 디아, 테스  
**승인**: CTO 로체 (대기 중)  
**날짜**: 2026-06-10  
**우선순위**: 🔴 긴급  

---

## 🚀 다음 단계

**CTO님의 승인 후**:
1. 코난이 NOTICE 파일 생성
2. 디아가 /licenses 페이지 개발
3. 테스가 검증
4. 디바가 배포

**미르팀, 준비 완료! 🛡️**
