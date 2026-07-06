const JobizicLogoSmall = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#1a1a14"/>
    <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
    <text x="50" y="70" textAnchor="middle" fontFamily="'Arial Black', 'Outfit', sans-serif" fontWeight="900" fontSize="50" letterSpacing="-1">
      <tspan fill="#e8e8de">J</tspan><tspan fill="#e8ff47">z</tspan>
    </text>
  </svg>
)

export default function Footer() {
  return (
    <footer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <JobizicLogoSmall />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 2, color: '#ffffff', textTransform: 'uppercase' }}>
          JOBIZIC
        </span>
      </div>

      {/* 사업자 정보 */}
      <div style={{
        fontSize: 13,
        color: 'var(--muted2)',
        lineHeight: 1.8,
        marginBottom: 16
      }}>
        <div><strong>JOBIZIC</strong> | 대표: 박영철</div>
        <div>사업자등록번호: 566-18-02615</div>
        <div>통신판매업 신고: [신고 예정]</div>
        <div>주소: 경기도 수원시 장안구 화산로 87, 404호</div>
        <div>이메일: roche07he@gmail.com</div>
      </div>

      <div className="footer-copy" style={{ marginBottom: 12 }}>
        © 2026 Jobizic. All rights reserved.
      </div>

      <div className="footer-links">
        <a href="/terms">이용약관</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/licenses">오픈소스 라이선스</a>
        <a href="/support">고객센터</a>
      </div>
    </footer>
  )
}
