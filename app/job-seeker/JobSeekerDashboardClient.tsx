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
  headhunter_status?: 'requested' | 'assigned' | null
  headhunter_name?: string
  headhunter_requested_at?: string
  headhunter_assigned_at?: string
  schedules?: Array<{
    id: string
    title: string
    schedule_at: string
    type: 'interview' | 'deadline' | 'other'
  }>
  created_at: string
}

interface Schedule {
  id: string
  title: string
  schedule_at: string
  type: 'interview' | 'deadline' | 'other'
}

interface MonthlyReport {
  month_of: string
  aggregated_html: string
  applied_to_analysis_id: string | null
}

interface DashboardData {
  upcomingSchedules: Schedule[]
  applications: Application[]
  monthlyReport: MonthlyReport | null
}

export default function JobSeekerDashboardClient() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  // 새 구직 요청 모달
  const [showNewJobRequestModal, setShowNewJobRequestModal] = useState(false)
  const [newJobRequest, setNewJobRequest] = useState({
    position: '',
    message: ''
  })
  const [creatingJobRequest, setCreatingJobRequest] = useState(false)

  // 일정 추가 모달
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState<Application | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    time: '',
    type: 'interview' as 'interview' | 'deadline' | 'other',
    title: ''
  })
  const [creatingSchedule, setCreatingSchedule] = useState(false)

  // 아이디어 모달
  const [showIdeasModal, setShowIdeasModal] = useState(false)
  const [ideas, setIdeas] = useState<string | null>(null)
  const [loadingIdeas, setLoadingIdeas] = useState(false)

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

  async function handleCreateJobRequest() {
    if (!newJobRequest.position.trim() || !newJobRequest.message.trim()) {
      alert('희망 포지션과 요청 메시지를 모두 입력해주세요.')
      return
    }

    setCreatingJobRequest(true)
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: '희망 회사 미정',
          position: newJobRequest.position.trim(),
          status: '구직 요청',
          headhunter_status: 'requested',
          request_message: newJobRequest.message.trim(),
          notes: '대시보드에서 직접 생성 (자동 요청)'
        })
      })

      if (res.ok) {
        alert('구직 요청이 접수되었습니다! 🔴\n헤드헌터 배정 후 연락드리겠습니다.')
        setShowNewJobRequestModal(false)
        setNewJobRequest({ position: '', message: '' })
        loadDashboard()
      } else {
        const error = await res.json()
        alert(error.error || '등록 실패')
      }
    } catch (error) {
      console.error('구직 요청 생성 실패:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setCreatingJobRequest(false)
    }
  }

  async function handleCreateSchedule() {
    if (!selectedAppForSchedule || !newSchedule.date || !newSchedule.time) {
      alert('날짜와 시간을 모두 입력해주세요.')
      return
    }

    setCreatingSchedule(true)
    try {
      const scheduleAt = new Date(`${newSchedule.date}T${newSchedule.time}`)
      const title = newSchedule.title.trim() ||
        `${selectedAppForSchedule.company} - ${newSchedule.type === 'interview' ? '면접' : newSchedule.type === 'deadline' ? '마감' : '일정'}`

      const res = await fetch('/api/job-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedAppForSchedule.id,
          title,
          schedule_at: scheduleAt.toISOString(),
          type: newSchedule.type
        })
      })

      if (res.ok) {
        alert('일정이 추가되었습니다! 📅')
        setShowScheduleModal(false)
        setNewSchedule({ date: '', time: '', type: 'interview', title: '' })
        setSelectedAppForSchedule(null)
        loadDashboard()
      } else {
        const error = await res.json()
        alert(error.error || '추가 실패')
      }
    } catch (error) {
      console.error('일정 추가 실패:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setCreatingSchedule(false)
    }
  }

  function getStatusColor(status: 'requested' | 'assigned') {
    switch (status) {
      case 'requested': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '🔴', label: '헤드헌터 요청됨' }
      case 'assigned': return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: '🔵', label: '헤드헌터 배정됨' }
    }
  }

  function getScheduleTypeText(type: 'interview' | 'deadline' | 'other') {
    switch (type) {
      case 'interview': return '면접'
      case 'deadline': return '마감'
      case 'other': return '일정'
    }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    if (!confirm('일정을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/job-schedules/${scheduleId}`, { method: 'DELETE' })
      if (res.ok) {
        alert('일정이 삭제되었습니다.')
        loadDashboard()
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('오류가 발생했습니다.')
    }
  }

  async function handleDeleteApplication(appId: string) {
    if (!confirm('지원 정보를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/job-applications/${appId}`, { method: 'DELETE' })
      if (res.ok) {
        alert('지원 정보가 삭제되었습니다.')
        loadDashboard()
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('오류가 발생했습니다.')
    }
  }

  async function handleGetIdeas(reportHtml: string, monthOf: string) {
    setShowIdeasModal(true)
    setIdeas(null)
    setLoadingIdeas(true)

    try {
      const res = await fetch('/api/work-report/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportHtml, monthOf })
      })

      if (res.ok) {
        const data = await res.json()
        setIdeas(data.ideas)
      } else {
        alert('아이디어 생성 실패')
        setShowIdeasModal(false)
      }
    } catch (error) {
      console.error('아이디어 생성 실패:', error)
      alert('오류가 발생했습니다.')
      setShowIdeasModal(false)
    } finally {
      setLoadingIdeas(false)
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

      {/* 다가올 일정 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 'clamp(15px, 4vw, 16px)', fontWeight: 600, marginBottom: 12 }}>📅 다가올 일정</div>
        {data.upcomingSchedules.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
            예정된 일정이 없습니다 😌
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.upcomingSchedules.map(schedule => {
              const scheduleDate = new Date(schedule.schedule_at)
              const month = scheduleDate.getMonth() + 1
              const day = scheduleDate.getDate()
              const hours = String(scheduleDate.getHours()).padStart(2, '0')
              const minutes = String(scheduleDate.getMinutes()).padStart(2, '0')

              return (
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'clamp(12px, 3.5vw, 13px)', fontWeight: 600, marginBottom: 2 }}>
                      {getScheduleTypeText(schedule.type)}: {month}월 {day}일 {hours}:{minutes}
                    </div>
                    <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {schedule.title}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: 4,
                      lineHeight: 1,
                      flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
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
            {data.applications.slice(0, 10).map(app => {
              // 구직 요청인지 직접 지원인지 구분
              const status = app.headhunter_status
              const isHeadhunterRequest = status === 'requested' || status === 'assigned'
              const color = isHeadhunterRequest && (status === 'requested' || status === 'assigned')
                ? getStatusColor(status)
                : null

              return (
                <div
                  key={app.id}
                  style={{
                    padding: 'clamp(10px, 3vw, 14px)',
                    borderRadius: 8,
                    background: color ? color.bg : 'var(--bg3)',
                    border: color ? `1.5px solid ${color.border}` : '1.5px solid var(--border)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!color) e.currentTarget.style.borderColor = 'var(--accent)'
                  }}
                  onMouseLeave={e => {
                    if (!color) e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    {color && (
                      <div style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', flexShrink: 0 }}>{color.icon}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, color: 'var(--accent)' }}>
                          {app.company}
                        </div>
                        {app.schedules && app.schedules.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {app.schedules.map(schedule => {
                              const scheduleDate = new Date(schedule.schedule_at)
                              const month = scheduleDate.getMonth() + 1
                              const day = scheduleDate.getDate()
                              const hours = String(scheduleDate.getHours()).padStart(2, '0')
                              const minutes = String(scheduleDate.getMinutes()).padStart(2, '0')
                              return (
                                <div
                                  key={schedule.id}
                                  style={{
                                    fontSize: 'clamp(9px, 2.5vw, 10px)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'var(--surface2)',
                                    color: 'var(--muted2)',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {getScheduleTypeText(schedule.type)}: {month}월 {day}일 {hours}:{minutes}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted2)' }}>
                        {app.position}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: 18,
                        padding: 4,
                        lineHeight: 1,
                        flexShrink: 0,
                        alignSelf: 'flex-start'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: color ? 8 : 0 }}>
                    {color && (
                      <div style={{
                        display: 'inline-flex',
                        padding: '3px 8px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.6)',
                        color: color.border,
                        fontSize: 'clamp(9px, 2.5vw, 10px)',
                        fontWeight: 600
                      }}>
                        {color.label}
                      </div>
                    )}
                    {!color && app.applied_at && (
                      <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', color: 'var(--muted2)' }}>
                        지원일: {new Date(app.applied_at).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>

                  {/* 일정 추가 버튼 */}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', fontSize: 'clamp(10px, 2.5vw, 11px)', marginTop: 8, padding: '6px' }}
                    onClick={() => {
                      setSelectedAppForSchedule(app)
                      setShowScheduleModal(true)
                    }}
                  >
                    📅 일정 추가
                  </button>

                  {/* 구직 요청 상태 표시 */}
                  {isHeadhunterRequest && app.headhunter_status === 'requested' && (
                    <div style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--muted)' }}>
                      헤드헌터가 할당되면 연락 드립니다
                    </div>
                  )}

                  {isHeadhunterRequest && app.headhunter_status === 'assigned' && app.headhunter_name && (
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
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 'clamp(15px, 4vw, 16px)', fontWeight: 600 }}>
                📝 업무 리포트
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: 'clamp(10px, 2.5vw, 11px)',
                  padding: '4px 8px',
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  fontWeight: 600
                }}
                onClick={() => handleGetIdeas(data.monthlyReport!.aggregated_html, data.monthlyReport!.month_of)}
              >
                추천 아이디어
              </button>
            </div>
            <div style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--muted2)' }}>
              {new Date(data.monthlyReport.month_of).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          <div style={{
            background: 'var(--bg3)',
            borderRadius: 8,
            padding: 'clamp(12px, 3vw, 16px)',
            marginBottom: 12
          }}>
            <div
              style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                lineHeight: 1.7,
                color: 'var(--text)'
              }}
              dangerouslySetInnerHTML={{ __html: data.monthlyReport.aggregated_html }}
            />
          </div>

          {!data.monthlyReport.applied_to_analysis_id && (
            <Link href="/analyze">
              <button className="btn btn-primary" style={{ width: '100%', fontSize: 'clamp(12px, 3.5vw, 14px)' }}>
                ✨ 이력서에 반영하기
              </button>
            </Link>
          )}
        </div>
      )}

      {/* 구직 요청하기 버튼 */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: 'clamp(13px, 3.5vw, 15px)', padding: 'clamp(10px, 3vw, 12px)' }}
          onClick={() => setShowNewJobRequestModal(true)}
        >
          🔴 구직 요청하기 (헤드헌터 도움)
        </button>
      </div>

      {/* 새 구직 요청 모달 */}
      {showNewJobRequestModal && (
        <div className="overlay" onClick={() => !creatingJobRequest && setShowNewJobRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: '90%' }}>
            <div className="modal-header">
              <div className="modal-title">🟢 구직 요청하기</div>
              <button className="modal-close" onClick={() => setShowNewJobRequestModal(false)} disabled={creatingJobRequest}>✕</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
              헤드헌터의 도움이 필요한 구직 활동을 등록하세요.<br />
              요청 후 전문 헤드헌터가 배정됩니다.
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                희망 포지션 *
              </label>
              <input
                type="text"
                value={newJobRequest.position}
                onChange={e => setNewJobRequest({ ...newJobRequest, position: e.target.value })}
                placeholder="예: 백엔드 개발자, 프론트엔드 개발자 등"
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '2px solid var(--border)',
                  fontSize: 13
                }}
                disabled={creatingJobRequest}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                요청 메시지 *
              </label>
              <textarea
                value={newJobRequest.message}
                onChange={e => setNewJobRequest({ ...newJobRequest, message: e.target.value })}
                placeholder="어떤 도움이 필요하신가요?&#10;예: 백엔드 개발자로 이직하고 싶습니다&#10;예: 면접 준비를 도와주세요"
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 10,
                  borderRadius: 8,
                  border: '2px solid var(--border)',
                  fontSize: 13,
                  resize: 'vertical'
                }}
                disabled={creatingJobRequest}
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 16 }}>
              💡 요청 후 🔴 상태로 표시되며, 헤드헌터 배정 시 연락드립니다.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowNewJobRequestModal(false)} disabled={creatingJobRequest} style={{ flex: 1 }}>
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateJobRequest}
                disabled={creatingJobRequest || !newJobRequest.position.trim() || !newJobRequest.message.trim()}
                style={{ flex: 1 }}
              >
                {creatingJobRequest ? '요청 중...' : '요청하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 추가 모달 */}
      {showScheduleModal && selectedAppForSchedule && (
        <div className="overlay" onClick={() => !creatingSchedule && setShowScheduleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: '90%' }}>
            <div className="modal-header">
              <div className="modal-title">📅 일정 추가</div>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)} disabled={creatingSchedule}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {selectedAppForSchedule.company} · {selectedAppForSchedule.position}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                일정 유형 *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'interview', label: '🎤 면접', color: '#3b82f6' },
                  { value: 'deadline', label: '⏰ 마감', color: '#ef4444' },
                  { value: 'other', label: '📌 기타', color: '#8b5cf6' }
                ].map(type => (
                  <button
                    key={type.value}
                    className="btn btn-ghost"
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: '8px',
                      border: newSchedule.type === type.value ? `2px solid ${type.color}` : '1px solid var(--border)',
                      background: newSchedule.type === type.value ? `${type.color}15` : 'transparent'
                    }}
                    onClick={() => setNewSchedule({ ...newSchedule, type: type.value as any })}
                    disabled={creatingSchedule}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                날짜 *
              </label>
              <input
                type="date"
                value={newSchedule.date}
                onChange={e => setNewSchedule({ ...newSchedule, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '2px solid var(--border)',
                  fontSize: 13
                }}
                disabled={creatingSchedule}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                시간 *
              </label>
              <input
                type="time"
                value={newSchedule.time}
                onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '2px solid var(--border)',
                  fontSize: 13
                }}
                disabled={creatingSchedule}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                제목 (선택)
              </label>
              <input
                type="text"
                value={newSchedule.title}
                onChange={e => setNewSchedule({ ...newSchedule, title: e.target.value })}
                placeholder="자동: 회사명 - 면접/마감/일정"
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '2px solid var(--border)',
                  fontSize: 13
                }}
                disabled={creatingSchedule}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowScheduleModal(false)} disabled={creatingSchedule} style={{ flex: 1 }}>
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSchedule}
                disabled={creatingSchedule || !newSchedule.date || !newSchedule.time}
                style={{ flex: 1 }}
              >
                {creatingSchedule ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 아이디어 모달 */}
      {showIdeasModal && (
        <div className="overlay" onClick={() => !loadingIdeas && setShowIdeasModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">추천 아이디어</div>
              <button className="modal-close" onClick={() => setShowIdeasModal(false)} disabled={loadingIdeas}>✕</button>
            </div>

            {loadingIdeas ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>AI가 분석 중입니다...</div>
              </div>
            ) : ideas ? (
              <div>
                {session?.user?.plan === 'FREE' ? (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: 'var(--text)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: 16
                    }}>
                      {ideas.substring(0, 200)}...
                    </div>
                    <div style={{
                      background: 'linear-gradient(180deg, transparent 0%, var(--surface) 100%)',
                      padding: '40px 20px 20px',
                      textAlign: 'center',
                      marginTop: -40
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        PRO 플랜에서 전체 아이디어 확인
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                        더 상세한 분석과 실행 가능한 아이디어를 받아보세요
                      </div>
                      <Link href="/pricing">
                        <button className="btn btn-primary" style={{ fontSize: 14 }}>
                          업그레이드 →
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: 'var(--text)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {ideas}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                아이디어를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
