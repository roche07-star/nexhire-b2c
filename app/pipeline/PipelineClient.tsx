'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Candidate {
  id: string
  name: string
  position: string
  score: number
  phone: string
  email: string
  stage: string
  createdAt: string
  notes: Array<{ id: string; note: string; created_at: string }>
  result?: any
}

interface PipelineClientProps {
  userEmail: string
  userPlan: string
}

export default function PipelineClient({ userEmail, userPlan }: PipelineClientProps) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [noteText, setNoteText] = useState('')
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const stages = [
    { value: 'all', label: '전체', color: '#64748b' },
    { value: 'pending', label: '접수', color: '#64748b' },
    { value: 'screening', label: '서류', color: '#3b82f6' },
    { value: 'interview', label: '면접', color: '#8b5cf6' },
    { value: 'final', label: '최종', color: '#f97316' },
    { value: 'completed', label: '완료', color: '#22c55e' },
  ]

  useEffect(() => {
    fetchCandidates()
  }, [])

  useEffect(() => {
    filterCandidates()
  }, [candidates, selectedStage, searchQuery])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/pipeline/list')

      if (!res.ok) {
        throw new Error('후보자 목록 조회에 실패했습니다.')
      }

      const data = await res.json()
      setCandidates(data.candidates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const filterCandidates = () => {
    let filtered = candidates

    // 단계 필터
    if (selectedStage !== 'all') {
      filtered = filtered.filter((c) => c.stage === selectedStage)
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.position.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      )
    }

    setFilteredCandidates(filtered)
  }

  const updateStage = async (candidateId: string, newStage: string) => {
    try {
      const res = await fetch('/api/pipeline/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: candidateId,
          stage: newStage,
        }),
      })

      if (!res.ok) {
        throw new Error('단계 변경에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, stage: newStage } : c
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : '단계 변경 실패')
    }
  }

  const deleteCandidate = async (candidateId: string) => {
    if (!confirm('이 후보자를 삭제하시겠습니까?\n분석 결과와 모든 메모가 함께 삭제됩니다.')) return

    try {
      const res = await fetch(`/api/pipeline/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: candidateId }),
      })

      if (!res.ok) {
        throw new Error('삭제에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
      setShowDetailModal(false)
      setSelectedCandidate(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  const updateName = async (candidateId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const res = await fetch('/api/pipeline/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: candidateId,
          name: newName.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error('이름 변경에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, name: newName.trim() } : c
        )
      )
      setEditingNameId(null)
      setEditingName('')
    } catch (err) {
      alert(err instanceof Error ? err.message : '이름 변경 실패')
    }
  }

  const addNote = async () => {
    if (!selectedCandidate || !noteText.trim()) return

    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: selectedCandidate.id,
          note: noteText.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error('메모 추가에 실패했습니다.')
      }

      const data = await res.json()

      // 로컬 상태 업데이트
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === selectedCandidate.id
            ? { ...c, notes: [...c.notes, data.note] }
            : c
        )
      )

      setNoteText('')
      setShowNoteModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '메모 추가 실패')
    }
  }

  const deleteNote = async (candidateId: string, noteId: string) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('메모 삭제에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) }
            : c
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : '메모 삭제 실패')
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center', background: '#fafafa', minHeight: '100vh' }}>
        <p>로딩 중...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center', background: '#fafafa', minHeight: '100vh' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={fetchCandidates}
          style={{
            marginTop: 20,
            padding: '8px 16px',
            background: '#1a1a14',
            color: '#e8ff47',
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

  return (
    <main style={{
      padding: '80px 20px 40px',
      maxWidth: 1400,
      margin: '0 auto',
      background: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>파이프라인 관리</h1>
          <p style={{ color: '#666', fontSize: 16 }}>
            총 {filteredCandidates.length}명의 후보자
          </p>
        </div>
        <Link href="/dashboard">
          <button style={{
            width: 40,
            height: 40,
            background: '#fff',
            color: '#666',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 24,
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            ✕
          </button>
        </Link>
      </div>

      {/* 검색 & 필터 */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* 검색 */}
        <input
          type="text"
          placeholder="이름, 직무, 이메일 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 300px',
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 15,
            background: '#fff',
          }}
        />

        {/* 단계 필터 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stages.map((stage) => (
            <button
              key={stage.value}
              onClick={() => setSelectedStage(stage.value)}
              style={{
                padding: '10px 16px',
                border: selectedStage === stage.value
                  ? `2px solid ${stage.color}`
                  : '1px solid #e5e7eb',
                borderRadius: 8,
                background: selectedStage === stage.value
                  ? stage.color + '15'
                  : '#fff',
                color: selectedStage === stage.value ? stage.color : '#666',
                fontWeight: selectedStage === stage.value ? 600 : 400,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* 후보자 리스트 */}
      {filteredCandidates.length === 0 ? (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <p style={{ color: '#666', fontSize: 16 }}>
            {searchQuery || selectedStage !== 'all'
              ? '검색 결과가 없습니다.'
              : '아직 분석한 이력서가 없습니다.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onUpdateStage={updateStage}
              onViewDetail={() => {
                setSelectedCandidate(candidate)
                setShowDetailModal(true)
              }}
              onAddNote={() => {
                setSelectedCandidate(candidate)
                setShowNoteModal(true)
              }}
              onDeleteNote={deleteNote}
              onDelete={deleteCandidate}
              editingNameId={editingNameId}
              editingName={editingName}
              onStartEditName={(id, name) => {
                setEditingNameId(id)
                setEditingName(name)
              }}
              onUpdateName={updateName}
              onCancelEditName={() => {
                setEditingNameId(null)
                setEditingName('')
              }}
              setEditingName={setEditingName}
            />
          ))}
        </div>
      )}

      {/* 메모 추가 모달 */}
      {showNoteModal && selectedCandidate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowNoteModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, marginBottom: 16, color: '#1a1a1a' }}>
              메모 추가 - {selectedCandidate.name}
            </h2>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="메모를 입력하세요 (최대 500자)"
              maxLength={500}
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              {noteText.length} / 500자
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={addNote}
                disabled={!noteText.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: noteText.trim() ? '#1a1a14' : '#e5e7eb',
                  color: noteText.trim() ? '#e8ff47' : '#999',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false)
                  setNoteText('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#fff',
                  color: '#666',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedCandidate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, margin: 0, color: '#1a1a1a' }}>분석 결과 상세</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ×
              </button>
            </div>

            {/* 후보자 정보 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>기본 정보</div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 15, color: '#333' }}>
                  <strong style={{ color: '#1a1a1a' }}>이름:</strong> {selectedCandidate.name || '미정'}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: 15, color: '#333' }}>
                  <strong style={{ color: '#1a1a1a' }}>직무:</strong> {selectedCandidate.position || '미정'}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: 15, color: '#333' }}>
                  <strong style={{ color: '#1a1a1a' }}>적합도:</strong>{' '}
                  <span style={{
                    fontWeight: 700,
                    color: selectedCandidate.score >= 70 ? '#22c55e' : selectedCandidate.score >= 50 ? '#f97316' : '#ef4444'
                  }}>
                    {selectedCandidate.score || 0}점
                  </span>
                </p>
                {selectedCandidate.email && (
                  <p style={{ margin: '0 0 8px 0', fontSize: 15, color: '#333' }}>
                    <strong style={{ color: '#1a1a1a' }}>이메일:</strong> {selectedCandidate.email}
                  </p>
                )}
                {selectedCandidate.phone && (
                  <p style={{ margin: '0', fontSize: 15, color: '#333' }}>
                    <strong style={{ color: '#1a1a1a' }}>전화:</strong> {selectedCandidate.phone}
                  </p>
                )}
              </div>
            </div>

            {/* 분석 요약 */}
            {selectedCandidate.result?.summary && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>📝 분석 요약</div>
                <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#1e40af', lineHeight: 1.6 }}>
                    {selectedCandidate.result.summary}
                  </p>
                </div>
              </div>
            )}

            {/* 강점 (상위 3개) */}
            {selectedCandidate.result?.strengths && selectedCandidate.result.strengths.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>✅ 주요 강점</div>
                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#15803d' }}>
                    {selectedCandidate.result.strengths.slice(0, 3).map((item: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: idx < 2 ? 8 : 0, fontSize: 14 }}>{item}</li>
                    ))}
                  </ul>
                  {selectedCandidate.result.strengths.length > 3 && (
                    <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#16a34a', fontStyle: 'italic' }}>
                      + {selectedCandidate.result.strengths.length - 3}개 더...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 개선점 (상위 3개) */}
            {selectedCandidate.result?.improvements && selectedCandidate.result.improvements.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>⚠️ 개선 필요</div>
                <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, border: '1px solid #fecaca' }}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#b91c1c' }}>
                    {selectedCandidate.result.improvements.slice(0, 3).map((item: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: idx < 2 ? 8 : 0, fontSize: 14 }}>{item}</li>
                    ))}
                  </ul>
                  {selectedCandidate.result.improvements.length > 3 && (
                    <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#dc2626', fontStyle: 'italic' }}>
                      + {selectedCandidate.result.improvements.length - 3}개 더...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 키워드 (상위 5개) */}
            {selectedCandidate.result?.keywords && selectedCandidate.result.keywords.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>🏷️ 핵심 키워드</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedCandidate.result.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#374151',
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                  {selectedCandidate.result.keywords.length > 5 && (
                    <span style={{ padding: '6px 12px', fontSize: 13, color: '#9ca3af' }}>
                      +{selectedCandidate.result.keywords.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  router.push(`/result/${selectedCandidate.id}`)
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#1a1a14',
                  color: '#e8ff47',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                전체 분석 보기
              </button>
              <button
                onClick={() => deleteCandidate(selectedCandidate.id)}
                style={{
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function CandidateCard({
  candidate,
  onUpdateStage,
  onViewDetail,
  onAddNote,
  onDeleteNote,
  onDelete,
  editingNameId,
  editingName,
  onStartEditName,
  onUpdateName,
  onCancelEditName,
  setEditingName,
}: {
  candidate: Candidate
  onUpdateStage: (id: string, stage: string) => void
  onViewDetail: () => void
  onAddNote: () => void
  onDeleteNote: (candidateId: string, noteId: string) => void
  onDelete: (candidateId: string) => void
  editingNameId: string | null
  editingName: string
  onStartEditName: (id: string, name: string) => void
  onUpdateName: (id: string, name: string) => void
  onCancelEditName: () => void
  setEditingName: (name: string) => void
}) {
  const stageColors: Record<string, string> = {
    pending: '#64748b',
    screening: '#3b82f6',
    interview: '#8b5cf6',
    final: '#f97316',
    completed: '#22c55e',
  }

  const stageLabels: Record<string, string> = {
    pending: '접수',
    screening: '서류',
    interview: '면접',
    final: '최종',
    completed: '완료',
  }

  const nextStages: Record<string, string[]> = {
    pending: ['screening', 'completed'],
    screening: ['interview', 'completed'],
    interview: ['final', 'completed'],
    final: ['completed'],
    completed: [],
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        {/* 후보자 정보 */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {editingNameId === candidate.id ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    padding: '4px 8px',
                    border: '2px solid #3b82f6',
                    borderRadius: 4,
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateName(candidate.id, editingName)
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => onUpdateName(candidate.id, editingName)}
                  style={{
                    padding: '4px 12px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  저장
                </button>
                <button
                  onClick={onCancelEditName}
                  style={{
                    padding: '4px 12px',
                    background: '#e5e7eb',
                    color: '#666',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0,
                    cursor: 'pointer',
                    color: '#1a1a1a',
                    minWidth: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onClick={() => onStartEditName(candidate.id, candidate.name)}
                  title="클릭하여 이름 수정"
                >
                  <span>📄</span>
                  {candidate.name || '이름 없음'}
                </h3>
                <button
                  onClick={() => onStartEditName(candidate.id, candidate.name)}
                  style={{
                    padding: '2px 8px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    color: '#666',
                  }}
                >
                  ✏️
                </button>
              </>
            )}
            <span
              style={{
                padding: '4px 10px',
                background: stageColors[candidate.stage] + '15',
                color: stageColors[candidate.stage],
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {stageLabels[candidate.stage]}
            </span>
          </div>
          <p style={{ color: '#666', fontSize: 14, margin: '0 0 8px 0' }}>{candidate.position}</p>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#999' }}>
            {candidate.email && <span>📧 {candidate.email}</span>}
            {candidate.phone && <span>📱 {candidate.phone}</span>}
          </div>
        </div>

        {/* 점수 & 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>적합도</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: candidate.score >= 70 ? '#22c55e' : candidate.score >= 50 ? '#f97316' : '#ef4444',
              }}
            >
              {candidate.score}점
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {nextStages[candidate.stage]?.map((nextStage) => (
              <button
                key={nextStage}
                onClick={() => onUpdateStage(candidate.id, nextStage)}
                style={{
                  padding: '8px 16px',
                  background: stageColors[nextStage],
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                {stageLabels[nextStage]}
              </button>
            ))}
            <button
              onClick={onViewDetail}
              style={{
                padding: '8px 16px',
                background: '#fff',
                color: '#1a1a1a',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📄 상세
            </button>
            <button
              onClick={onAddNote}
              style={{
                padding: '8px 16px',
                background: '#fff',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📝 메모
            </button>
            <button
              onClick={() => onDelete(candidate.id)}
              style={{
                padding: '8px 12px',
                background: '#fff',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 메모 */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>
            메모 ({candidate.notes.length})
          </div>
          {candidate.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {candidate.notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: 12,
                    background: '#f9fafb',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#333',
                    position: 'relative',
                  }}
                >
                  <div>{note.note}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#999' }}>
                      {new Date(note.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <button
                      onClick={() => onDeleteNote(candidate.id, note.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#fff',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#999', margin: 0 }}>메모가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
