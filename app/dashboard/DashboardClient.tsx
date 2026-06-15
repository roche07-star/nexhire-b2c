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
      setStats(data)
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentActivity.map((activity) => {
              const isJustCompleted = analysisState.completedIds?.includes(activity.id) || false
              const isJdAnalysis = activity.type === 'jd'
              const icon = isJdAnalysis ? '📋' : '📄'
              const typeLabel = isJdAnalysis ? 'JD 분석' : '이력서 분석'

              return (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: isJustCompleted ? '#f0fdf4' : '#fafafa',
                  border: isJustCompleted ? '2px solid #22c55e' : '1px solid #f0f0f0',
                  borderRadius: 8,
                  cursor: isJdAnalysis ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isJdAnalysis) {
                    e.currentTarget.style.background = isJustCompleted ? '#dcfce7' : '#f5f5f5'
                    e.currentTarget.style.borderColor = isJustCompleted ? '#22c55e' : '#e5e7eb'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isJdAnalysis) {
                    e.currentTarget.style.background = isJustCompleted ? '#f0fdf4' : '#fafafa'
                    e.currentTarget.style.borderColor = isJustCompleted ? '#22c55e' : '#f0f0f0'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
                onClick={() => {
                  if (!isJdAnalysis) {
                    router.push(`/result/${activity.id}`)
                  }
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{icon}</span>
                    {activity.name}
                    <span style={{
                      padding: '2px 8px',
                      background: isJdAnalysis ? '#8b5cf6' : '#3b82f6',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {typeLabel}
                    </span>
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
                  <div style={{ fontSize: 14, color: '#666' }}>
                    {activity.position}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {!isJdAnalysis && (
                    <div
                      style={{
                        padding: '4px 12px',
                        background: stageColors[activity.stage] + '20',
                        color: stageColors[activity.stage],
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {stageLabels[activity.stage]}
                    </div>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>
                      {isJdAnalysis ? 'JD 적합도' : '직무 적합도'}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: activity.score >= 70 ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {activity.score}점
                    </div>
                  </div>
                </div>
              </div>
            )})}
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
