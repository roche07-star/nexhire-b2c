'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Application {
  id: string
  company: string
  position: string
  status: string
  headhunter_status: 'self' | 'requested' | 'assigned'
  headhunter_name?: string
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
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requesting, setRequesting] = useState(false)

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

  async function handleRequestHelp() {
    if (!selectedApp || !requestMessage.trim()) {
      alert('메시지를 입력해주세요.')
      return
    }

    setRequesting(true)
    try {
      const res = await fetch(`/api/job-applications/${selectedApp.id}/request-help`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: requestMessage })
      })

      const result = await res.json()

      if (res.ok) {
        alert('헤드헌터 요청이 접수되었습니다!')
        setShowRequestModal(false)
        setRequestMessage('')
        setSelectedApp(null)
        loadDashboard()
      } else {
        alert(result.error || '요청 실패')
      }
    } catch (error) {
      console.error('요청 실패:', error)
      alert('요청 중 오류가 발생했습니다.')
    } finally {
      setRequesting(false)
    }
  }

  function getStatusColor(status: 'self' | 'requested' | 'assigned') {
    switch (status) {
      case 'self': return { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', icon: '💚', label: '혼자 진행 중' }
      case 'requested': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '🆘', label: '헤드헌터 요청됨' }
      case 'assigned': return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: '👤', label: '헤드헌터 배정됨' }
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
    <>
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

        {/* 지원 중인 회사 (신호등 시스템) */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 'clamp(15px, 4vw, 16px)', fontWeight: 600 }}>🚦 지원 중인 회사</div>
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
              {data.applications.slice(0, 10).map(app => {
                const color = getStatusColor(app.headhunter_status)
                return (
                  <div
                    key={app.id}
                    style={{
                      padding: 'clamp(10px, 3vw, 14px)',
                      borderRadius: 8,
                      background: color.bg,
                      border: `1.5px solid ${color.border}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', flexShrink: 0 }}>{color.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 2 }}>
                          {app.company}
                        </div>
                        <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted2)' }}>
                          {app.position} · {app.status}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      padding: '3px 8px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.6)',
                      fontSize: 'clamp(9px, 2.5vw, 10px)',
                      fontWeight: 600,
                      color: color.border,
                      marginBottom: app.headhunter_status !== 'self' ? 8 : 0
                    }}>
                      {color.label}
                    </div>

                    {app.headhunter_status === 'self' && (
                      <button
                        className="btn btn-ghost"
                        style={{ width: '100%', fontSize: 'clamp(11px, 3vw, 12px)', marginTop: 8, padding: '8px' }}
                        onClick={() => {
                          setSelectedApp(app)
                          setShowRequestModal(true)
                        }}
                      >
                        🆘 헤드헌터 도움 요청하기
                      </button>
                    )}

                    {app.headhunter_status === 'requested' && (
                      <div style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--muted)' }}>
                        헤드헌터가 할당되면 연락 드립니다
                      </div>
                    )}

                    {app.headhunter_status === 'assigned' && app.headhunter_name && (
                      <div style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>
                        <div style={{ color: 'var(--text)' }}>
                          👤 헤드헌터: <strong>{app.headhunter_name}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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

      {/* 헤드헌터 요청 모달 */}
      {showRequestModal && selectedApp && (
        <div className="overlay" onClick={() => !requesting && setShowRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: '90%' }}>
            <div className="modal-header">
              <div className="modal-title">헤드헌터에게 도움 요청</div>
              <button className="modal-close" onClick={() => setShowRequestModal(false)} disabled={requesting}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {selectedApp.company} · {selectedApp.position}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{selectedApp.status}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                어떤 도움이 필요하신가요? *
              </label>
              <textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                placeholder="예: 면접 준비 도와주세요&#10;예: 이력서 검토 부탁드립니다"
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  borderRadius: 8,
                  border: '2px solid var(--border)',
                  fontSize: 13,
                  resize: 'vertical'
                }}
                disabled={requesting}
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 16 }}>
              • 요청 제한: 플랜별 상이 (FREE: 1회/월, PRO: 3회/월, EXPERT: 무제한)
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowRequestModal(false)} disabled={requesting} style={{ flex: 1 }}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleRequestHelp} disabled={requesting || !requestMessage.trim()} style={{ flex: 1 }}>
                {requesting ? '요청 중...' : '요청하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
