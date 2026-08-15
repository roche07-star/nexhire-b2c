import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        color: '#e8e8de'
      }}>
        {/* 로고 */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ margin: '0 auto 24px' }}
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

        <h1 style={{
          fontSize: 'clamp(48px, 10vw, 72px)',
          fontWeight: 700,
          marginBottom: '12px',
          color: '#e8ff47',
          fontFamily: "'Playfair Display', serif"
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: 'clamp(20px, 4vw, 24px)',
          fontWeight: 600,
          marginBottom: '12px',
          color: '#e8e8de'
        }}>
          페이지를 찾을 수 없습니다
        </h2>

        <p style={{
          fontSize: 'clamp(14px, 3vw, 16px)',
          color: '#a5a5a0',
          marginBottom: '32px',
          lineHeight: 1.6
        }}>
          요청하신 페이지가 존재하지 않거나<br />
          이동되었을 수 있습니다.
        </p>

        <Link
          href="/"
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#e8ff47',
            color: '#1a1a14',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'transform 0.2s',
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  )
}
