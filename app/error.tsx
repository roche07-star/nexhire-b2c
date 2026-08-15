'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러를 Sentry에 자동 전송
    Sentry.captureException(error)
    console.error('[Error Page]', error)
  }, [error])

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
          fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 700,
          marginBottom: '12px',
          color: '#e8ff47'
        }}>
          문제가 발생했습니다
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 3vw, 16px)',
          color: '#a5a5a0',
          marginBottom: '32px',
          lineHeight: 1.6
        }}>
          일시적인 오류가 발생했습니다.<br />
          잠시 후 다시 시도해 주세요.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#e8ff47',
              color: '#1a1a14',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            다시 시도
          </button>

          <Link
            href="/"
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #3a3a34',
              background: 'transparent',
              color: '#e8e8de',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s',
            }}
          >
            홈으로
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details style={{
            marginTop: '32px',
            padding: '16px',
            background: '#1a1a14',
            borderRadius: '8px',
            textAlign: 'left',
            fontSize: '12px',
            color: '#ff6b6b'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 600 }}>
              개발 모드: 에러 상세
            </summary>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace'
            }}>
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </main>
  )
}
