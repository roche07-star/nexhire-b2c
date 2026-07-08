const JobizicLogoSmall = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 텍스트 */}
    <text x="50" y="70" textAnchor="middle" fontFamily="'Arial Black', 'Outfit', sans-serif" fontWeight="900" fontSize="42" letterSpacing="-2">
      <tspan fill="#1a1a1a">Jz</tspan>
    </text>
  </svg>
)

export default function Footer() {
  return (
    <footer className="footer-container">
      {/* 로고 */}
      <div className="footer-logo-section">
        <JobizicLogoSmall />
        <span className="footer-brand">JOBIZIC</span>
      </div>

      {/* 사업자 정보 */}
      <div className="footer-info">
        <div>JOBIZIC | 대표: 박영철</div>
        <div>사업자등록번호: 566-18-02615</div>
        <div>주소: 경기도 수원시 장안구 화산로 87, 404호</div>
        <div>전화: 070-8095-5546</div>
        <div>이메일: jobizic.biz@gmail.com</div>
        <div className="footer-copyright">© 2026 Jobizic. All rights reserved.</div>
      </div>

      {/* 링크 */}
      <div className="footer-links">
        <a href="/terms">이용약관</a>
        <span className="footer-divider">·</span>
        <a href="/privacy">개인정보처리방침</a>
        <span className="footer-divider">·</span>
        <a href="/refund">환불정책</a>
        <span className="footer-divider">·</span>
        <a href="/licenses">오픈소스 라이선스</a>
        <span className="footer-divider">·</span>
        <a href="/support">고객센터</a>
      </div>
    </footer>
  )
}
