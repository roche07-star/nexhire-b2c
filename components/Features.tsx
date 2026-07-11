'use client'

import { useState, useEffect } from 'react'
import type { RegularUserType } from '@/types/user'

const jobseekerFeatures = [
  {
    icon: '🔍',
    title: '이력서 심층 분석',
    desc: '직무 적합도/시장 경쟁력/성장 가능성을 점수화하고 강점/개선점/핵심 키워드를 한눈에 정리합니다. PRO 이상은 BASELINE / RECOMMENDED / STRETCH 3가지 커리어 경로와 연봉 밴드까지 제시합니다.',
    tags: ['Match Score', '강점 도출', '커리어 경로 3가지', '연봉 밴드'],
    wide: false,
    soon: false,
  },
  {
    icon: '📋',
    title: 'JD 적합도 분석',
    desc: '지원할 채용공고를 붙여넣으면 내 이력서 분석 결과 기반으로 매칭 강점, 부족한 점, 어필 전략을 즉시 도출합니다. 웹 검색으로 수집한 회사 실제 정보까지 반영한 헤드헌터 시각의 냉정한 실전 피드백을 제공합니다.',
    tags: ['적합도 점수', '매칭 강점', '부족한 점', '어필 전략'],
    wide: false,
    soon: false,
  },
  {
    icon: '✏️',
    title: '이력서 자동 생성',
    desc: 'JD 적합도 분석 결과를 반영해 이력서를 자동으로 재작성합니다. 매칭 강점은 부각하고 부족한 점은 전략적으로 보완합니다. 자기소개서도 함께 최적화되며, 변경된 내용을 항목별로 확인할 수 있습니다.',
    tags: ['JD 연동 수정', '자기소개서 포함', '변경사항 확인', 'PII 보호'],
    wide: true,
    soon: false,
  },
  {
    icon: '📝',
    title: '업무 Report 관리',
    desc: '주간/월간 업무 성과를 정리하고 이력서에 자동 반영합니다. 프로젝트별 성과 지표, 핵심 기여 내용을 누적 관리하여 이직 준비 시 최신 이력서를 즉시 생성할 수 있습니다.',
    tags: ['주간/월간 Report', '성과 자동 누적', '이력서 반영', '실시간 업데이트'],
    wide: true,
    soon: false,
  },
  {
    icon: '🎤',
    title: '면접 가이드',
    desc: '합격을 목표로 하는 JD 기준으로 실전 면접 가이드를 생성합니다. 내 이력서를 바탕으로 예상 질문 10개와 모범 답변, 면접관을 역으로 탐색할 역질문 3가지를 한번에 제공합니다.',
    tags: ['예상 질문 10개', '이력서 기반 답변', '역질문 3가지', 'Expert 전용'],
    wide: false,
    soon: false,
  },
]

const headhunterFeatures = [
  {
    icon: '🔍',
    title: '후보자 심층 분석',
    desc: '후보자의 기술 역량, 시장 가치, 클라이언트 적합도를 점수화합니다. 강점/약점/추천 포지션과 예상 연봉 밴드를 한눈에 파악하여 빠른 스크리닝이 가능합니다.',
    tags: ['Candidate Score', '강점/약점 분석', '추천 포지션', '연봉 밴드'],
    wide: false,
    soon: false,
  },
  {
    icon: '📋',
    title: 'JD 매칭 분석',
    desc: '클라이언트 JD와 후보자 이력서를 비교하여 적합도를 자동 분석합니다. 매칭 강점, 리스크, 클라이언트 어필 포인트를 즉시 도출하여 제안 전략을 수립할 수 있습니다.',
    tags: ['적합도 점수', '매칭 강점', '리스크 분석', '어필 전략'],
    wide: false,
    soon: false,
  },
  {
    icon: '📝',
    title: '클라이언트 제안 Report',
    desc: '후보자 분석 결과와 JD 매칭 정보를 기반으로 클라이언트 제안서를 자동 생성합니다. 후보자 강점, 적합도 근거, 예상 면접 질문까지 포함된 전문 리포트를 HTML/PDF로 다운로드할 수 있습니다.',
    tags: ['제안서 자동 생성', 'HTML/PDF 다운로드', '후보자 강점', '면접 가이드'],
    wide: true,
    soon: false,
  },
  {
    icon: '⚙️',
    title: '채용 프로세스 관리',
    desc: '후보자별 진행 상황, 클라이언트 피드백, 면접 일정을 한 곳에서 추적합니다. 파이프라인 현황과 정산 자동화까지 통합 관리하여 업무 효율을 극대화합니다.',
    tags: ['파이프라인 추적', '일정 관리', '정산 자동화', '대시보드'],
    wide: true,
    soon: false,
  },
]

export default function Features({ userType }: { userType?: RegularUserType | null }) {
  const [selectedType, setSelectedType] = useState<'JOBSEEKER' | 'HEADHUNTER'>('JOBSEEKER')

  // localStorage에서 선택한 타입 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('landing_user_type')
      if (saved === 'HEADHUNTER' || saved === 'JOBSEEKER') {
        setSelectedType(saved)
      }
    }
  }, [])

  // 로그인 사용자는 본인 타입, 비로그인은 선택한 타입
  const effectiveType = userType || selectedType
  const features = effectiveType === 'HEADHUNTER' ? headhunterFeatures : jobseekerFeatures

  const content = {
    JOBSEEKER: {
      title: '단순 분석이 아닌\n실행 가능한 인사이트',
      sub: '헤드헌터의 시각으로 이력서를 읽고, AI의 속도로 전략을 제시합니다.',
    },
    HEADHUNTER: {
      title: '후보자 분석부터\n클라이언트 제안까지 자동화',
      sub: '시간은 후보자 소싱과 관계 구축에 집중하세요. 분석은 AI가 대신합니다.',
    },
  }

  const selected = content[effectiveType]

  return (
    <section id="features">
      <div className="reveal">
        <div className="section-label">Features</div>
        <div className="section-title">{selected.title}</div>
        <p className="section-sub">{selected.sub}</p>
      </div>
      <div className="features-grid reveal">
        {features.map((f) => (
          <div key={f.title} className={`feature-card${f.wide ? ' wide' : ''}`}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="feature-tags">
              {f.tags.map((tag) => <span key={tag} className="ftag">{tag}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
