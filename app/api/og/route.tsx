import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f7f6f3',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 40,
              letterSpacing: '-2px',
            }}
          >
            Jobizic
          </div>

          {/* Main Headline */}
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: '#1a202c',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: 900,
              marginBottom: 24,
            }}
          >
            AI가 1분 만에 분석하는
            <br />
            합격 이력서
          </div>

          {/* Subheadline */}
          <div
            style={{
              fontSize: 32,
              color: '#4a5568',
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            Claude AI 기반 정확한 강점/약점 분석
          </div>

          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1a7a4a',
                backgroundColor: '#d4edda',
                padding: '12px 32px',
                borderRadius: '100px',
              }}
            >
              ✓ 무료 3회 체험
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1a4fa0',
                backgroundColor: '#d6e9f8',
                padding: '12px 32px',
                borderRadius: '100px',
              }}
            >
              ✓ Claude Sonnet 4
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
          }}
        >
          jobizic.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
