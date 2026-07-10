'use client'

import { useState, useEffect } from 'react'
import type { PipelineCandidate, PipelineStage } from '@/types/pipeline'
import { PIPELINE_STAGE_ORDER, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '@/types/pipeline'

interface PipelineClientProps {
  userEmail: string
  userPlan: string
}

export default function PipelineClient({ userEmail, userPlan }: PipelineClientProps) {
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingCandidate, setAddingCandidate] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    try {
      const res = await fetch('/api/pipeline')
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.candidates || [])
      }
    } catch (e) {
      console.error('Failed to fetch candidates:', e)
    } finally {
      setLoading(false)
    }
  }

  async function moveCandidate(candidateId: string, newStage: PipelineStage) {
    try {
      const res = await fetch(`/api/pipeline/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      })

      if (res.ok) {
        const data = await res.json()
        setCandidates(candidates.map(c => c.id === candidateId ? data.candidate : c))
      }
    } catch (e) {
      console.error('Failed to move candidate:', e)
    }
  }

  async function deleteCandidate(candidateId: string) {
    if (!confirm('이 후보자를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/pipeline/${candidateId}`, { method: 'DELETE' })
      if (res.ok) {
        setCandidates(candidates.filter(c => c.id !== candidateId))
        setShowDetailModal(false)
      }
    } catch (e) {
      console.error('Failed to delete candidate:', e)
    }
  }

  async function addPassedCandidate(formData: FormData) {
    setAddingCandidate(true)
    try {
      const data = {
        candidate_name: formData.get('candidate_name'),
        company_name: formData.get('company_name'),
        position_title: formData.get('position_title'),
        hired_date: formData.get('hired_date'),
        fee: formData.get('fee'),
        salary: formData.get('salary'),
        stage: 'PASSED'
      }

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        const result = await res.json()
        setCandidates([...candidates, result.candidate])
        setShowAddModal(false)
      } else {
        alert('후보자 추가 실패')
      }
    } catch (e) {
      console.error('Failed to add candidate:', e)
      alert('후보자 추가 실패')
    } finally {
      setAddingCandidate(false)
    }
  }

  // 단계별로 후보자 그룹화
  const candidatesByStage = PIPELINE_STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = candidates.filter(c => c.stage === stage)
    return acc
  }, {} as Record<PipelineStage, PipelineCandidate[]>)

  // 통계
  const stats = {
    total: candidates.length,
    active: candidates.filter(c => !['PASSED', 'FAILED'].includes(c.stage)).length,
    passed: candidates.filter(c => c.stage === 'PASSED').length,
    failed: candidates.filter(c => c.stage === 'FAILED').length,
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: 16, color: 'var(--muted)' }}>로딩 중...</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 20px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            📊 채용 파이프라인
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            후보자를 단계별로 관리하고 진행 상황을 추적하세요.
          </p>
        </div>

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          <StatCard label="전체" value={stats.total} color="#a78bfa" />
          <StatCard label="진행 중" value={stats.active} color="#fbbf24" />
          <StatCard label="합격" value={stats.passed} color="#10b981" />
          <StatCard label="불합격" value={stats.failed} color="#ef4444" />
        </div>

        {/* 칸반 보드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${PIPELINE_STAGE_ORDER.length}, minmax(280px, 1fr))`,
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 20
        }}>
          {PIPELINE_STAGE_ORDER.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              candidates={candidatesByStage[stage]}
              onMove={moveCandidate}
              onSelect={(c) => {
                setSelectedCandidate(c)
                setShowDetailModal(true)
              }}
              onAddClick={stage === 'PASSED' ? () => setShowAddModal(true) : undefined}
            />
          ))}
        </div>

        {/* 상세 모달 */}
        {showDetailModal && selectedCandidate && (
          <CandidateDetailModal
            candidate={selectedCandidate}
            onClose={() => setShowDetailModal(false)}
            onMove={moveCandidate}
            onDelete={deleteCandidate}
            onUpdate={(updatedCandidate) => {
              setCandidates(candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c))
              setSelectedCandidate(updatedCandidate)
            }}
          />
        )}

        {/* 합격 후보자 추가 모달 */}
        {showAddModal && (
          <AddCandidateModal
            onClose={() => setShowAddModal(false)}
            onSubmit={addPassedCandidate}
            isSubmitting={addingCandidate}
          />
        )}
      </div>
    </div>
  )
}

