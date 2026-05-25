const personas = [
  {
    cls: 'before',
    stage: 'Before',
    title: '막막한 구직자',
    items: [
      '이력서를 어떻게 써야 할지 모름',
      '나에게 맞는 직무가 뭔지 불분명',
      '어느 회사에 지원해야 할지 감이 없음',
      '서류 탈락이 반복되는 이유를 모름',
    ],
  },
  {
    cls: 'during',
    stage: 'Nexhire 사용',
    title: 'AI가 분석 중',
    items: [
      '이력서 업로드 → 3분 내 분석 완료',
      '강점·약점·키워드 자동 도출',
      '직무 적합도 + 커리어 경로 3가지 제시',
      '지원 공고 JD 입력 → 적합도 & 전략 즉시 분석',
    ],
  },
  {
    cls: 'after',
    stage: 'After',
    title: '전략이 생긴 지원자',
    items: [
      '목표 직무와 커리어 방향이 명확해짐',
      '각 공고별 나만의 어필 전략을 갖게 됨',
      '부족한 점을 알고 집중적으로 보완함',
      '서류 합격률이 눈에 띄게 상승',
    ],
  },
]

export default function Persona() {
  return (
    <div className="persona-section">
      <div style={{ maxWidth: 1100, margin: '0 auto' }} className="reveal">
        <div className="section-label">Before → After</div>
        <div className="section-title">Nexhire를 쓰기 전과 후</div>
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
