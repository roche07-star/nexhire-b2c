'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function FailPageContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <span style={{ fontSize: 40 }}>❌</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          결제에 실패했습니다
        </h1>
        <p style={{ color: 'var(--muted2)', marginBottom: 8 }}>
          {message || '결제 중 오류가 발생했습니다.'}
        </p>
        {code && (
          <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 32 }}>
            오류 코드: {code}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <Link href="/store" style={{ flex: 1 }}>
            <button style={{
              width: '100%',
              padding: 14,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              스토어로 돌아가기
            </button>
          </Link>
          <Link href="/support" style={{ flex: 1 }}>
            <button style={{
              width: '100%',
              padding: 14,
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              고객센터
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function StoreFailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        로딩 중...
      </div>
    }>
      <FailPageContent />
    </Suspense>
  )
}