// 통계 카드
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

// 단계 컬럼
function StageColumn({
  stage,
  candidates,
  onMove,
  onSelect,
  onAddClick
}: {
  stage: PipelineStage
  candidates: PipelineCandidate[]
  onMove: (id: string, stage: PipelineStage) => void
  onSelect: (candidate: PipelineCandidate) => void
  onAddClick?: () => void
}) {
  const color = PIPELINE_STAGE_COLORS[stage]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      minHeight: 400
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `2px solid ${color}`
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          {PIPELINE_STAGE_LABELS[stage]}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: color,
            color: '#000',
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 12
          }}>
            {candidates.length}
          </div>
          {onAddClick && (
            <button
              onClick={onAddClick}
              style={{
                background: color,
                color: '#000',
                border: 'none',
                borderRadius: 8,
                width: 24,
                height: 24,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="후보자 추가"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* 후보자 카드들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {candidates.map(candidate => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onClick={() => onSelect(candidate)}
          />
        ))}
        {candidates.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: 'var(--muted)',
            fontSize: 14
          }}>
            후보자 없음
          </div>
        )}
      </div>
    </div>
  )
}

// 후보자 카드
function CandidateCard({ candidate, onClick }: { candidate: PipelineCandidate; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
        {candidate.candidate_name}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
        {candidate.company_name}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted2)' }}>
        {candidate.position_title}
      </div>
      {candidate.fit_score && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
          매칭: {candidate.fit_score}점
        </div>
      )}
      {candidate.notes && (
        <div style={{
          marginTop: 8,
          padding: 8,
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--muted)',
          lineHeight: 1.4
        }}>
          📝 {candidate.notes.length > 50 ? candidate.notes.slice(0, 50) + '...' : candidate.notes}
        </div>
      )}
    </div>
  )
}

