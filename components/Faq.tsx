'use client'

import { useState } from 'react'

const faqs = [
  { q: '어떤 형식의 이력서를 지원하나요?', a: 'PDF, DOCX, HWP(한글) 형식을 모두 지원합니다. 한글 이력서도 자연스럽게 분석됩니다.' },
  { q: '분석 결과는 얼마나 정확한가요?', a: '실제 헤드헌터의 평가 기준과 수만 건의 이력서 데이터를 학습하여, 94%의 방향성 만족도를 기록하고 있습니다. 다만 최종 결정은 본인의 판단과 함께 활용하시길 권장합니다.' },
  { q: '내 이력서 데이터는 안전한가요?', a: '성명, 연락처, 이메일 등 식별 정보는 AI 분석 전 자동으로 마스킹 처리되어 외부로 전송되지 않습니다. 경력·직무 내용만 분석에 활용되며, 분석 완료 후 데이터는 즉시 삭제됩니다.' },
  { q: '이직 경험이 없는 신입도 사용할 수 있나요?', a: '물론입니다. 신입부터 경력 15년 이상까지 다양한 단계에 맞춰 분석이 제공됩니다. 인턴/대외활동 경험만 있어도 분석이 가능합니다.' },
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
