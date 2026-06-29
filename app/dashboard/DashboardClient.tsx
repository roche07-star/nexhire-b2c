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
  const [privacyMode, setPrivacyMode] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [goals, setGoals] = useState({
    hiredTarget: 10,
    passedTarget: 20,
    resumeTarget: 50
  })

  // localStorage에서 목표 불러오기
  useEffect(() => {
    const savedGoals = localStorage.getItem('dashboard_goals')
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals))
      } catch (e) {
        console.error('Failed to parse goals:', e)
      }
    }
  }, [])

  // 목표 저장
  const saveGoals = (newGoals: typeof goals) => {
    setGoals(newGoals)
    localStorage.setItem('dashboard_goals', JSON.stringify(newGoals))
    setShowGoalSettings(false)
  }

  // 알림 생성 (실시간 시뮬레이션)
  const notifications = [
    ...(hiringStats.hired > 0 ? [{
      id: 1,
      type: 'success' as const,
      icon: '🎉',
      title: '새로운 입사자',
      message: `${hiringStats.hired}명이 입사 절차를 완료했습니다`,
      time: '방금 전'
    }] : []),
    ...(hiringStats.passed > 0 ? [{
      id: 2,
      type: 'info' as const,
      icon: '✅',
      title: '합격 처리',
      message: `${hiringStats.passed}명이 최종 합격했습니다`,
      time: '5분 전'
    }] : []),
    ...(hiringStats.active > 0 ? [{
      id: 3,
      type: 'warning' as const,
      icon: '📋',
      title: '진행 중',
      message: `${hiringStats.active}명의 후보자가 프로세스 진행 중입니다`,
      time: '30분 전'
    }] : []),
  ]

  useEffect(() => {
    fetchStats()
    fetchHiringProcessStats()

    // 온보딩 체크 (첫 방문)
    const hasSeenOnboarding = localStorage.getItem('dashboard_onboarding_seen')
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem('dashboard_onboarding_seen', 'true')
    setShowOnboarding(false)
  }

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (!privacyMode || !name || name.length === 0) return name
    if (name.length === 1) return name
    if (name.length === 2) return name[0] + '○'
    return name[0] + '○'.repeat(name.length - 1)
  }

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
            대시보드
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
        <div style={{ display: 'flex', gap: 12 }}>
          {/* 알림 버튼 */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                padding: '12px',
                background: showNotifications ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                color: showNotifications ? '#fbbf24' : '#ffffff',
                border: showNotifications ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 20,
                transition: 'all 0.3s',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = showNotifications ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showNotifications ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              🔔
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 20,
                  height: 20,
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: 380,
                maxWidth: '90vw',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                zIndex: 99999,
                animation: 'slideDown 0.3s ease-out'
              }}>
                <style>{`
                  @keyframes slideDown {
                    from {
                      opacity: 0;
                      transform: translateY(-10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>

                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#ffffff'
                  }}>
                    알림 ({notifications.length})
                  </div>
                </div>

                <div style={{
                  maxHeight: 400,
                  overflowY: 'auto'
                }}>
                  {notifications.length === 0 ? (
                    <div style={{
                      padding: '60px 24px',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
                      <div>새로운 알림이 없습니다</div>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          padding: '16px 24px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12
                        }}>
                          <span style={{ fontSize: 24 }}>{notif.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#ffffff',
                              marginBottom: 4
                            }}>
                              {notif.title}
                            </div>
                            <div style={{
                              fontSize: 13,
                              color: 'rgba(255,255,255,0.7)',
                              marginBottom: 8
                            }}>
                              {notif.message}
                            </div>
                            <div style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.4)'
                            }}>
                              {notif.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }}
                    >
                      모두 읽음
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 프라이버시 모드 토글 */}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{
              padding: '12px 24px',
              background: privacyMode ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.05)',
              color: privacyMode ? '#a78bfa' : '#ffffff',
              border: privacyMode ? '1px solid rgba(167, 139, 250, 0.5)' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.3s',
              letterSpacing: '-0.01em',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = privacyMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255,255,255,0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = privacyMode ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span>{privacyMode ? '🔒' : '🔓'}</span>
            <span>익명 모드</span>
          </button>

          {/* 새로고침 버튼 */}
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
      </div>

      {/* Insights Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: 56,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
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
            <span style={{ fontSize: 28 }}>💡</span>
            인사이트
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20
          }}>
            {/* 이번 주 활동 요약 */}
            <div style={{
              padding: '24px 28px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 12
              }}>
                이번 주 활동
              </div>
              <div style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6,
                marginBottom: 16
              }}>
                {stats.recentActivity.length > 0 ? (
                  <>
                    최근 <span style={{ color: '#fbbf24', fontWeight: 700 }}>{stats.recentActivity.length}건</span>의 활동이 있었습니다
                  </>
                ) : (
                  <>
                    아직 활동이 없습니다. 첫 이력서를 분석해보세요!
                  </>
                )}
              </div>
              {/* 이번 달 분석 */}
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8
              }}>
                <span>📊</span>
                <span>이번 달 분석: <span style={{ color: '#a78bfa', fontWeight: 600 }}>이력서 {stats.thisMonthResumes ?? stats.thisMonthAnalyses}건</span>, <span style={{ color: '#22d3ee', fontWeight: 600 }}>JD {stats.thisMonthJDs ?? 0}건</span>, <span style={{ color: '#fbbf24', fontWeight: 600 }}>제안서 {(stats as any).thisMonthProposals ?? 0}건</span></span>
              </div>
              {stats.avgScore > 0 && (
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>📈</span>
                  <span>평균 적합도: <span style={{ color: '#22d3ee', fontWeight: 600 }}>{stats.avgScore}점</span></span>
                </div>
              )}
            </div>

            {/* 다음 할 일 추천 */}
            <div style={{
              padding: '24px 28px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 12
              }}>
                추천 작업
              </div>
              <div style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.6,
                marginBottom: 16
              }}>
                {hiringStats.active > 0 ? (
                  <>
                    진행 중인 <span style={{ color: '#a78bfa', fontWeight: 700 }}>{hiringStats.active}명</span>의 후보자를 확인하세요
                  </>
                ) : stats.totalCandidates > 0 ? (
                  <>
                    이력서를 채용 프로세스에 추가해보세요
                  </>
                ) : (
                  <>
                    새로운 이력서를 분석해보세요
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  if (hiringStats.active > 0) {
                    router.push('/hiring-process')
                  } else if (stats.totalCandidates > 0) {
                    router.push('/hiring-process')
                  } else {
                    router.push('/analyze')
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: 8,
                  color: '#fbbf24',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)'
                }}
              >
                바로가기 →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 성과 시각화 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: 56,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 24,
          padding: 40,
          transition: 'all 0.3s'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28
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
              <span style={{ fontSize: 28 }}>📈</span>
              이번 달 성과
            </h2>
            <button
              onClick={() => setShowGoalSettings(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: 8,
                color: '#a78bfa',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>⚙️</span>
              <span>목표 설정</span>
            </button>
          </div>

          {/* 목표 카드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}>
            {/* 입사 목표 */}
            {(() => {
              const target = goals.hiredTarget
              const current = hiringStats.hired
              const percentage = Math.min(100, Math.round((current / target) * 100))
              return (
                <div style={{
                  padding: '24px 28px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 16
                  }}>
                    입사 목표
                  </div>
                  <div style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#10b981',
                    marginBottom: 8,
                    letterSpacing: '-0.02em'
                  }}>
                    {current} / {target}명
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 12
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #22d3ee 100%)',
                      borderRadius: 4,
                      transition: 'all 0.6s ease-out'
                    }} />
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {percentage}% 달성 {current >= target ? '🎉' : '💪'}
                  </div>
                </div>
              )
            })()}

            {/* 합격 목표 */}
            {(() => {
              const target = goals.passedTarget
              const current = hiringStats.passed
              const percentage = Math.min(100, Math.round((current / target) * 100))
              return (
                <div style={{
                  padding: '24px 28px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 16
                  }}>
                    합격 목표
                  </div>
                  <div style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#22d3ee',
                    marginBottom: 8,
                    letterSpacing: '-0.02em'
                  }}>
                    {current} / {target}명
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 12
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%)',
                      borderRadius: 4,
                      transition: 'all 0.6s ease-out'
                    }} />
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {percentage}% 달성 {current >= target ? '🎉' : '📊'}
                  </div>
                </div>
              )
            })()}

            {/* 이력서 분석 목표 */}
            {(() => {
              const target = goals.resumeTarget
              const current = stats.thisMonthResumes ?? stats.thisMonthAnalyses
              const percentage = Math.min(100, Math.round((current / target) * 100))
              return (
                <div style={{
                  padding: '24px 28px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 16
                  }}>
                    이력서 분석 목표
                  </div>
                  <div style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#a78bfa',
                    marginBottom: 8,
                    letterSpacing: '-0.02em'
                  }}>
                    {current} / {target}건
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 12
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #a78bfa 0%, #fbbf24 100%)',
                      borderRadius: 4,
                      transition: 'all 0.6s ease-out'
                    }} />
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {percentage}% 달성 {current >= target ? '🎉' : '📋'}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* 성과 메시지 */}
          {hiringStats.hired > 0 && (
            <div style={{
              padding: '20px 24px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <span style={{ fontSize: 32 }}>🎉</span>
              <div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#10b981',
                  marginBottom: 4
                }}>
                  축하합니다!
                </div>
                <div style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  이번 달 {hiringStats.hired}명이 입사했습니다. 계속해서 좋은 성과를 내고 계십니다!
                </div>
              </div>
            </div>
          )}
        </div>
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
                      {maskName(activity.name)} · {activity.position}
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

      {/* 온보딩 모달 */}
      {showOnboarding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            maxWidth: 600,
            width: '100%',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: 24,
            padding: 48,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'slideUp 0.4s ease-out'
          }}>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>

            <div style={{
              fontSize: 48,
              textAlign: 'center',
              marginBottom: 24
            }}>
              👋
            </div>

            <h2 style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: '-0.02em'
            }}>
              대시보드에 오신 것을 환영합니다!
            </h2>

            <p style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 1.6
            }}>
              헤드헌터를 위한 강력한 도구로 채용을 더 효율적으로 관리하세요
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              marginBottom: 32
            }}>
              {[
                { icon: '🚀', title: '빠른 작업', desc: '새 이력서 분석부터 채용 프로세스까지 한 번에' },
                { icon: '💡', title: '인사이트', desc: '이번 주 활동과 추천 작업을 확인하세요' },
                { icon: '📊', title: '실시간 추적', desc: '후보자 진행 상황을 실시간으로 모니터링' },
                { icon: '🔒', title: '프라이버시', desc: '익명 모드로 안전하게 정보를 보호하세요' }
              ].map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ fontSize: 32 }}>{feature.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 4
                    }}>
                      {feature.title}
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.6)'
                    }}>
                      {feature.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={completeOnboarding}
              style={{
                width: '100%',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
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
              시작하기 →
            </button>
          </div>
        </div>
      )}

      {/* 목표 설정 모달 */}
      {showGoalSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>

          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            borderRadius: 24,
            padding: 48,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: 32,
              textAlign: 'center',
              letterSpacing: '-0.02em'
            }}>
              ⚙️ 이번 달 목표 설정
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              saveGoals({
                hiredTarget: Number(formData.get('hiredTarget')),
                passedTarget: Number(formData.get('passedTarget')),
                resumeTarget: Number(formData.get('resumeTarget'))
              })
            }}>
              {/* 입사 목표 */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 8
                }}>
                  입사 목표 (명)
                </label>
                <input
                  type="number"
                  name="hiredTarget"
                  defaultValue={goals.hiredTarget}
                  min="1"
                  max="1000"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                />
              </div>

              {/* 합격 목표 */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 8
                }}>
                  합격 목표 (명)
                </label>
                <input
                  type="number"
                  name="passedTarget"
                  defaultValue={goals.passedTarget}
                  min="1"
                  max="1000"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                />
              </div>

              {/* 이력서 분석 목표 */}
              <div style={{ marginBottom: 32 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 8
                }}>
                  이력서 분석 목표 (건)
                </label>
                <input
                  type="number"
                  name="resumeTarget"
                  defaultValue={goals.resumeTarget}
                  min="1"
                  max="10000"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 600
                  }}
                />
              </div>

              {/* 버튼 */}
              <div style={{
                display: 'flex',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={() => setShowGoalSettings(false)}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(167, 139, 250, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
