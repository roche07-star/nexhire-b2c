# 테스트 픽스처 (Test Fixtures)

## 📄 테스트용 샘플 이력서

이 폴더에는 자동화 테스트를 위한 샘플 이력서 파일들이 저장됩니다.

### 필요한 파일들

**1. resume-full.pdf**
- 경력/학력/연봉 모두 포함
- 테스트 케이스: 정상 케이스

**샘플 내용:**
```
김개발 (Kim Developer)

[경력]
- 네이버 (2018.03 ~ 현재, 8년)
  백엔드 개발자
  - Java, Spring Boot, MySQL
  - 월 500만 MAU 서비스 개발

- 카카오 (2016.01 ~ 2018.02, 2년 2개월)
  주니어 개발자
  - Python, Django

총 경력: 10년 2개월

[학력]
- 서울대학교 컴퓨터공학과 학사 졸업 (2012~2016)

[현재 연봉]
연 8,500만원
```

---

**2. resume-career-only.pdf**
- 경력만 있음, 학력/연봉 없음
- 테스트 케이스: 부분 정보

**샘플 내용:**
```
박경력 (Park Career)

[경력]
- 토스 (2020.01 ~ 현재, 6년)
  프론트엔드 개발자
  - React, TypeScript, Next.js

총 경력: 6년
```

---

**3. resume-entry.pdf**
- 신입, 경력/학력/연봉 없음
- 테스트 케이스: 정보 없음

**샘플 내용:**
```
최신입 (Choi Entry)

[지원 분야]
백엔드 개발자

[기술 스택]
- Python, FastAPI
- PostgreSQL, Redis

[프로젝트]
- 개인 블로그 서비스 개발 (2025.12 ~ 2026.01)
```

---

## 🔨 픽스처 생성 방법

### 방법 1: 실제 PDF 파일 생성 (권장)
```
1. Google Docs 또는 Word로 위 내용 작성
2. PDF로 저장
3. tests/fixtures/ 폴더에 복사
```

### 방법 2: 텍스트 파일로 테스트 (임시)
```bash
# 텍스트 파일로 테스트 (PDF 없을 때)
echo "김개발\n경력: 네이버 8년..." > tests/fixtures/resume-full.txt
```

---

## ✅ 픽스처 검증

**확인 사항:**
- [ ] resume-full.pdf 존재
- [ ] resume-career-only.pdf 존재
- [ ] resume-entry.pdf 존재
- [ ] 각 파일 크기 > 0KB
- [ ] PDF 파일이 정상적으로 열림

**테스트 실행 전 필수!**
```bash
ls -lh tests/fixtures/
```

---

## 🚨 주의사항

**개인정보 보호:**
- 실제 개인정보 사용 금지!
- 테스트용 가짜 데이터만 사용
- Git에 커밋하지 말 것 (gitignore 추가)

**.gitignore 추가:**
```gitignore
tests/fixtures/*.pdf
tests/fixtures/*.docx
tests/fixtures/*.txt
!tests/fixtures/README.md
```

---

## 📝 현재 상태

**생성 필요:**
- ⬜ resume-full.pdf
- ⬜ resume-career-only.pdf
- ⬜ resume-entry.pdf

**다음 단계:**
1. 픽스처 파일 생성
2. 테스트 실행: `npm run test:e2e`
3. 결과 확인
