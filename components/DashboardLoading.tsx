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

      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Jobizic 로고 */}
        <div style={{
          marginBottom: '32px',
          animation: 'float 3s ease-in-out infinite'
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

        {/* 스피너 */}
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(34, 211, 238, 0.2)',
          borderTopColor: '#22d3ee',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 20px'
        }} />

        {/* 로딩 텍스트 */}
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          animation: 'fadeInOut 2s ease-in-out infinite'
        }}>
          대시보드 로딩 중...
        </p>

        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px'
        }}>
          데이터를 불러오고 있습니다
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  )
}
