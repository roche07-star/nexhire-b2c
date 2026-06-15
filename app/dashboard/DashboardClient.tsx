'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    pending: '#94a3b8',
    screening: '#60a5fa',
    interview: '#a78bfa',
    final: '#f59e0b',
    completed: '#10b981',
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
    <main style={{ padding: '80px 20px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>PRO 대시보드</h1>
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
          color="#60a5fa"
        />
        <StatCard
          title="이번 달 분석"
          value={stats.thisMonthAnalyses}
          suffix="건"
          color="#a78bfa"
        />
        <StatCard
          title="평균 적합도"
          value={stats.avgScore}
          suffix="점"
          color="#f59e0b"
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
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>파이프라인 현황</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(stats.pipelineCounts).map(([stage, count]) => (
            <div
              key={stage}
              style={{
                flex: '1 1 140px',
                background: stageColors[stage] + '15',
                border: `2px solid ${stageColors[stage]}`,
                borderRadius: 8,
                padding: '16px 12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: '#666',
                  marginBottom: 8,
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
            padding: '10px 20px',
            background: '#e8ff47',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
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
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>최근 활동</h2>
        {stats.recentActivity.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            아직 분석한 이력서가 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/result/${activity.id}`)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {activity.name}
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
            ))}
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
      }}
    >
      <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color }}>
        {value}
        <span style={{ fontSize: 18, marginLeft: 4 }}>{suffix}</span>
      </div>
    </div>
  )
}
