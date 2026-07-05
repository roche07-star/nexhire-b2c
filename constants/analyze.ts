// 이력서 분석 관련 상수

export const FEATURE_LABEL: Record<string, string> = {
  resume: '이력서 분석',
  direction: '방향성 분석',
  jd: 'JD 분석',
  rewrite: '이력서 생성',
}

export const CAREER_COLORS: Record<string, string> = {
  BASELINE: 'var(--muted2)',
  RECOMMENDED: '#e8a020',
  STRETCH: 'var(--accent)',
}

export const CAREER_COLORS_HEX: Record<string, string> = {
  BASELINE: '#888880',
  RECOMMENDED: '#e8a020',
  STRETCH: '#e8ff47',
}

export const REC_LABEL_CONST: Record<string, string> = {
  APPLY: '지원 강력 추천',
  CONSIDER: '조건부 추천',
  SKIP: '부적합',
}

export const REC_COLOR_HEX: Record<string, string> = {
  APPLY: '#4caf86',
  CONSIDER: '#e8a020',
  SKIP: '#ff6b6b',
}

export const LOADING_STEPS = [
  '이력서를 읽는 중...',
  '강점과 개선점을 분석하는 중...',
  '커리어 경로를 설계하는 중...',
  '마무리 검토 중...',
]

export const JD_LOADING_STEPS = [
  '채용공고를 파악하는 중...',
  '회사 정보를 검색하는 중...',
  '후보자 이력과 비교하는 중...',
  '적합도 리포트를 작성하는 중...',
]

export const REWRITE_LOADING_STEPS = [
  '원본 이력서를 분석하는 중...',
  'JD 기반 전략을 수립하는 중...',
  '내용을 보완하고 있습니다...',
  '서식을 정리하는 중...',
  'DOCX 파일을 생성하는 중...',
]

export const INTERVIEW_LOADING_STEPS = [
  '면접 가이드 생성을 준비하는 중...',
  '회사 정보를 확인하는 중...',
  '포지션 브리핑을 작성하는 중...',
  '예상 질문을 생성하는 중...',
  '답변 전략을 수립하는 중...',
  '역질문을 준비하는 중...',
  '최종 검토 중...',
]
