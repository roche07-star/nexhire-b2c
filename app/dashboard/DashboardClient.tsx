'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalysis } from '@/contexts/AnalysisContext'

interface DashboardStats {
  totalCandidates: number
  thisMonthAnalyses: number
  thisMonthResumes?: number
  thisMonthJDs?: number
  avgScore: number
  pipelineCounts: {
    pending: number
    screening: number
    interview: number
    final: number
    completed: number
  }
  recentActivity: Array<{
    id: string
    type: 'resume' | 'jd'
    name: string
    position: string
    score: number
    stage: string
    createdAt: string
  }>
}

interface DashboardClientProps {
  userEmail: string
  userPlan: string
  userType?: string | null
}

function StatCard({ title, value, suffix, icon, trend }: { title: string; value: number; suffix: string; icon: string; trend?: number }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 24,
      padding: '32px 28px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.4)'
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(34, 211, 238, 0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
      e.currentTarget.style.boxShadow = 'none'
    }}>
      {/* Glow Effect */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          {title}
        </span>
        <span style={{ fontSize: 32, opacity: 0.8 }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 48,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          {value.toLocaleString()}
        </span>
        <span style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)'
        }}>
          {suffix}
        </span>
      </div>

      {trend !== undefined && (
        <div style={{
          marginTop: 12,
          fontSize: 13,
          fontWeight: 600,
          color: trend >= 0 ? '#22d3ee' : '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span>{trend >= 0 ? '↗' : '↘'}</span>
          <span>{Math.abs(trend)}% vs 지난달</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardClient({ userEmail, userPlan, userType }: DashboardClientProps) {
  const router = useRouter()
  const { state: analysisState } = useAnalysis()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiringStats, setHiringStats] = useState({ active: 0, passed: 0, hired: 0 })

  useEffect(() => {
    fetchStats()
    fetchHiringProcessStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/stats')

      if (!res.ok) {
        throw new Error('통계 조회에 실패했습니다.')
      }

      const data = await res.json()

      const safeData: DashboardStats = {
        totalCandidates: data.totalCandidates || 0,
        thisMonthAnalyses: data.thisMonthAnalyses || 0,
        avgScore: data.avgScore || 0,
        pipelineCounts: data.pipelineCounts || {
          pending: 0,
          screening: 0,
          interview: 0,
          final: 0,
          completed: 0,
        },
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      }

      setStats(safeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const fetchHiringProcessStats = async () => {
    try {
      const res = await fetch('/api/hiring-process')
      if (res.ok) {
        const data = await res.json()
        const processes = data.processes || []

        // 실제 채용 프로세스 데이터 계산
        const active = processes.filter((p: any) => p.current_stage <= 4 && p.status !== 'FAILED').length
        const passed = processes.filter((p: any) => p.current_stage === 5).length
        const hired = processes.filter((p: any) => p.current_stage === 6).length

        setHiringStats({ active, passed, hired })
      }
    } catch (err) {
      console.error('Failed to fetch hiring process stats:', err)
      // 에러 시 기본값 유지
    }
  }

  if (loading) {
    return (
      <main style={{
        padding: '120px 24px 80px',
        maxWidth: 1400,
        margin: '0 auto',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Animated Background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Loading Skeleton */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 48 }}>
          <div style={{
            height: 40,
            width: 280,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            marginBottom: 12,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }} />
          <div style={{
            height: 20,
            width: 180,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '0.2s'
          }} />
        </div>

        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: 32,
              height: 180,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: `${i * 0.2}s`
            }} />
          ))}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{
        padding: '120px 24px',
        maxWidth: 600,
        margin: '0 auto',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        <div style={{
          fontSize: 72,
          marginBottom: 24,
          filter: 'drop-shadow(0 0 20px rgba(248, 113, 113, 0.5))'
        }}>⚠️</div>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 16,
          marginBottom: 32,
          lineHeight: 1.6
        }}>{error}</p>
        <button
          onClick={fetchStats}
          style={{
            padding: '16px 40px',
            background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 700,
            transition: 'all 0.3s',
            boxShadow: '0 10px 30px rgba(34, 211, 238, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(34, 211, 238, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 211, 238, 0.3)'
          }}
        >
          다시 시도
        </button>
      </main>
    )
  }

  if (!stats) {
    return null
  }

  const planBadgeColors: Record<string, { bg: string; text: string; glow: string }> = {
    FREE: { bg: 'rgba(113, 113, 122, 0.2)', text: '#a1a1aa', glow: 'rgba(113, 113, 122, 0.3)' },
    PRO: { bg: 'rgba(34, 211, 238, 0.2)', text: '#22d3ee', glow: 'rgba(34, 211, 238, 0.3)' },
    EXPERT: { bg: 'rgba(167, 139, 250, 0.2)', text: '#a78bfa', glow: 'rgba(167, 139, 250, 0.3)' },
  }

  const planColor = planBadgeColors[userPlan] || planBadgeColors.FREE

  return (
    <main style={{
      padding: '96px 24px 80px',
      maxWidth: 1400,
      margin: '0 auto',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Animated Background Gradients */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'gradientShift 15s ease infinite'
      }} />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes gradientShift {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 24
      }}>
        <div>
          <h1 style={{
            fontSize: 48,
            marginBottom: 12,
            color: '#ffffff',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textShadow: '0 0 30px rgba(34, 211, 238, 0.3)'
          }}>
            헤드헌터 대시보드
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15,
              letterSpacing: '-0.01em'
            }}>
              {userEmail}
            </p>
            <div style={{
              padding: '6px 14px',
              background: planColor.bg,
              color: planColor.text,
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              boxShadow: `0 0 20px ${planColor.glow}`,
              border: `1px solid ${planColor.text}40`
            }}>
              {userPlan}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setStats(null)
            setLoading(true)
            fetchStats()
          }}
          style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.05)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.3s',
            letterSpacing: '-0.01em',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          🔄 새로고침
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 56,
      }}>
        <StatCard
          title="현재 진행 이력서"
          value={stats.totalCandidates}
          suffix="건"
          icon="📋"
        />

        {/* 이번 달 이력서/JD 분석 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.4)'
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(34, 211, 238, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
        }}>
          {/* Glow Effect */}
          <div style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              이번 달 분석
            </span>
            <span style={{ fontSize: 32, opacity: 0.8 }}>📊</span>
          </div>

          {/* 이력서 / JD 분리 표시 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 4
              }}>
                이력서
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}>
                {stats.thisMonthResumes ?? stats.thisMonthAnalyses}
              </div>
            </div>

            <div style={{
              width: 1,
              height: 40,
              background: 'rgba(255,255,255,0.1)'
            }} />

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 4
              }}>
                JD
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}>
                {stats.thisMonthJDs ?? 0}
              </div>
            </div>
          </div>
        </div>
        <StatCard
          title="평균 적합도"
          value={stats.avgScore}
          suffix="점"
          icon="⭐"
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: 56,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: 24,
          padding: 40,
          transition: 'all 0.3s'
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 28,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 28 }}>🚀</span>
            빠른 작업
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16
          }}>
            {/* 새 이력서 분석 */}
            <button
              onClick={() => router.push('/analyze')}
              style={{
                padding: '20px 24px',
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: 16,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 211, 238, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 211, 238, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 24 }}>📋</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>새 이력서 분석</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>후보자 이력서 업로드</div>
              </div>
            </button>

            {/* 채용 프로세스 추가 */}
            <button
              onClick={() => router.push('/hiring-process')}
              style={{
                padding: '20px 24px',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: 16,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.6)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(167, 139, 250, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 24 }}>📊</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>채용 프로세스 관리</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>진행 중인 채용 보기</div>
              </div>
            </button>

            {/* 정산 확인 */}
            <button
              onClick={() => router.push('/settlements')}
              style={{
                padding: '20px 24px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: 16,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(251, 191, 36, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 24 }}>💰</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>정산 확인</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>이번 달 정산 내역</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick View & Activity */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 32
      }}>
        {/* Quick View - 채용 프로세스 한눈에 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: 40,
          transition: 'all 0.3s'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 16
          }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: 0
            }}>
              <span style={{ fontSize: 28 }}>⚡</span>
              채용 프로세스 한눈에
            </h2>
            <button
              onClick={() => router.push('/hiring-process')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
                color: '#22d3ee',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.3s',
                letterSpacing: '-0.01em',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(167, 139, 250, 0.3) 100%)'
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 211, 238, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)'
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              전체 보기 →
            </button>
          </div>

          {/* Quick Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20
          }}>
            {/* 진행 중 */}
            <div
              style={{
                padding: '28px 24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 20,
                border: '1px solid rgba(251, 191, 36, 0.3)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => router.push('/hiring-process')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(251, 191, 36, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Glow */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                진행 중
              </div>
              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#fbbf24',
                marginBottom: 8,
                letterSpacing: '-0.02em'
              }}>
                {hiringStats.active}
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)'
              }}>
                서류 ~ 최종 면접
              </div>
            </div>

            {/* 합격 */}
            <div
              style={{
                padding: '28px 24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 20,
                border: '1px solid rgba(34, 211, 238, 0.3)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => router.push('/hiring-process')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(34, 211, 238, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Glow */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                합격
              </div>
              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#22d3ee',
                marginBottom: 8,
                letterSpacing: '-0.02em'
              }}>
                {hiringStats.passed}
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)'
              }}>
                처우 협의 완료
              </div>
            </div>

            {/* 입사 */}
            <div
              style={{
                padding: '28px 24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 20,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => router.push('/hiring-process')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Glow */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                입사
              </div>
              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#10b981',
                marginBottom: 8,
                letterSpacing: '-0.02em'
              }}>
                {hiringStats.hired}
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)'
              }}>
                온보딩 완료
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div style={{
            marginTop: 24,
            padding: '16px 20px',
            background: 'rgba(34, 211, 238, 0.05)',
            border: '1px solid rgba(34, 211, 238, 0.15)',
            borderRadius: 12,
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span>
              상세한 후보자별 진행 상황은 <span style={{ color: '#22d3ee', fontWeight: 600 }}>채용 프로세스</span> 페이지에서 확인하세요
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: 40
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 28,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            최근 활동
          </h2>

          {stats.recentActivity.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
            }}>
              <div style={{
                fontSize: 64,
                marginBottom: 20,
                filter: 'grayscale(0.3) opacity(0.6)'
              }}>
                📭
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 12
              }}>
                아직 활동이 없어요
              </div>
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                첫 이력서를 분석하거나 채용 프로세스를 추가해보세요
              </div>
              <button
                onClick={() => router.push('/analyze')}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 30px rgba(34, 211, 238, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(34, 211, 238, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 211, 238, 0.3)'
                }}
              >
                첫 이력서 분석하기 →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '20px 24px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onClick={() => router.push(`/result/${activity.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: 6
                    }}>
                      {activity.name} · {activity.position}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      {new Date(activity.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {activity.score}점
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
