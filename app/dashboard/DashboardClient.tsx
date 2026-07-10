'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalysis } from '@/contexts/AnalysisContext'
import AnnouncementModal from '@/components/AnnouncementModal'
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '@/types/pipeline'

interface DashboardStats {
  totalCandidates: number
  thisMonthAnalyses: number
  thisMonthResumes?: number
  thisMonthJDs?: number
  thisMonthProposals?: number
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
    company: string
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
        height: 160,
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
  const [hiringStats, setHiringStats] = useState({ active: 0, passed: 0, hired: 0, screening: 0 })
  const [activeCandidates, setActiveCandidates] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [notificationsCleared, setNotificationsCleared] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [goals, setGoals] = useState({
    hiredTarget: 10,
    passedTarget: 20,
    proposalTarget: 10
  })

  // 목표 불러오기 (Supabase)
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch('/api/dashboard/goals')
        if (res.ok) {
          const data = await res.json()
          if (data.goals) {
            setGoals(data.goals)
          }
        } else {
          // API 실패 시 localStorage 폴백
          const savedGoals = localStorage.getItem('dashboard_goals')
          if (savedGoals) {
            setGoals(JSON.parse(savedGoals))
          }
        }
      } catch (e) {
        console.error('Failed to fetch goals:', e)
        // 에러 시 localStorage 폴백
        const savedGoals = localStorage.getItem('dashboard_goals')
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals))
        }
      }
    }

    fetchGoals()

    // 알림 cleared 상태 불러오기 (날짜 기반)
    const clearedData = localStorage.getItem('notifications_cleared')
    if (clearedData) {
      try {
        const { date } = JSON.parse(clearedData)
        const today = new Date().toDateString()
        if (date === today) {
          setNotificationsCleared(true)
        } else {
          // 날짜가 다르면 삭제
          localStorage.removeItem('notifications_cleared')
        }
      } catch (e) {
        console.error('Failed to parse notifications cleared:', e)
      }
    }
  }, [])

  // 목표 저장
  const saveGoals = async (newGoals: typeof goals) => {
    try {
      // 즉시 UI 업데이트
      setGoals(newGoals)
      localStorage.setItem('dashboard_goals', JSON.stringify(newGoals))

      // Supabase에 저장
      const res = await fetch('/api/dashboard/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoals)
      })

      if (!res.ok) {
        console.error('Failed to save goals to database')
        // UI에는 이미 반영되었으므로 에러 표시만
      }

      setShowGoalSettings(false)
    } catch (error) {
      console.error('Error saving goals:', error)
      setShowGoalSettings(false)
    }
  }

  // 알림 생성 (실시간 시뮬레이션)
  const notifications = notificationsCleared ? [] : [
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
  }, [])

  // 후보자 이름 수정 함수
  const updateCandidateName = async (activityId: string, activityType: 'resume' | 'jd', newName: string) => {
    try {
      const endpoint = activityType === 'resume'
        ? `/api/analyses/${activityId}/update-name`
        : `/api/jd-analyses/${activityId}/update-name`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })

      if (res.ok) {
        // 통계 다시 불러오기
        fetchStats()
        setEditingActivityId(null)
        setEditingName('')
      } else {
        alert('이름 수정 실패')
      }
    } catch (e) {
      console.error('Failed to update name:', e)
      alert('이름 수정 실패')
    }
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
        thisMonthResumes: data.thisMonthResumes,
        thisMonthJDs: data.thisMonthJDs,
        thisMonthProposals: data.thisMonthProposals,
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
      const res = await fetch('/api/pipeline')
      if (res.ok) {
        const data = await res.json()
        const candidates = data.candidates || []

        // 진행 중인 후보자 목록 (최신순, 최대 5명)
        const activeCands = candidates
          .filter((c: any) => !['PASSED', 'FAILED'].includes(c.stage))
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)

        // 파이프라인 데이터 계산
        const active = candidates.filter((c: any) => !['PASSED', 'FAILED'].includes(c.stage)).length
        const passed = candidates.filter((c: any) => c.stage === 'PASSED').length
        const hired = passed  // 합격 = 채용 완료
        const screening = candidates.filter((c: any) => ['DOCUMENT_PREP', 'DOCUMENT_REVIEW'].includes(c.stage)).length

        setHiringStats({ active, passed, hired, screening })
        setActiveCandidates(activeCands)
      }
    } catch (err) {
      console.error('Failed to fetch pipeline stats:', err)
      // 에러 시 기본값 유지
    }
  }

  if (loading) {
    return (
      <main style={{
        padding: '100px 20px 40px',
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
          gap: 16,
          marginBottom: 32,
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: 20,
              height: 140,
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
        padding: '100px 20px',
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
    <>
      {/* 공지사항 모달 */}
      <AnnouncementModal />

      <main style={{
        padding: '100px 20px 40px',
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
        zIndex: 100,
        marginBottom: 32,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: 32,
            marginBottom: 8,
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
              {notifications.length > 0 && !notificationsCleared && (
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
              <>
                {/* 배경 클릭으로 닫기 */}
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998
                  }}
                  onClick={() => setShowNotifications(false)}
                />

                <div style={{
                  position: 'fixed',
                  top: 80,
                  right: 24,
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
                      onClick={() => {
                        // 먼저 창 닫기
                        setShowNotifications(false)
                        // 그 다음 알림 처리
                        setNotificationsCleared(true)
                        localStorage.setItem('notifications_cleared', JSON.stringify({
                          date: new Date().toDateString()
                        }))
                      }}
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
              </>
            )}
          </div>


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

      {/* Quick Actions */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: 32
      }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          marginBottom: 16,
          letterSpacing: '-0.02em'
        }}>
          ⚡ 빠른 작업
        </h2>
        <div style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))',
            gap: 16,
            minWidth: 'fit-content'
          }}>
          <button
            onClick={() => router.push('/analyze?tab=upload')}
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(34, 211, 238, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: 16,
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(34, 211, 238, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#22d3ee', marginBottom: 4 }}>
              이력서 분석
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              새 후보자 이력서 업로드 및 분석
            </div>
          </button>

          <button
            onClick={() => router.push('/analyze?tab=jd')}
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 16,
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(251, 191, 36, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
              JD 분석
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              JD와 후보자 적합도 분석
            </div>
          </button>

          <button
            onClick={() => router.push('/analyze?tab=interview')}
            style={{
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(167, 139, 250, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              borderRadius: 16,
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.6)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(167, 139, 250, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎤</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
              면접 가이드
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              맞춤형 면접 준비 가이드 생성
            </div>
          </button>

          <button
            onClick={() => router.push('/settlements')}
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 16,
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(251, 191, 36, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
              정산
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              이번 달 정산 내역
            </div>
          </button>
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
          padding: 24,
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
              margin: 0,
              whiteSpace: 'nowrap'
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
                gap: 6,
                whiteSpace: 'nowrap'
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

          {/* 진행 중 후보자 */}
          {activeCandidates.length > 0 && (
            <div style={{
              marginTop: 32,
              padding: '24px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#fbbf24',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>🔄</span>
                진행 중 ({hiringStats.active}명)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => router.push('/pipeline')}
                    style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)'
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
                        marginBottom: 4
                      }}>
                        {candidate.candidate_name}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.6)'
                      }}>
                        {candidate.company_name} · {candidate.position_title}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      background: PIPELINE_STAGE_COLORS[candidate.stage as keyof typeof PIPELINE_STAGE_COLORS] + '20',
                      border: `1px solid ${PIPELINE_STAGE_COLORS[candidate.stage as keyof typeof PIPELINE_STAGE_COLORS]}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: PIPELINE_STAGE_COLORS[candidate.stage as keyof typeof PIPELINE_STAGE_COLORS],
                      whiteSpace: 'nowrap'
                    }}>
                      {PIPELINE_STAGE_LABELS[candidate.stage as keyof typeof PIPELINE_STAGE_LABELS]}
                    </div>
                  </div>
                ))}
              </div>
              {hiringStats.active > 5 && (
                <div style={{
                  marginTop: 12,
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  +{hiringStats.active - 5}명 더 보기 →
                </div>
              )}
            </div>
          )}

          {/* 목표 카드 */}
          <div style={{
            marginTop: 32,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))',
              gap: 20,
              minWidth: 'fit-content'
            }}>
            {/* 입사 목표 */}
            {(() => {
              const target = goals.hiredTarget
              const current = hiringStats.hired
              const percentage = Math.min(100, Math.round((current / target) * 100))
              return (
                <div style={{
                  padding: '20px 24px',
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
                    fontSize: 32,
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
                    color: 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
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
                  padding: '20px 24px',
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
                    fontSize: 32,
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
                    color: 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
                  }}>
                    {percentage}% 달성 {current >= target ? '🎉' : '📊'}
                  </div>
                </div>
              )
            })()}

            {/* 진행 중 목표 */}
            {(() => {
              const target = goals.proposalTarget
              const current = hiringStats.active
              const percentage = Math.min(100, Math.round((current / target) * 100))
              return (
                <div style={{
                  padding: '20px 24px',
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
                    진행 중
                  </div>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#a78bfa',
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
                      background: 'linear-gradient(90deg, #a78bfa 0%, #fbbf24 100%)',
                      borderRadius: 4,
                      transition: 'all 0.6s ease-out'
                    }} />
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap'
                  }}>
                    {percentage}% 달성 {current >= target ? '🎉' : '📋'}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* 전체보기 버튼 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 32
          }}>
            <button
              onClick={() => router.push('/pipeline')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(34, 211, 238, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(34, 211, 238, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 211, 238, 0.3)'
              }}
            >
              📊 채용 프로세스 전체보기
            </button>
          </div>
          </div>
        </div>
      </div>


      {/* Recent Activity */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: 56,
      }}>
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
                  onClick={() => {
                    if (activity.type === 'jd') {
                      router.push(`/analyze?tab=jd&id=${activity.id}`)
                    } else {
                      router.push(`/result/${activity.id}`)
                    }
                  }}
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
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: activity.type === 'resume' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(34, 211, 238, 0.2)',
                        color: activity.type === 'resume' ? '#a78bfa' : '#22d3ee',
                        border: activity.type === 'resume' ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid rgba(34, 211, 238, 0.3)'
                      }}>
                        {activity.type === 'resume' ? '📋 이력서' : '📊 JD'}
                      </span>
                      {editingActivityId === activity.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => {
                            if (editingName.trim() && editingName !== activity.name) {
                              updateCandidateName(activity.id, activity.type, editingName.trim())
                            } else {
                              setEditingActivityId(null)
                              setEditingName('')
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingName.trim() && editingName !== activity.name) {
                                updateCandidateName(activity.id, activity.type, editingName.trim())
                              } else {
                                setEditingActivityId(null)
                                setEditingName('')
                              }
                            } else if (e.key === 'Escape') {
                              setEditingActivityId(null)
                              setEditingName('')
                            }
                          }}
                          autoFocus
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(34, 211, 238, 0.5)',
                            borderRadius: 4,
                            padding: '4px 8px',
                            color: '#ffffff',
                            fontSize: 15,
                            fontWeight: 600,
                            outline: 'none',
                            minWidth: 120
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingActivityId(activity.id)
                            setEditingName(activity.name)
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          {activity.name}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: 4
                    }}>
                      {activity.company} · {activity.position}
                    </div>
                    <div style={{
                      fontSize: 12,
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
                proposalTarget: Number(formData.get('proposalTarget'))
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

              {/* 진행 중 목표 */}
              <div style={{ marginBottom: 32 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 8
                }}>
                  진행 중 목표 (명)
                </label>
                <input
                  type="number"
                  name="proposalTarget"
                  defaultValue={goals.proposalTarget}
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
    </>
  )
}
