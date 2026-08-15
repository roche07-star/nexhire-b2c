import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  try {
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 80px',
              background: 'white',
              borderRadius: '32px',
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: '#667eea',
                marginBottom: 40,
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

            {/* Badges */}
            <div
              style={{
                display: 'flex',
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1a7a4a',
                  background: '#d4edda',
                  padding: '12px 32px',
                  borderRadius: '100px',
                }}
              >
                무료 3회 체험
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1a4fa0',
                  background: '#d6e9f8',
                  padding: '12px 32px',
                  borderRadius: '100px',
                }}
              >
                Claude Sonnet 4
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: 'white',
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
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
