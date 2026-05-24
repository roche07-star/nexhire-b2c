const stats = [
  { num: '2,400+', desc: '분석 완료된 이력서' },
  { num: '94%', desc: '방향성 만족도' },
  { num: '3분', desc: '평균 분석 시간' },
  { num: '340+', desc: '매칭 직무 데이터' },
]

export default function Stats() {
  return (
    <div className="stats-bar">
      {stats.map((s) => (
        <div key={s.desc} className="stat-item">
          <div className="stat-num">{s.num}</div>
          <div className="stat-desc">{s.desc}</div>
        </div>
      ))}
    </div>
  )
}
