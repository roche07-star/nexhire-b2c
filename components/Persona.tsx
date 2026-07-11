'use client'

import { useState, useEffect } from 'react'
import type { RegularUserType } from '@/types/user'

const jobseekerPersonas = [
  {
    cls: 'before',
    stage: 'Before',
    title: '조용히 이직 준비 중인 직장인',
    items: [
      '이력서를 마지막으로 쓴 게 언제인지 기억도 안 남',
      '내 연봉이 시장 시세인지, 낮은 건지 모름',
      '어떤 직무/회사로 가야 할지 방향이 불분명',
      '서류를 냈는데 왜 탈락하는지 이유를 모름',
    ],
  },
  {
    cls: 'during',
    stage: 'Jobizic 사용',
    title: 'JOBIZIC 헤드헌터가 분석 중',
    items: [
      '이력서 업로드 → 3분 내 분석 완료 (개인정보 자동 마스킹)',
      '직무 적합도/시장 경쟁력/성장 가능성 점수 + 커리어 경로 3가지',
      'JD 적합도 분석 → 지원 여부 판정 + 매칭 강점/부족한 점/어필 전략 도출',
      'JD 맞춤 이력서 자동 재작성 + 자기소개서 최적화',
      '이 회사/이 포지션 맞춤 면접 질문/모범 답변 생성',
    ],
  },
  {
    cls: 'after',
    stage: 'After',
    title: '전략을 갖춘 이직 준비자',
    items: [
      '내 시장 가치와 목표 연봉 밴드가 명확해짐',
      '지원할 회사/직무/타이밍 전략이 생김',
      '공고마다 최적화된 이력서와 자소서로 서류 통과율 향상',
      '면접 전 실전 대비로 최종 합격까지 체계적으로 준비',
    ],
  },
]

const headhunterPersonas = [
  {
    cls: 'before',
    stage: 'Before',
    title: '후보자 분석에 시간 쓰는 헤드헌터',
    items: [
      '후보자 이력서를 일일이 읽고 정리하는 데 시간 소요',
      '클라이언트 JD와 후보자 매칭 판단이 주관적',
      '제안서 작성에 매번 1-2시간씩 투입',
      '후보자별 진행 상황 추적이 어렵고 일정 관리 혼란',
      '정산 관리를 엑셀로 수동으로 처리',
    ],
  },
  {
    cls: 'during',
    stage: 'Jobizic 사용',
    title: 'JOBIZIC AI가 분석 중',
    items: [
      '후보자 이력서 업로드 → 3분 내 강점/약점/연봉 밴드 자동 분석',
      '클라이언트 JD 입력 → 적합도 점수 + 매칭 포인트 + 리스크 자동 도출',
      '클라이언트 제안서 자동 생성 → HTML/PDF 다운로드',
      'JD 맞춤 후보자 이력서 최적화 + 예상 면접 질문 생성',
      '파이프라인 현황, 면접 일정, 클라이언트 피드백 통합 관리',
      '합격자 정산 자동 계산 + 연도별 목표 달성률 추적',
    ],
  },
  {
    cls: 'after',
    stage: 'After',
    title: '효율적으로 후보자 관리하는 헤드헌터',
    items: [
      '후보자 분석 시간 1/10 단축, 소싱에 집중',
      '객관적 데이터 기반 매칭으로 클라이언트 신뢰 확보',
      '제안서 자동 생성으로 빠른 후보자 제안',
      '채용 프로세스 전체를 대시보드에서 실시간 추적',
      '정산 자동화로 행정 업무 부담 감소',
    ],
  },
]

export default function Persona({ userType }: { userType?: RegularUserType | null }) {
  const [selectedType, setSelectedType] = useState<'JOBSEEKER' | 'HEADHUNTER'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('landing_user_type')
      return (saved === 'HEADHUNTER' || saved === 'JOBSEEKER') ? saved : 'JOBSEEKER'
    }
    return 'JOBSEEKER'
  })

  // 로그인 사용자는 본인 타입, 비로그인은 선택한 타입
  const effectiveType = userType || selectedType
  const personas = effectiveType === 'HEADHUNTER' ? headhunterPersonas : jobseekerPersonas
  return (
    <div className="persona-section">
      <div style={{ maxWidth: 1100, margin: '0 auto' }} className="reveal">
        <div className="section-label">Before → After</div>
        <div className="section-title">Jobizic을 쓰기 전과 후</div>
      </div>
      <div className="persona-wrap reveal">
        {personas.map((p) => (
          <div key={p.cls} className={`persona-card ${p.cls}`}>
            <div className="persona-stage">{p.stage}</div>
            <h3>{p.title}</h3>
            <ul>{p.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  )
}
