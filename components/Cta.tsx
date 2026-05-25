import Link from 'next/link'

export default function Cta() {
  return (
    <div className="cta-section">
      <div className="cta-inner reveal">
        <h2>지금 이력서를<br />업로드하세요</h2>
        <p>3분이면 커리어 방향과 JD 전략이 명확해집니다.<br />첫 분석은 완전 무료입니다.</p>
        <Link href="/analyze">
          <button className="btn-hero">무료 분석 시작하기 →</button>
        </Link>
      </div>
    </div>
  )
}
