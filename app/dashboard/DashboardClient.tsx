'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalysis } from '@/contexts/AnalysisContext'

interface DashboardStats {
  totalCandidates: number
  thisMonthAnalyses: number
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

export default function DashboardClient({ userEmail, userPlan, userType }: DashboardClientProps) {
  const router = useRouter()
  const { state: analysisState } = useAnalysis()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
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

  const stageLabels: Record<string, string> = {
    pending: '접수',
    screening: '서류',
    interview: '면접',
    final: '최종',
    completed: '완료',
  }

  const stageColors: Record<string, string> = {
    pending: '#71717a',
    screening: '#3b82f6',
    interview: '#8b5cf6',
    final: '#f59e0b',
    completed: '#10b981',
  }

  if (loading) {
    return (
      <main style={{
        padding: '120px 24px 80px',
        maxWidth: 1200,
        margin: '0 auto',
        background: '#ffffff',
        minHeight: '100vh'
      }}>
        {/* Loading Skeleton */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            height: 40,
            width: 280,
            background: '#f1f5f9',
            borderRadius: 8,
            marginBottom: 12
          }} />
          <div style={{
            height: 20,
            width: 180,
            background: '#f1f5f9',
            borderRadius: 6
          }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #f1f5f9',
              borderRadius: 16,
              padding: 32,
              height: 140
            }}>
              <div style={{
                height: 16,
                width: 100,
                background: '#f1f5f9',
                borderRadius: 4,
                marginBottom: 16
              }} />
              <div style={{
                height: 48,
                width: 120,
                background: '#f1f5f9',
                borderRadius: 8
              }} />
            </div>
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
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 24
        }}>⚠️</div>
        <p style={{
          color: '#64748b',
          fontSize: 16,
          marginBottom: 32,
          lineHeight: 1.6
        }}>{error}</p>
        <button
          onClick={fetchStats}
          style={{
            padding: '12px 32px',
            background: '#18181b',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#27272a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#18181b'
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

  return (
    <main style={{
      padding: '96px 24px 80px',
      maxWidth: 1200,
      margin: '0 auto',
      background: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 24
      }}>
        <div>
          <h1 style={{
            fontSize: 36,
            marginBottom: 8,
            color: '#18181b',
            fontWeight: 700,
            letterSpacing: '-0.02em'
          }}>
            대시보드
          </h1>
          <p style={{
            color: '#71717a',
            fontSize: 15,
            letterSpacing: '-0.01em'
          }}>
            {userEmail} · {userPlan}
          </p>
        </div>
        <button
          onClick={() => {
            setStats(null)
            setLoading(true)
            fetchStats()
          }}
          style={{
            padding: '10px 20px',
            background: '#ffffff',
            color: '#18181b',
            border: '1px solid #e4e4e7',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.2s',
            letterSpacing: '-0.01em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fafafa'
            e.currentTarget.style.borderColor = '#d4d4d8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff'
            e.currentTarget.style.borderColor = '#e4e4e7'
          }}
        >
          새로고침
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginBottom: 56,
      }}>
        <StatCard
          title="총 후보자"
          value={stats.totalCandidates}
          suffix="명"
          icon="👥"
        />
        <StatCard
          title="이번 달 분석"
          value={stats.thisMonthAnalyses}
          suffix="건"
          icon="📊"
        />
        <StatCard
          title="평균 적합도"
          value={stats.avgScore}
          suffix="점"
          icon="⭐"
        />
      </div>

      {/* Pipeline */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #f1f5f9',
        borderRadius: 16,
        padding: 32,
        marginBottom: 56,
      }}>
        <h2 style={{
          fontSize: 20,
          marginBottom: 28,
          color: '#18181b',
          fontWeight: 700,
          letterSpacing: '-0.01em'
        }}>
          파이프라인
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16
        }}>
          {Object.entries(stats.pipelineCounts).map(([stage, count]) => (
            <div
              key={stage}
              style={{
                background: '#fafafa',
                border: '1px solid #f1f5f9',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa'
                e.currentTarget.style.borderColor = '#e4e4e7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fafafa'
                e.currentTarget.style.borderColor = '#f1f5f9'
              }}
            >
              <div style={{
                fontSize: 13,
                color: '#71717a',
                marginBottom: 12,
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}>
                {stageLabels[stage]}
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                color: stageColors[stage],
                letterSpacing: '-0.02em'
              }}>
                {count}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/pipeline')}
          style={{
            marginTop: 28,
            padding: '12px 24px',
            background: '#18181b',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.2s',
            letterSpacing: '-0.01em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#27272a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#18181b'
          }}
        >
          파이프라인 관리 →
        </button>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #f1f5f9',
        borderRadius: 16,
        padding: 32,
      }}>
        <h2 style={{
          fontSize: 20,
          marginBottom: 28,
          color: '#18181b',
          fontWeight: 700,
          letterSpacing: '-0.01em'
        }}>
          최근 활동
        </h2>
        {stats.recentActivity.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            color: '#a1a1aa'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 15, letterSpacing: '-0.01em' }}>
              아직 분석한 이력서가 없습니다.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(() => {
              const grouped = stats.recentActivity.reduce((acc: any, activity) => {
                if (!acc[activity.name]) {
                  acc[activity.name] = {
                    name: activity.name,
                    resume: null,
                    jdAnalyses: [],
                    latestDate: activity.createdAt
                  }
                }
                if (activity.type === 'resume') {
                  acc[activity.name].resume = activity
                } else {
                  acc[activity.name].jdAnalyses.push(activity)
                }
                if (new Date(activity.createdAt) > new Date(acc[activity.name].latestDate)) {
                  acc[activity.name].latestDate = activity.createdAt
                }
                return acc
              }, {})

              const sortedGroups = Object.values(grouped).sort((a: any, b: any) =>
                new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
              )

              return sortedGroups.map((group: any, idx: number) => {
                const isJustCompleted = group.resume && analysisState.resume.completedIds?.includes(group.resume.id)

                return (
                  <div
                    key={idx}
                    style={{
                      padding: 20,
                      background: '#fafafa',
                      border: '1px solid #f1f5f9',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{
                      fontSize: 17,
                      fontWeight: 700,
                      marginBottom: 16,
                      color: '#18181b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      letterSpacing: '-0.01em'
                    }}>
                      {group.name}
                      {isJustCompleted && (
                        <span style={{
                          padding: '4px 12px',
                          background: '#10b981',
                          color: '#ffffff',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0'
                        }}>
                          완료
                        </span>
                      )}
                    </div>

                    {group.resume && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 16,
                          background: '#ffffff',
                          border: '1px solid #f1f5f9',
                          borderRadius: 10,
                          marginBottom: group.jdAnalyses.length > 0 ? 12 : 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => router.push(`/result/${group.resume.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                          e.currentTarget.style.borderColor = '#e4e4e7'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.borderColor = '#f1f5f9'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6
                          }}>
                            <span style={{
                              padding: '4px 10px',
                              background: '#18181b',
                              color: '#ffffff',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.02em'
                            }}>
                              이력서 분석
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              background: '#fafafa',
                              color: stageColors[group.resume.stage],
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                            }}>
                              {stageLabels[group.resume.stage]}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 14,
                            color: '#71717a',
                            letterSpacing: '-0.01em'
                          }}>
                            {group.resume.position}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: 11,
                            color: '#a1a1aa',
                            marginBottom: 4,
                            letterSpacing: '0'
                          }}>
                            적합도
                          </div>
                          <div style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: group.resume.score >= 70 ? '#10b981' : '#f59e0b',
                            letterSpacing: '-0.02em'
                          }}>
                            {group.resume.score}
                          </div>
                        </div>
                      </div>
                    )}

                    {group.jdAnalyses.map((jd: any, jdIdx: number) => (
                      <div
                        key={jdIdx}
                        style={{
                          padding: 16,
                          background: '#ffffff',
                          border: '1px solid #f1f5f9',
                          borderRadius: 10,
                          marginBottom: jdIdx < group.jdAnalyses.length - 1 ? 12 : 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => router.push(`/jd-result/${jd.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                          e.currentTarget.style.borderColor = '#e4e4e7'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.borderColor = '#f1f5f9'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 10
                        }}>
                          <span style={{
                            padding: '4px 10px',
                            background: '#8b5cf6',
                            color: '#ffffff',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.02em'
                          }}>
                            JD 분석
                          </span>
                        </div>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#18181b',
                          marginBottom: 4,
                          letterSpacing: '-0.01em'
                        }}>
                          {jd.position?.split(' - ')[0] || '회사명'}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: '#71717a',
                          marginBottom: 12,
                          letterSpacing: '-0.01em'
                        }}>
                          {jd.position}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: 12,
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          <div style={{
                            fontSize: 11,
                            color: '#a1a1aa',
                            letterSpacing: '0'
                          }}>
                            JD 적합도
                          </div>
                          <div style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: jd.score >= 70 ? '#10b981' : '#f59e0b',
                            letterSpacing: '-0.02em'
                          }}>
                            {jd.score}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  suffix,
  icon,
}: {
  title: string
  value: number
  suffix: string
  icon: string
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #f1f5f9',
        borderRadius: 16,
        padding: 32,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#fafafa'
        e.currentTarget.style.borderColor = '#e4e4e7'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#ffffff'
        e.currentTarget.style.borderColor = '#f1f5f9'
      }}
    >
      <div style={{
        fontSize: 28,
        marginBottom: 16
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 13,
        color: '#71717a',
        marginBottom: 12,
        fontWeight: 600,
        letterSpacing: '-0.01em'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 40,
        fontWeight: 700,
        color: '#18181b',
        letterSpacing: '-0.03em'
      }}>
        {value}
        <span style={{
          fontSize: 18,
          marginLeft: 6,
          color: '#a1a1aa',
          fontWeight: 600
        }}>
          {suffix}
        </span>
      </div>
    </div>
  )
}
