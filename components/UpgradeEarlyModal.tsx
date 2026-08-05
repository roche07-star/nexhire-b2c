'use client'

import { useState } from 'react'

interface UpgradeEarlyModalProps {
  feature: string
  currentPlan: string
  nextPlan: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

const FEATURE_NAMES: Record<string, string> = {
  analyze: '이력서 분석',
  jd: 'JD 적합도 분석',
  rewrite: '이력서 생성',
  interview: '면접 가이드',
  proposal: '클라이언트 제안서',
  weekly_report: '주간 Report',
  monthly_report: '월간 Report',
}

export default function UpgradeEarlyModal({
  feature,
  currentPlan,
  nextPlan,
  onConfirm,
  onCancel,
}: UpgradeEarlyModalProps) {
  const [loading, setLoading] = useState(false)
  const [cancelHover, setCancelHover] = useState(false)
  const [confirmHover, setConfirmHover] = useState(false)
  const featureName = FEATURE_NAMES[feature] || feature

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          borderRadius: 24,
          maxWidth: 520,
          width: '100%',
          padding: 40,
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.1)',
          animation: 'slideUp 0.3s ease-out',
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 장식 요소 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #3b82f6 100%)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        />

        {/* 아이콘 */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 40,
            boxShadow: '0 8px 20px rgba(251, 191, 36, 0.4)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          🚀
        </div>

        {/* 제목 */}
        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #18181b 0%, #52525b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}
        >
          {currentPlan} 플랜 한도 초과
        </h2>

        {/* 설명 */}
        <div
          style={{
            fontSize: 16,
            color: '#3f3f46',
            lineHeight: 1.7,
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
            }}
          >
            {featureName}
          </span>{' '}
          횟수가 소진되었습니다.
          <br />
          <br />
          예약하신{' '}
          <span
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {nextPlan} 플랜
          </span>
          의 한도를
          <br />
          미리 사용하시겠습니까?
        </div>

        {/* 안내 카드 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
            fontSize: 14,
            color: '#78716c',
            lineHeight: 1.6,
            border: '2px solid #fbbf24',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 12,
              color: '#92400e',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            안내사항
          </div>
          <div style={{ paddingLeft: 26 }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#3b82f6' }}>✓ "예"</strong> 선택 시
              <br />→ {nextPlan} 플랜이 즉시 활성화되며 모든 사용량이 리셋됩니다.
            </div>
            <div>
              <strong style={{ color: '#71717a' }}>✗ "아니요"</strong> 선택 시
              <br />→ 현재 플랜 만료일까지 대기 후 자동 활성화됩니다.
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{
              flex: 1,
              padding: '16px 28px',
              background: cancelHover ? '#e4e4e7' : '#f4f4f5',
              color: '#52525b',
              border: '2px solid transparent',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s',
              transform: cancelHover ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: cancelHover
                ? '0 8px 16px rgba(0, 0, 0, 0.15)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            아니요, 대기할게요
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            onMouseEnter={() => setConfirmHover(true)}
            onMouseLeave={() => setConfirmHover(false)}
            style={{
              flex: 1,
              padding: '16px 28px',
              background: loading
                ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                : confirmHover
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              transform: confirmHover && !loading ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: confirmHover && !loading
                ? '0 12px 24px rgba(59, 130, 246, 0.4)'
                : '0 4px 8px rgba(59, 130, 246, 0.2)',
            }}
          >
            {loading ? (
              <span>
                <span style={{ display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }}>
                  ⚡
                </span>{' '}
                활성화 중...
              </span>
            ) : (
              `✨ 예, ${nextPlan} 사용할게요`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
