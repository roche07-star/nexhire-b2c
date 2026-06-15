'use client'

import { useAnalysis } from '@/contexts/AnalysisContext'
import { useRouter, usePathname } from 'next/navigation'

export default function AnalysisBadge() {
  const { state } = useAnalysis()
  const router = useRouter()
  const pathname = usePathname()

  if (!state.isAnalyzing && !state.isCompleted) {
    return null
  }

  const handleClick = () => {
    if (state.isAnalyzing) {
      // 분석 중일 때: 이미 /analyze에 있다면 아무것도 안 함
      if (pathname !== '/analyze') {
        router.push('/analyze')
      }
    } else if (state.resultId) {
      // 완료되었을 때: 결과 페이지로 이동
      router.push(`/result/${state.resultId}`)
    }
  }

  const queueCount = state.queue.length

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '8px 16px',
        background: state.isCompleted ? '#22c55e' : '#3b82f6',
        color: '#fff',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.3s',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {state.isAnalyzing && (
        <>
          <div
            style={{
              width: 12,
              height: 12,
              border: '2px solid #fff',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span>분석 중{queueCount > 0 ? `(+${queueCount})` : '...'}</span>
        </>
      )}
      {state.isCompleted && (
        <>
          <span>✓</span>
          <span>분석 완료!{queueCount > 0 ? ` (+${queueCount}개 대기)` : ''}</span>
        </>
      )}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
