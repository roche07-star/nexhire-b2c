const personas = [
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
    title: 'AI 헤드헌터가 분석 중',
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

export default function Persona() {
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