// 상세 모달
function CandidateDetailModal({
  candidate,
  onClose,
  onMove,
  onDelete,
  onUpdate
}: {
  candidate: PipelineCandidate
  onClose: () => void
  onMove: (id: string, stage: PipelineStage) => void
  onDelete: (id: string) => void
  onUpdate: (candidate: PipelineCandidate) => void
}) {
  const [notes, setNotes] = useState(candidate.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesMessage, setNotesMessage] = useState('')
  const [showPassedModal, setShowPassedModal] = useState(false)
  const [movingToPassed, setMovingToPassed] = useState(false)

  async function handleSaveNotes() {
    setIsSavingNotes(true)
    setNotesMessage('')
    try {
      const res = await fetch(`/api/pipeline/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() })
      })

      if (res.ok) {
        const data = await res.json()
        onUpdate(data.candidate)
        setNotesMessage('메모가 저장되었습니다.')
        setTimeout(() => setNotesMessage(''), 2000)
      } else {
        setNotesMessage('저장 실패')
      }
    } catch (e) {
      console.error('Failed to save notes:', e)
      setNotesMessage('저장 실패')
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 32,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>
          {candidate.candidate_name}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <InfoRow label="회사" value={candidate.company_name} />
          <InfoRow label="포지션" value={candidate.position_title} />
          {candidate.fit_score && <InfoRow label="매칭 점수" value={`${candidate.fit_score}점`} />}
          <InfoRow label="현재 단계" value={PIPELINE_STAGE_LABELS[candidate.stage]} />
        </div>

        {/* 메모 입력 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
            📝 메모
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="후보자 관련 메모를 입력하세요..."
            style={{
              width: '100%',
              minHeight: 100,
              padding: 12,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              color: 'var(--text)',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {notes.length} / 1000자
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes || notes === (candidate.notes || '')}
              style={{
                padding: '6px 16px',
                background: '#a78bfa',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: isSavingNotes || notes === (candidate.notes || '') ? 'not-allowed' : 'pointer',
                opacity: isSavingNotes || notes === (candidate.notes || '') ? 0.5 : 1
              }}
            >
              {isSavingNotes ? '저장 중...' : '메모 저장'}
            </button>
          </div>
          {notesMessage && (
            <div style={{
              marginTop: 8,
              padding: 8,
              background: notesMessage.includes('실패') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${notesMessage.includes('실패') ? '#ef4444' : '#10b981'}`,
              borderRadius: 6,
              fontSize: 12,
              color: notesMessage.includes('실패') ? '#ef4444' : '#10b981',
              textAlign: 'center'
            }}>
              {notesMessage}
            </div>
          )}
        </div>

        {/* 단계 이동 버튼들 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
            단계 이동
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PIPELINE_STAGE_ORDER.map(stage => (
              <button
                key={stage}
                onClick={() => {
                  if (stage === 'PASSED' && candidate.stage !== 'PASSED') {
                    setShowPassedModal(true)
                  } else {
                    onMove(candidate.id, stage)
                    onClose()
                  }
                }}
                disabled={stage === candidate.stage}
                style={{
                  padding: '8px 16px',
                  background: stage === candidate.stage ? PIPELINE_STAGE_COLORS[stage] : 'var(--bg)',
                  color: stage === candidate.stage ? '#fff' : 'var(--text)',
                  border: `1px solid ${PIPELINE_STAGE_COLORS[stage]}`,
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: stage === candidate.stage ? 'not-allowed' : 'pointer',
                  opacity: stage === candidate.stage ? 1 : 0.7
                }}
              >
                {PIPELINE_STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
          <button
            onClick={() => onDelete(candidate.id)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#ef4444',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 합격 이동 모달 */}
      {showPassedModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPassedModal(false)
            }
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: 12,
              padding: 24,
              width: '90%',
              maxWidth: 400,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>
              합격 정보 입력
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setMovingToPassed(true)

                const form = e.currentTarget
                const hiredDate = (form.elements.namedItem('hired_date') as HTMLInputElement).value
                const fee = (form.elements.namedItem('fee') as HTMLInputElement).value
                const salary = (form.elements.namedItem('salary') as HTMLInputElement).value

                try {
                  const res = await fetch(`/api/pipeline/${candidate.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      stage: 'PASSED',
                      hired_date: hiredDate || null,
                      fee: fee ? parseFloat(fee) : null,
                      salary: salary ? parseInt(salary) : null
                    })
                  })

                  if (res.ok) {
                    const data = await res.json()
                    onUpdate(data.candidate)
                    setShowPassedModal(false)
                    onClose()
                  } else {
                    alert('합격 이동에 실패했습니다.')
                  }
                } catch (e) {
                  console.error('Failed to move to PASSED:', e)
                  alert('합격 이동에 실패했습니다.')
                } finally {
                  setMovingToPassed(false)
                }
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>
                    입사일 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="hired_date"
                    required
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>
                    수수료 (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="fee"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="예: 20"
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>
                    처우 / 연봉 (만원) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="salary"
                    min="0"
                    required
                    placeholder="예: 5000"
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 14,
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowPassedModal(false)}
                  disabled={movingToPassed}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: movingToPassed ? 'not-allowed' : 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={movingToPassed}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#10b981',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: movingToPassed ? 'not-allowed' : 'pointer',
                    opacity: movingToPassed ? 0.6 : 1
                  }}
                >
                  {movingToPassed ? '이동 중...' : '합격 처리'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

// 합격 후보자 추가 모달
function AddCandidateModal({
  onClose,
  onSubmit,
  isSubmitting
}: {
  onClose: () => void
  onSubmit: (formData: FormData) => void
  isSubmitting: boolean
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>
          합격 후보자 추가
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {/* 후보자 이름 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                후보자 이름 *
              </label>
              <input
                type="text"
                name="candidate_name"
                required
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              />
            </div>

            {/* 채용사 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                채용사 *
              </label>
              <input
                type="text"
                name="company_name"
                required
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              />
            </div>

            {/* 포지션 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                포지션 *
              </label>
              <input
                type="text"
                name="position_title"
                required
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              />
            </div>

            {/* 입사일 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                입사일
              </label>
              <input
                type="date"
                name="hired_date"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              />
            </div>

            {/* 수수료 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                수수료 (%)
              </label>
              <input
                type="number"
                name="fee"
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              />
            </div>

            {/* 처우(연봉) */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                처우(연봉) (만원)
              </label>
              <input
                type="number"
                name="salary"
                min="0"
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text)'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                background: '#10b981',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              {isSubmitting ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
