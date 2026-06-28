'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { HiringProcess, HiringProcessStage, HiringProcessStatus } from '@/types/hiring-process'
import { STAGE_LABELS, STAGE_COLORS, STATUS_LABELS } from '@/types/hiring-process'

export default function HiringProcessClient() {
  const [processes, setProcesses] = useState<HiringProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PASSED' | 'HIRED'>('ALL')

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
    active: processes.filter((p) => p.status === 'ACTIVE').length,
    passed: processes.filter((p) => p.status === 'PASSED').length,
    hired: processes.filter((p) => p.status === 'HIRED').length,
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <StatCard label="전체" value={stats.total} color="#a78bfa" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <StatCard label="진행 중" value={stats.active} color="#fbbf24" active={filter === 'ACTIVE'} onClick={() => setFilter('ACTIVE')} />
        <StatCard label="합격" value={stats.passed} color="#22d3ee" active={filter === 'PASSED'} onClick={() => setFilter('PASSED')} />
        <StatCard label="입사" value={stats.hired} color="#10b981" active={filter === 'HIRED'} onClick={() => setFilter('HIRED')} />
      </div>

      {/* 프로세스 목록 */}
      {filteredProcesses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            {filter === 'ALL' ? '채용 프로세스가 없습니다.' : `${STATUS_LABELS[filter]} 프로세스가 없습니다.`}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            이력서 분석 결과에서 채용 프로세스를 추가하세요.
          </p>
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

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
      transition: 'all 0.2s'
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{process.candidate_name}</h3>
            <span style={{
              padding: '4px 10px',
              background: stageColor + '20',
              color: stageColor,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              border: `1px solid ${stageColor}40`
            }}>
              {STAGE_LABELS[process.current_stage as HiringProcessStage]}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {process.company_name} • {process.position_title}
          </div>
        </div>
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

      {/* 프로세스 바 */}
      <div style={{ position: 'relative', height: '8px', background: 'var(--border)', borderRadius: '4px', marginBottom: '12px' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${progress}%`,
          background: stageColor,
          borderRadius: '4px',
          transition: 'width 0.3s'
        }} />
      </div>

      {/* 단계 표시 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
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
        </div>
      )}
    </div>
  )
}
