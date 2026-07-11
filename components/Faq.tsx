'use client'

import { useState, useEffect } from 'react'
import type { RegularUserType } from '@/types/user'

const individualFaqs = [
  {
    q: '어떤 형식의 이력서를 지원하나요?',
    a: 'PDF 및 DOCX 형식을 지원합니다. 한글 이력서도 자연스럽게 분석됩니다. 파일 크기는 최대 10MB까지 가능합니다.',
  },
  {
    q: 'JD 적합도 분석은 어떻게 사용하나요?',
    a: '이력서 분석을 먼저 완료한 후, JD 적합도 분석 탭에서 지원할 회사명과 채용공고 내용을 입력하면 됩니다. 회사 정보를 웹에서 실시간으로 검색한 뒤, 내 이력서 분석 결과를 기반으로 매칭 강점/부족한 점/어필 전략을 즉시 도출합니다.',
  },
  {
    q: '이력서 자동 생성은 어떻게 작동하나요?',
    a: 'JD 적합도 분석 후, 이력서 생성 탭에서 분석 결과와 원본 이력서를 선택하면 JD 맞춤 이력서가 자동으로 재작성됩니다. 매칭 강점은 부각하고 부족한 점은 보완하며, 자기소개서도 함께 최적화됩니다. 다운로드 후 항목별 변경사항을 바로 확인할 수 있습니다. PRO는 월 10회, EXPERT는 월 30회 이용 가능합니다.',
  },
  {
    q: '면접 가이드는 무엇을 제공하나요?',
    a: 'JD와 내 이력서를 분석해 예상 면접 질문 10개와 이력서 기반 모범 답변을 생성합니다. 면접관에게 역으로 물어볼 역질문도 3가지(역할/도전/기대 유형) 제공합니다. PRO 플랜에서 월 5회, EXPERT 플랜에서 월 15회 이용 가능하며, 결과는 10일간 저장됩니다.',
  },
  {
    q: '분석 결과는 저장되나요?',
    a: 'PRO / EXPERT 플랜은 이력서 분석 결과와 JD 적합도 분석 결과 모두 영구적으로 저장됩니다. 재접속 시 언제든 다시 확인할 수 있으며, HTML 리포트 다운로드도 가능합니다. 면접 가이드는 10일간 저장됩니다.',
  },
  {
    q: '내 이력서 데이터는 안전한가요?',
    a: '성명, 연락처, 이메일 등 식별 정보는 JOBIZIC 분석/이력서 생성 전 자동으로 마스킹 처리되어 외부로 전송되지 않습니다. 직무/경력 내용만 분석에 활용됩니다.',
  },
  {
    q: '현재 회사에 이직 준비 사실이 노출될 위험은 없나요?',
    a: '없습니다. Jobizic은 로그인 후 본인만 접근할 수 있는 개인 분석 공간입니다. 이력서 내 성명/연락처/이메일은 JOBIZIC 분석 전 자동 마스킹 처리되어 외부로 전송되지 않으며, 분석 결과는 타인과 공유되지 않습니다. 회사 모르게 조용히 준비하셔도 됩니다.',
  },
]

const headhunterFaqs = [
  {
    q: '후보자 이력서는 어떤 형식을 지원하나요?',
    a: 'PDF 및 DOCX 형식을 지원합니다. 한글 이력서도 자연스럽게 분석됩니다. 파일 크기는 최대 10MB까지 가능합니다.',
  },
  {
    q: '클라이언트 제안서는 무엇을 제공하나요?',
    a: '후보자 강점 분석, JD 적합도 점수, 매칭 포인트, 예상 질문/답변을 포함한 종합 제안서를 자동으로 생성합니다. PRO는 월 20회, EXPERT는 월 50회 이용 가능합니다.',
  },
  {
    q: '정산 기능은 어떻게 사용하나요?',
    a: '헤드헌터 PRO/EXPERT 플랜에서 이용 가능합니다. 합격자 정보, 입사일, 연봉, 수수료율을 입력하면 자동으로 정산 금액이 계산됩니다. 연도별 통계와 목표 달성률도 확인할 수 있습니다.',
  },
  {
    q: '후보자 데이터는 안전한가요?',
    a: '성명, 연락처, 이메일 등 식별 정보는 JOBIZIC 분석 전 자동으로 마스킹 처리되어 외부로 전송되지 않습니다. 직무/경력 내용만 분석에 활용되며, 모든 데이터는 암호화되어 저장됩니다.',
  },
  {
    q: '분석 결과는 저장되나요?',
    a: 'PRO / EXPERT 플랜은 후보자 분석 결과와 JD 적합도 분석 결과 모두 영구적으로 저장됩니다. 재접속 시 언제든 다시 확인할 수 있으며, HTML/PDF 리포트 다운로드도 가능합니다.',
  },
  {
    q: '여러 명의 후보자를 동시에 분석할 수 있나요?',
    a: '네, 가능합니다. 후보자별로 개별 분석을 진행하며, 후보자 관리 대시보드에서 전체 후보자 목록과 분석 결과를 한눈에 확인할 수 있습니다.',
  },
]

export default function Faq({ userType }: { userType?: RegularUserType | null }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<'JOBSEEKER' | 'HEADHUNTER'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('landing_user_type')
      return (saved === 'HEADHUNTER' || saved === 'JOBSEEKER') ? saved : 'JOBSEEKER'
    }
    return 'JOBSEEKER'
  })

  // 로그인 사용자는 본인 타입, 비로그인은 선택한 타입
  const effectiveType = userType || selectedType
  const faqs = effectiveType === 'HEADHUNTER' ? headhunterFaqs : individualFaqs

  return (
    <section id="faq" style={{ maxWidth: 720 }}>
      <div className="reveal">
        <div className="section-label">FAQ</div>
        <div className="section-title">자주 묻는 질문</div>
      </div>
      <div className="faq-list reveal">
        {faqs.map((item, i) => (
          <div key={i} className={`faq-item${openIdx === i ? ' open' : ''}`}>
            <div className="faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              {item.q}
              <span className="faq-arrow">+</span>
            </div>
            <div className="faq-a">{item.a}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
