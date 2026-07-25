export default function DashboardLoading() {
  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 배경 그라디언트 효과 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 3s ease-in-out infinite',
      }} />

      {/* Jobizic 로고 */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        animation: 'scaleFloat 0.5s ease-in-out infinite'
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
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

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
