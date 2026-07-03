'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { HiringProcess, HiringProcessStage, HiringProcessStatus } from '@/types/hiring-process'
import { STAGE_LABELS, STAGE_COLORS, STATUS_LABELS } from '@/types/hiring-process'

export default function HiringProcessClient() {
  const { data: session } = useSession()
  const [processes, setProcesses] = useState<HiringProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PASSED' | 'HIRED'>('ALL')

  const plan = session?.user?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'EXPERT'

  useEffect(() => {
    fetchProcesses()
  }, [])

  async function fetchProcesses() {
    try {
      const res = await fetch('/api/hiring-process')
      if (res.ok) {
        const data = await res.json()
        setProcesses(data.processes || [])
      }
    } catch (e) {
      console.error('Failed to fetch processes:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredProcesses = processes.filter((p) => {
    if (filter === 'ALL') return true
    return p.status === filter
  })

  const stats = {
    total: processes.length,
    active: processes.filter((p) => p.current_stage <= 4 && p.status !== 'FAILED').length,
    passed: processes.filter((p) => p.current_stage === 5).length,
    hired: processes.filter((p) => p.current_stage === 6).length,
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: '16px', color: 'var(--muted)' }}>로딩 중...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          📊 채용 프로세스 관리
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          후보자별 진행 상황을 추적하고 다음 액션을 관리하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '32px'
      }}>
        <StatCard label="전체" value={stats.total} color="#a78bfa" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <StatCard label="진행 중" value={stats.active} color="#fbbf24" active={filter === 'ACTIVE'} onClick={() => setFilter('ACTIVE')} />
        <StatCard label="합격" value={stats.passed} color="#22d3ee" active={filter === 'PASSED'} onClick={() => setFilter('PASSED')} />
        <StatCard label="입사" value={stats.hired} color="#10b981" active={filter === 'HIRED'} onClick={() => setFilter('HIRED')} />
      </div>

      {/* 다가오는 일정 */}
      {(() => {
        const upcoming = processes
          .filter(p => p.next_action_date && p.status === 'ACTIVE')
          .sort((a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime())
          .slice(0, 3)

        if (upcoming.length === 0) return null

        return (
          <div style={{ marginBottom: '32px', padding: '20px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#fbbf24' }}>📅 다가오는 일정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcoming.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '24px' }}>📌</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.candidate_name} · {p.company_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{p.next_action}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24' }}>
                    {new Date(p.next_action_date!).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* 프로세스 목록 */}
      {filteredProcesses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          {!isPro ? (
            // FREE 사용자: 자물쇠 + PRO 전용 안내
            <>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</p>
              <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#fbbf24' }}>
                PRO 플랜 전용 기능
              </p>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
                채용 프로세스 관리는 PRO 이상 플랜에서 이용 가능합니다.
              </p>
              <a
                href="/#pricing"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#000',
                  borderRadius: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                }}
              >
                PRO 플랜 업그레이드 →
              </a>
            </>
          ) : (
            // PRO 이상: 기존 안내
            <>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
              <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                {filter === 'ALL' ? '채용 프로세스가 없습니다.' : `${STATUS_LABELS[filter]} 프로세스가 없습니다.`}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                이력서 분석 결과에서 채용 프로세스를 추가하세요.
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProcesses.map((process) => (
            <ProcessCard key={process.id} process={process} onUpdate={fetchProcesses} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  active,
  onClick
}: {
  label: string
  value: number
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}20` : 'var(--surface)',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 700, color }}>{value}</div>
    </button>
  )
}

function ProcessCard({ process, onUpdate }: { process: HiringProcess; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const stageColor = STAGE_COLORS[process.current_stage as HiringProcessStage]
  const progress = (process.current_stage / 6) * 100

  async function updateStage(newStage: HiringProcessStage) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/hiring-process/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_stage: newStage })
      })
      if (res.ok) {
        onUpdate()
      }
    } catch (e) {
      console.error('Failed to update stage:', e)
    } finally {
      setUpdating(false)
    }
  }

  async function updateStatus(newStatus: HiringProcessStatus) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/hiring-process/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        onUpdate()
      }
    } catch (e) {
      console.error('Failed to update status:', e)
    } finally {
      setUpdating(false)
    }
  }

  async function deleteProcess() {
    if (!confirm(`${process.candidate_name} 후보자를 삭제하시겠습니까?`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/hiring-process/${process.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        onUpdate()
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (e) {
      console.error('Failed to delete process:', e)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
      transition: 'all 0.2s'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {/* 후보자 이름 - 강조 표시 */}
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '16px',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: '8px',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>👤</span>
          <span>{process.candidate_name}</span>
          <span style={{
            padding: '4px 10px',
            background: stageColor + '20',
            color: stageColor,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            border: `1px solid ${stageColor}40`,
            marginLeft: 'auto'
          }}>
            {STAGE_LABELS[process.current_stage as HiringProcessStage]}
          </span>
        </div>

        {/* 회사명 • 포지션 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0'
        }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
            🏢 {process.company_name} • {process.position_title}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={deleteProcess}
            disabled={deleting}
            title="후보자 삭제"
            style={{
              padding: '8px 12px',
              background: deleting ? 'var(--surface2)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#ef4444',
              fontWeight: 600,
              opacity: deleting ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!deleting) {
                e.currentTarget.style.background = '#ef444410'
                e.currentTarget.style.borderColor = '#ef4444'
              }
            }}
            onMouseLeave={(e) => {
              if (!deleting) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border)'
              }
            }}
          >
            {deleting ? '삭제 중...' : '×'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '8px 16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {expanded ? '▲' : '▼'}
          </button>
          </div>
        </div>
      </div>

      {/* 프로세스 섹션 */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {/* 프로세스 바 */}
        <div style={{ position: 'relative', height: '10px', background: 'var(--border)', borderRadius: '5px', marginBottom: '16px' }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: stageColor,
            borderRadius: '5px',
            transition: 'width 0.3s',
            boxShadow: `0 0 10px ${stageColor}40`
          }} />
        </div>

        {/* 단계 표시 */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[0, 1, 2, 3, 4, 5, 6].map((stage) => (
          <span key={stage} style={{
            fontSize: '11px',
            color: stage <= process.current_stage ? stageColor : 'var(--muted)',
            fontWeight: stage <= process.current_stage ? 600 : 400
          }}>
            {STAGE_LABELS[stage as HiringProcessStage]}
          </span>
        ))}
        </div>
      </div>

      {/* 다음 액션 */}
      {process.next_action && (
        <div style={{
          padding: '12px',
          background: 'var(--surface2)',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: expanded ? '16px' : 0
        }}>
          <span style={{ color: 'var(--muted2)' }}>다음 액션:</span>{' '}
          <span style={{ fontWeight: 600 }}>{process.next_action}</span>
          {process.next_action_date && (
            <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>
              ({new Date(process.next_action_date).toLocaleDateString('ko-KR')})
            </span>
          )}
        </div>
      )}

      {/* 확장 영역 */}
      {expanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>단계 변경</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[0, 1, 2, 3, 4, 5, 6].map((stage) => (
              <button
                key={stage}
                onClick={() => updateStage(stage as HiringProcessStage)}
                disabled={updating || stage === process.current_stage}
                style={{
                  padding: '8px 16px',
                  background: stage === process.current_stage ? stageColor + '20' : 'var(--surface2)',
                  border: `1px solid ${stage === process.current_stage ? stageColor : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: stage === process.current_stage ? 'default' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: stage === process.current_stage ? stageColor : 'var(--text)',
                  opacity: updating ? 0.5 : 1
                }}
              >
                {STAGE_LABELS[stage as HiringProcessStage]}
              </button>
            ))}
            <div style={{
              width: '1px',
              height: '32px',
              background: 'var(--border)',
              margin: '0 4px'
            }} />
            <button
              onClick={() => updateStatus('FAILED')}
              disabled={updating || process.status === 'FAILED'}
              style={{
                padding: '8px 16px',
                background: process.status === 'FAILED' ? '#ef444420' : 'var(--surface2)',
                border: `1px solid ${process.status === 'FAILED' ? '#ef4444' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: process.status === 'FAILED' ? 'default' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: process.status === 'FAILED' ? '#ef4444' : 'var(--text)',
                opacity: updating ? 0.5 : 1
              }}
            >
              불합격
            </button>
          </div>

          {/* 다음 일정 설정 */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>다음 일정 설정</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--muted2)' }}>다음 액션</label>
                <select
                  defaultValue={process.next_action || (() => {
                    // 현재 단계에 따라 다음 단계 자동 설정
                    const nextStageMap: Record<HiringProcessStage, string> = {
                      0: '1차 면접',
                      1: '2차 면접',
                      2: '최종 면접',
                      3: '처우 협의',
                      4: '합격',
                      5: '입사',
                      6: ''
                    }
                    return nextStageMap[process.current_stage] || ''
                  })()}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val !== process.next_action) {
                      fetch(`/api/hiring-process/${process.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ next_action: val || null })
                      }).then(() => onUpdate())
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer' }}
                >
                  <option value="">선택 안함</option>
                  <option value="서류 준비">서류 준비</option>
                  <option value="서류 검토">서류 검토</option>
                  <option value="1차 면접">1차 면접</option>
                  <option value="1차 면접 준비">1차 면접 준비</option>
                  <option value="2차 면접">2차 면접</option>
                  <option value="2차 면접 준비">2차 면접 준비</option>
                  <option value="최종 면접">최종 면접</option>
                  <option value="최종 면접 준비">최종 면접 준비</option>
                  <option value="처우 협의">처우 협의</option>
                  <option value="합격 통보">합격 통보</option>
                  <option value="입사 준비">입사 준비</option>
                  <option value="입사">입사</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--muted2)' }}>일정 날짜</label>
                <input
                  type="date"
                  defaultValue={process.next_action_date?.split('T')[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    fetch(`/api/hiring-process/${process.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ next_action_date: val || null })
                    }).then(() => onUpdate())
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface2)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
