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
}

export default function DashboardClient({ userEmail, userPlan }: DashboardClientProps) {
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

      // 방어적 코드: recentActivity가 없으면 빈 배열로 초기화
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
    pending: '#64748b',
    screening: '#3b82f6',
    interview: '#8b5cf6',
    final: '#f97316',
    completed: '#22c55e',
  }

  if (loading) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={fetchStats}
          style={{
            marginTop: 20,
            padding: '8px 16px',
            background: '#e8ff47',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
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
      padding: '80px 20px 40px',
      maxWidth: 1200,
      margin: '0 auto',
      background: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>PRO 대시보드</h1>
        <p style={{ color: '#666', fontSize: 16 }}>
          {userEmail} · {userPlan} 플랜
        </p>
      </div>

      {/* 통계 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 40,
        }}
      >
        <StatCard
          title="총 후보자"
          value={stats.totalCandidates}
          suffix="명"
          color="#3b82f6"
        />
        <StatCard
          title="이번 달 분석"
          value={stats.thisMonthAnalyses}
          suffix="건"
          color="#8b5cf6"
        />
        <StatCard
          title="평균 적합도"
          value={stats.avgScore}
          suffix="점"
          color="#f97316"
        />
      </div>

      {/* 파이프라인 현황 */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 40,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 20, color: '#1a1a1a', fontWeight: 600 }}>파이프라인 현황</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(stats.pipelineCounts).map(([stage, count]) => (
            <div
              key={stage}
              style={{
                flex: '1 1 140px',
                background: stageColors[stage] + '10',
                border: `2px solid ${stageColors[stage]}`,
                borderRadius: 8,
                padding: '16px 12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: '#666',
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {stageLabels[stage]}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: stageColors[stage],
                }}
              >
                {count}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/pipeline')}
          style={{
            marginTop: 20,
            padding: '12px 24px',
            background: '#1a1a14',
            color: '#e8ff47',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 15,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2a2a24'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1a1a14'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          파이프라인 관리 →
        </button>
      </div>

      {/* 최근 활동 */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 20, color: '#1a1a1a', fontWeight: 600 }}>최근 활동</h2>
        {stats.recentActivity.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            아직 분석한 이력서가 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(() => {
              // 동일인 그룹화
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
                      padding: 16,
                      background: isJustCompleted ? '#f0fdf4' : '#fafafa',
                      border: isJustCompleted ? '2px solid #22c55e' : '1px solid #f0f0f0',
                      borderRadius: 8,
                    }}
                  >
                    {/* 이름 */}
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {group.name}
                      {isJustCompleted && (
                        <span style={{
                          padding: '2px 8px',
                          background: '#22c55e',
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          완료!
                        </span>
                      )}
                    </div>

                    {/* 이력서 분석 */}
                    {group.resume && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          background: '#fff',
                          borderRadius: 6,
                          marginBottom: group.jdAnalyses.length > 0 ? 8 : 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => router.push(`/result/${group.resume.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f5f5f5'
                          e.currentTarget.style.transform = 'translateX(2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span>📄</span>
                            <span style={{
                              padding: '2px 8px',
                              background: '#3b82f6',
                              color: '#fff',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              이력서 분석
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              background: stageColors[group.resume.stage] + '20',
                              color: stageColors[group.resume.stage],
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}>
                              {stageLabels[group.resume.stage]}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, color: '#666' }}>
                            {group.resume.position}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>직무 적합도</div>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: group.resume.score >= 70 ? '#10b981' : '#f59e0b',
                          }}>
                            {group.resume.score}점
                          </div>
                        </div>
                      </div>
                    )}

                    {/* JD 분석들 */}
                    {group.jdAnalyses.map((jd: any, jdIdx: number) => (
                      <div
                        key={jdIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          background: '#fff',
                          borderRadius: 6,
                          marginBottom: jdIdx < group.jdAnalyses.length - 1 ? 8 : 0,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span>📋</span>
                            <span style={{
                              padding: '2px 8px',
                              background: '#8b5cf6',
                              color: '#fff',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              JD 분석
                            </span>
                          </div>
                          <div style={{ fontSize: 14, color: '#666' }}>
                            {jd.position}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>JD 적합도</div>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: jd.score >= 70 ? '#10b981' : '#f59e0b',
                          }}>
                            {jd.score}점
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
  color,
}: {
  title: string
  value: number
  suffix: string
  color: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color }}>
        {value}
        <span style={{ fontSize: 18, marginLeft: 4, color: '#666' }}>{suffix}</span>
      </div>
    </div>
  )
}
