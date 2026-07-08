const JobizicLogoSmall = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2a2a24" />
        <stop offset="100%" stopColor="#1a1a14" />
      </linearGradient>
      <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8ff47" />
        <stop offset="50%" stopColor="#f0ff70" />
        <stop offset="100%" stopColor="#e8ff47" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* 배경 */}
    <rect width="100" height="100" rx="24" fill="url(#bgGradient)"/>

    {/* 그라데이션 테두리 */}
    <rect x="3" y="3" width="94" height="94" rx="21" stroke="url(#borderGradient)" strokeWidth="4" opacity="0.9"/>

    {/* 내부 광채 효과 */}
    <rect x="8" y="8" width="84" height="84" rx="18" stroke="#e8ff47" strokeWidth="1" opacity="0.3"/>

    {/* 텍스트 */}
    <text x="50" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Outfit', sans-serif" fontWeight="900" fontSize="52" letterSpacing="-2" filter="url(#glow)">
      <tspan fill="#e8e8de">J</tspan><tspan fill="#e8ff47">z</tspan>
    </text>

    {/* 작은 강조점 */}
    <circle cx="75" cy="25" r="3" fill="#e8ff47" opacity="0.6"/>
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
