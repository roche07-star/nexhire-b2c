'use client'

import { useState } from 'react'

const faqs = [
  {
    q: '어떤 형식의 이력서를 지원하나요?',
    a: 'PDF 및 DOCX 형식을 지원합니다. 한글 이력서도 자연스럽게 분석됩니다. 파일 크기는 최대 10MB까지 가능합니다.',
  },
  {
    q: 'JD 적합도 분석은 어떻게 사용하나요?',
    a: '이력서 분석을 먼저 완료한 후, JD 적합도 분석 탭에서 지원할 회사명과 채용공고 내용을 입력하면 됩니다. 내 이력서 분석 결과를 기반으로 매칭 강점, 부족한 점, 어필 전략을 즉시 도출합니다.',
  },
  {
    q: '분석 결과는 저장되나요?',
    a: 'PRO / EXPERT 플랜은 이력서 분석 결과와 JD 적합도 분석 결과 모두 영구적으로 저장됩니다. 재접속 시 언제든 다시 확인할 수 있으며, HTML 리포트 다운로드도 가능합니다.',
  },
  {
    q: '내 이력서 데이터는 안전한가요?',
    a: '성명, 연락처, 이메일 등 식별 정보는 AI 분석 전 자동으로 마스킹 처리되어 외부로 전송되지 않습니다. 직무·경력 내용만 분석에 활용됩니다.',
  },
  {
    q: '이직 경험이 없는 신입도 사용할 수 있나요?',
    a: '물론입니다. 신입부터 경력 15년 이상까지 다양한 단계에 맞춰 분석이 제공됩니다. 인턴·대외활동 경험만 있어도 분석이 가능합니다.',
  },
]

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

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
