'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Application {
  id: string
  company: string
  position: string
  status: string
  applied_at?: string
  created_at: string
}

interface Schedule {
  id: string
  title: string
  schedule_at: string
  type: string
}

interface MonthlyReport {
  month_of: string
  aggregated_html: string
  applied_to_analysis_id: string | null
}

interface DashboardData {
  todaySchedules: Schedule[]
  applications: Application[]
  monthlyReport: MonthlyReport | null
}

export default function JobSeekerDashboardClient() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const res = await fetch('/api/dashboard/job-seeker')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('대시보드 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </main>
    )
  }

  if (!data) return null

  const userName = session?.user?.name?.split(' ')[0] || '구직자'
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <main className="page" style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(16px, 4vw, 20px)' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: 6 }}>
          👋 안녕하세요, {userName}님
        </div>
        <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: 'var(--muted2)' }}>
          {today}
        </div>
      </div>

      {/* 오늘의 일정 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 'clamp(15px, 4vw, 16px)', fontWeight: 600, marginBottom: 12 }}>📅 오늘의 일정</div>
        {data.todaySchedules.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
            오늘은 일정이 없습니다 😌
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.todaySchedules.map(schedule => (
              <div
                key={schedule.id}
                style={{
                  padding: 'clamp(8px, 2vw, 10px) clamp(10px, 3vw, 12px)',
                  borderRadius: 8,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <div style={{ fontSize: 'clamp(14px, 4vw, 16px)', flexShrink: 0 }}>
                  {schedule.type === 'interview' ? '🎤' : schedule.type === 'deadline' ? '⏰' : '📌'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'clamp(12px, 3.5vw, 13px)', fontWeight: 600, marginBottom: 2 }}>
                    {new Date(schedule.schedule_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {schedule.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 지원 중인 회사 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 'clamp(15px, 4vw, 16px)', fontWeight: 600 }}>📋 지원 중인 회사</div>
          <Link href="/analyze">
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', padding: '6px 12px', whiteSpace: 'nowrap' }}>
              + 새 지원
            </button>
          </Link>
        </div>

        {data.applications.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ color: 'var(--muted)', marginBottom: 12, fontSize: 'clamp(12px, 3vw, 13px)' }}>
              첫 지원을 등록해보세요!
            </div>
            <Link href="/analyze">
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>
                이력서 분석부터 시작 →
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.applications.slice(0, 10).map(app => (
              <div
                key={app.id}
                style={{
                  padding: 'clamp(10px, 3vw, 14px)',
                  borderRadius: 8,
                  background: 'var(--bg3)',
                  border: '1.5px solid var(--border)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 4 }}>
                  {app.company}
                </div>
                <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted2)', marginBottom: 6 }}>
                  {app.position}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex',
                    padding: '3px 8px',
                    borderRadius: 10,
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 'clamp(9px, 2.5vw, 10px)',
                    fontWeight: 600
                  }}>
                    {app.status}
                  </div>
                  {app.applied_at && (
                    <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', color: 'var(--muted2)' }}>
                      지원일: {new Date(app.applied_at).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 월간 리포트 */}
      {data.monthlyReport && (
        <div className="card">
          <div style={{ fontSize: 'clamp(15px, 4vw, 16px)', fontWeight: 600, marginBottom: 12 }}>
            📝 업무 리포트 ({new Date(data.monthlyReport.month_of).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })})
          </div>
          <div
            style={{ fontSize: 'clamp(12px, 3vw, 13px)', lineHeight: 1.6, color: 'var(--muted)' }}
            dangerouslySetInnerHTML={{ __html: data.monthlyReport.aggregated_html }}
          />
          {!data.monthlyReport.applied_to_analysis_id && (
            <Link href="/analyze">
              <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', fontSize: 'clamp(12px, 3.5vw, 14px)' }}>
                ✨ 이력서에 반영하기
              </button>
            </Link>
          )}
        </div>
      )}
    </main>
  )
}
