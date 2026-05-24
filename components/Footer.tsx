const NexhireLogoSmall = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#2a2a22"/>
    <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
    <path d="M24 75 L24 25 L35 25 L62 62 L62 25 L73 25 L73 75 L62 75 L35 38 L35 75 Z" fill="#e8e8de"/>
    <circle cx="73" cy="22" r="10" fill="#e8ff47"/>
  </svg>
)

export default function Footer() {
  return (
    <footer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NexhireLogoSmall />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 2, color: '#ffffff', textTransform: 'uppercase' }}>
          NEXHIRE
        </span>
      </div>
      <div className="footer-copy">© 2026 Nexhire. All rights reserved.</div>
      <div className="footer-links">
        <a href="#">이용약관</a>
        <a href="#">개인정보처리방침</a>
        <a href="#">문의하기</a>
      </div>
    </footer>
  )
}
