'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RewritePreviewPage() {
  const router = useRouter()
  const [html, setHtml] = useState<string>('')
  const [plan, setPlan] = useState<string>('FREE')
  const [originalSummary, setOriginalSummary] = useState<string>('')
  const [changes, setChanges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jobizic_last_rewrite')
      if (!saved) {
        alert('미리보기 데이터가 없습니다.')
        router.push('/analyze')
        return
      }

      const data = JSON.parse(saved)
      const ageMinutes = Math.floor((Date.now() - data.timestamp) / 60000)
      if (ageMinutes > 60) {
        alert('미리보기 데이터가 만료되었습니다. (1시간 제한)')
        router.push('/analyze')
        return
      }

      setHtml(data.preview ?? '')
      setPlan(data.plan ?? 'FREE')
      setOriginalSummary(data.originalSummary ?? '')
      setChanges(data.changes ?? [])
      setLoading(false)
    } catch (e) {
      console.error('미리보기 로드 실패:', e)
      alert('미리보기를 불러올 수 없습니다.')
      router.push('/analyze')
    }
  }, [router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        fontFamily: 'Noto Sans KR, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>로딩 중...</div>
          <div style={{ fontSize: 14, color: '#666' }}>미리보기를 준비하고 있습니다.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: 'Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif',
      lineHeight: 1.8,
      color: '#1a1a1a',
      background: '#f5f5f5',
      padding: '40px 20px',
      minHeight: '100vh',
    }}>
      <div style={{
        maxWidth: originalSummary ? '1600px' : '900px',
        margin: '0 auto',
        background: 'white',
        padding: '60px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '8px',
            }}>✨ 생성된 이력서</h1>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
            }}>
              {plan === 'FREE' && '🆓 FREE 플랜 - HTML 미리보기'}
              {plan === 'PRO' && '⭐ PRO 플랜 - DOCX 다운로드 완료'}
              {plan === 'EXPERT' && '💎 EXPERT 플랜 - DOCX 다운로드 완료'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0e0e0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0f0f0'
              }}
            >
              🖨️ 인쇄하기
            </button>
            <button
              onClick={() => router.push('/analyze')}
              style={{
                padding: '10px 20px',
                background: '#e8ff47',
                border: '1px solid #e8ff47',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d4e83e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e8ff47'
              }}
            >
              ← 돌아가기
            </button>
          </div>
        </div>

        {/* 변경사항 박스 */}
        {changes.length > 0 && (
          <div style={{
            background: '#fff9e6',
            border: '1px solid #e8ff47',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '12px',
            }}>✨ 주요 변경사항</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {changes.map((change, i) => (
                <li key={i} style={{
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '6px',
                  paddingLeft: '20px',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                  }}>✏️</span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 비교 레이아웃 또는 단일 미리보기 */}
        {originalSummary ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            marginTop: '30px',
          }}>
            {/* 원본 이력서 */}
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '24px',
              background: '#fafafa',
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #999',
                color: '#999',
              }}>📄 이전 이력서 (원본)</h2>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{ __html: originalSummary }}
              />
            </div>

            {/* 수정된 이력서 */}
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '24px',
              background: '#fafafa',
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #e8ff47',
                color: '#1a1a1a',
              }}>✨ 수정된 이력서 (AI 생성)</h2>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: '#333',
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#333',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {/* 푸터 */}
        <div style={{
          marginTop: '60px',
          paddingTop: '20px',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
          fontSize: '13px',
          color: '#999',
        }}>
          Generated by <strong>Jobizic</strong> · AI Resume Generator
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
