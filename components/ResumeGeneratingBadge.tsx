'use client'

import { useEffect, useState } from 'react'

export default function ResumeGeneratingBadge() {
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // 초기 확인
    setIsGenerating(localStorage.getItem('resumeGenerating') === 'true')

    // 0.5초마다 확인
    const interval = setInterval(() => {
      setIsGenerating(localStorage.getItem('resumeGenerating') === 'true')
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (!isGenerating) return null

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      borderRadius: '20px',
      border: '1px solid #60a5fa',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    }}>
      <div style={{
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '14px',
        whiteSpace: 'nowrap'
      }}>
        ⏳ 이력서 분석 중...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
