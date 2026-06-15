'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  tags: string[]
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>파이프라인 관리</h1>
        <p style={{ color: '#666', fontSize: 16 }}>
          총 {filteredCandidates.length}명의 후보자
        </p>
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
              onViewDetail={() => router.push(`/result/${candidate.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function CandidateCard({
  candidate,
  onUpdateStage,
  onViewDetail,
}: {
  candidate: Candidate
  onUpdateStage: (id: string, stage: string) => void
  onViewDetail: () => void
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
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{candidate.name}</h3>
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
                color: candidate.score >= 70 ? '#22c55e' : '#f97316',
              }}
            >
              {candidate.score}점
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
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
                {stageLabels[nextStage]}로
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
              상세보기
            </button>
          </div>
        </div>
      </div>

      {/* 태그 & 메모 */}
      {(candidate.tags.length > 0 || candidate.notes.length > 0) && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          {candidate.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {candidate.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 10px',
                    background: '#f0f0f0',
                    color: '#666',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {candidate.notes.length > 0 && (
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
              📝 메모 {candidate.notes.length}개
            </p>
          )}
        </div>
      )}
    </div>
  )
}
