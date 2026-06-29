'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || '결제에 실패했습니다.'
  const code = searchParams.get('code')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 500,
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          결제 실패
        </h1>
        <p style={{ color: 'var(--muted2)', marginBottom: 8 }}>
          {message}
        </p>
        {code && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
            오류 코드: {code}
          </p>
        )}

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#ef4444' }}>
            📌 실패 원인
          </div>
          <ul style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>카드 한도 초과</li>
            <li>잘못된 카드 정보</li>
            <li>결제 승인 거부</li>
            <li>네트워크 오류</li>
          </ul>
        </div>

        <Link href="/payment">
          <button style={{
            width: '100%',
            padding: 16,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            marginBottom: 12,
          }}>
            다시 시도하기
          </button>
        </Link>

        <Link href="/">
          <button style={{
            width: '100%',
            padding: 12,
            background: 'transparent',
            color: 'var(--muted2)',
            fontSize: 14,
            borderRadius: 8,
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}>
            홈으로 이동
          </button>
        </Link>

        <div style={{
          marginTop: 24,
          padding: 12,
          background: 'var(--surface2)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--muted)',
        }}>
          문의: support@nexhire.com
        </div>
      </div>
    </div>
  )
}
