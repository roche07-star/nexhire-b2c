'use client'

import { useAnalysis } from '@/contexts/AnalysisContext'
import { useRouter, usePathname } from 'next/navigation'

export default function AnalysisBadge() {
  const { state } = useAnalysis()
  const router = useRouter()
  const pathname = usePathname()

  // 진행 중인 작업 확인
  const isAnyAnalyzing = state.resume.isAnalyzing || state.jd.isAnalyzing || state.rewrite.isAnalyzing
  const isAnyCompleted = state.resume.isCompleted || state.jd.isCompleted || state.rewrite.isCompleted

  if (!isAnyAnalyzing && !isAnyCompleted) {
    return null
  }

  // 우선순위: 이력서 분석 > 이력서 생성 > JD 분석
  let currentTask = ''
  let currentColor = '#3b82f6'
  let queueCount = 0

  if (state.resume.isAnalyzing || state.resume.isCompleted) {
    currentTask = state.resume.isAnalyzing ? '이력서 분석 중' : '이력서 분석 완료!'
    currentColor = state.resume.isCompleted ? '#22c55e' : '#3b82f6'
    queueCount = state.resume.queue.length
  } else if (state.rewrite.isAnalyzing || state.rewrite.isCompleted) {
    currentTask = state.rewrite.isAnalyzing ? '이력서 생성 중' : '이력서 생성 완료!'
    currentColor = state.rewrite.isCompleted ? '#22c55e' : '#8b5cf6'
  } else if (state.jd.isAnalyzing || state.jd.isCompleted) {
    currentTask = state.jd.isAnalyzing ? 'JD 분석 중' : 'JD 분석 완료!'
    currentColor = state.jd.isCompleted ? '#22c55e' : '#f97316'
  }

  const handleClick = () => {
    // 분석 중이면 /analyze로 이동
    if (isAnyAnalyzing && pathname !== '/analyze') {
      router.push('/analyze')
    }
    // 완료되었으면 결과 페이지로 이동
    else if (state.resume.isCompleted && state.resume.resultId) {
      router.push(`/result/${state.resume.resultId}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '8px 16px',
        background: currentColor,
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
      {isAnyAnalyzing && (
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
          <span>{currentTask}{queueCount > 0 ? ` (+${queueCount})` : '...'}</span>
        </>
      )}
      {!isAnyAnalyzing && isAnyCompleted && (
        <>
          <span>✓</span>
          <span>{currentTask}{queueCount > 0 ? ` (+${queueCount}개 대기)` : ''}</span>
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
