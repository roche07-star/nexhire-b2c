export default function DashboardLoading() {
  return (
    <main style={{
      padding: '100px 20px 40px',
      maxWidth: 1400,
      margin: '0 auto',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* 배경 그라디언트 효과 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Jobizic 로고 */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        marginTop: '-200px',
        animation: 'scaleFloat 2s ease-in-out infinite'
      }}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 8px 32px rgba(34, 211, 238, 0.3))'
          }}
        >
          <rect width="100" height="100" rx="22" fill="#1a1a14"/>
          <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
          <text
            x="50"
            y="70"
            textAnchor="middle"
            fontFamily="'Arial Black', 'Outfit', sans-serif"
            fontWeight="900"
            fontSize="50"
            letterSpacing="-1"
          >
            <tspan fill="#e8e8de">J</tspan>
            <tspan fill="#e8ff47">z</tspan>
          </text>
        </svg>
      </div>

      <style>{`
        @keyframes scaleFloat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }
      `}</style>
    </main>
  )
}
