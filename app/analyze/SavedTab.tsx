import { useState, useEffect } from 'react'
import type { AnalysisListItem } from '@/types/analyze'

interface SavedTabProps {
  savedSelectedItem: AnalysisListItem | null
  analysisList: AnalysisListItem[] | null
  savedListLoading: boolean
  searchQuery: string
  minScore: number
  sharingId: string | null
  deletingAnalysisId: string | null
  isPro: boolean
  userType: string | null | undefined
  userRole?: string
  userEmail: string | null
  showHiringModal: boolean
  hiringProcessCreating: boolean
  hiringModalTop: number
  hiringButtonRef: React.RefObject<HTMLButtonElement | null>
  hiringJDInfo: {
    candidateName: string
    companyName: string
    positionTitle: string
    jdAnalysisId?: string
    fitScore?: number
    resumeTitle?: string
  }
  onSetSavedSelectedItem: (item: AnalysisListItem | null) => void
  onSetSearchQuery: (query: string) => void
  onSetMinScore: (score: number) => void
  onShare: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onSetShowHiringModal: (show: boolean) => void
  onSetHiringProcessCreating: (creating: boolean) => void
  onSetHiringModalTop: (top: number) => void
  onSetHiringJDInfo: (info: any) => void
  AnalysisResults: any
}

export default function SavedTab({
  savedSelectedItem,
  analysisList,
  savedListLoading,
  searchQuery,
  minScore,
  sharingId,
  deletingAnalysisId,
  isPro,
  userType,
  userRole,
  userEmail,
  showHiringModal,
  hiringProcessCreating,
  hiringModalTop,
  hiringButtonRef,
  hiringJDInfo,
  onSetSavedSelectedItem,
  onSetSearchQuery,
  onSetMinScore,
  onShare,
  onDelete,
  onSetShowHiringModal,
  onSetHiringProcessCreating,
  onSetHiringModalTop,
  onSetHiringJDInfo,
  AnalysisResults
}: SavedTabProps) {
  const [generating, setGenerating] = useState(false)
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null)
  const [checkingResume, setCheckingResume] = useState(false)

  // 이미 생성된 이력서가 있는지 확인
  const checkExistingResume = async (analysisId: string) => {
    if (checkingResume) return

    setCheckingResume(true)
    try {
      const res = await fetch(`/api/analyze/${analysisId}/check-resume`)
      if (res.ok) {
        const { resumeId } = await res.json()
        if (resumeId) {
          setGeneratedResumeId(resumeId)
        } else {
          setGeneratedResumeId(null)
        }
      }
    } catch (error) {
      console.error('Resume check error:', error)
    } finally {
      setCheckingResume(false)
    }
  }

  // savedSelectedItem이 변경되면 이력서 확인
  useEffect(() => {
    if (savedSelectedItem?.id) {
      checkExistingResume(savedSelectedItem.id)
    } else {
      setGeneratedResumeId(null)
    }
  }, [savedSelectedItem?.id])

  const handleGenerateResume = async () => {
    if (!savedSelectedItem || generating) return

    setGenerating(true)

    // UI 업데이트를 위한 딜레이 (React 렌더링 보장)
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const res = await fetch(`/api/analyze/${savedSelectedItem.id}/generate-resume`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '이력서 생성 실패')
        setGenerating(false)
        return
      }

      setGeneratedResumeId(data.resumeId)
      setGenerating(false)
      alert('✅ 이력서가 생성되었습니다!')
    } catch (error) {
      console.error(error)
      alert('이력서 생성 중 오류가 발생했습니다.')
      setGenerating(false)
    }
  }

  return (
    <div className="jd-section">
      {savedSelectedItem ? (
        <>
          <button className="jd-back-btn" onClick={() => onSetSavedSelectedItem(null)}>
            ← 목록으로
          </button>
          <div className="analyze-saved-notice">
            <span>📂 저장된 분석 결과</span>
            <span className="analyze-saved-date">
              분석일: {new Date(savedSelectedItem.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>

          {/* 이력서 재생성 버튼 (구직자만) - 상단 배치 */}
          {userType?.toUpperCase() !== 'HEADHUNTER' && userRole !== 'MANAGER' && (
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              textAlign: 'center'
            }}>
              {generating && (
                <div style={{
                  marginBottom: '20px',
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '12px',
                  border: '2px solid #60a5fa',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
                      ⏳ 이력서 분석 중...
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                      AI가 개선된 이력서를 작성하고 있습니다 (약 60-90초 소요)
                    </span>
                  </div>
                </div>
              )}
              {generatedResumeId ? (
                <button
                  className="btn btn-primary"
                  onClick={() => window.open(`/resume/${generatedResumeId}`, '_blank')}
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  👁️ 이력서 보기
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerateResume}
                    disabled={generating}
                    style={{ fontSize: '16px', padding: '14px 32px' }}
                  >
                    {generating ? '⏳ 생성 중...' : '📄 이력서 재생성'}
                  </button>
                  <p style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    color: 'var(--muted)',
                    lineHeight: 1.5
                  }}>
                    분석된 결과를 바탕으로 개선된 이력서를 생성합니다.
                  </p>
                </>
              )}
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          <AnalysisResults
            result={savedSelectedItem.result}
            analysisId={savedSelectedItem.id}
            isPro={isPro}
            userType={userType}
            userEmail={userEmail}
            showHiringModal={showHiringModal}
            setShowHiringModal={onSetShowHiringModal}
            hiringProcessCreating={hiringProcessCreating}
            setHiringProcessCreating={onSetHiringProcessCreating}
            hiringModalTop={hiringModalTop}
            setHiringModalTop={onSetHiringModalTop}
            hiringButtonRef={hiringButtonRef}
            hiringJDInfo={hiringJDInfo}
            setHiringJDInfo={onSetHiringJDInfo}
          />
        </>
      ) : (
        <>
          <div className="jd-list-title">분석 결과를 선택하세요</div>

          {/* 검색/필터 */}
          {analysisList && analysisList.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                className="form-input"
                placeholder="직무명 또는 요약 검색..."
                value={searchQuery}
                onChange={(e) => onSetSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="form-input"
                value={minScore}
                onChange={(e) => onSetMinScore(Number(e.target.value))}
                style={{ width: 150 }}
              >
                <option value={0}>전체 점수</option>
                <option value={70}>70점 이상</option>
                <option value={80}>80점 이상</option>
                <option value={90}>90점 이상</option>
              </select>
            </div>
          )}

          {savedListLoading ? (
            <div className="jd-list-loading">불러오는 중...</div>
          ) : !analysisList || analysisList.length === 0 ? (
            <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
          ) : (() => {
              const filteredList = analysisList.filter(item => {
                // 검색어 필터
                const searchLower = searchQuery.toLowerCase()
                const matchesSearch = !searchQuery ||
                  (item.result.job_title?.toLowerCase().includes(searchLower)) ||
                  (item.result.summary?.toLowerCase().includes(searchLower))

                // 점수 필터
                const matchesScore = !minScore || (item.result.scores?.job_fit ?? 0) >= minScore

                return matchesSearch && matchesScore
              })

              return filteredList.length === 0 ? (
                <div className="jd-no-analysis">검색 조건에 맞는 분석 결과가 없습니다.</div>
              ) : (
                <div className="jd-saved-list">
                  {filteredList.map((item) => (
                <div key={item.id} className="jd-saved-card" onClick={() => onSetSavedSelectedItem(item)}>
                  <div className="jd-saved-card-left">
                    <span className="jd-saved-company">
                      <strong
                        style={{
                          color: item.result.candidate_name ? '#a78bfa' : '#888',
                          marginRight: '8px',
                          cursor: 'pointer',
                          textDecoration: 'underline dotted',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const newName = prompt('후보자 이름을 입력하세요:', item.result.candidate_name || '')
                          if (newName !== null && newName.trim() !== item.result.candidate_name) {
                            fetch(`/api/analysis/${item.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ candidate_name: newName.trim() })
                            }).then(res => {
                              if (res.ok) {
                                window.location.reload()
                              } else {
                                alert('이름 저장에 실패했습니다.')
                              }
                            })
                          }
                        }}
                        title="클릭하여 이름 수정"
                      >
                        {item.result.candidate_name || '미정'}
                      </strong>
                      {item.result.job_title ?? '이력서 분석'}
                    </span>
                    <span className="jd-saved-resume">{item.result.summary?.slice(0, 60)}…</span>
                  </div>
                  <div className="jd-saved-card-right">
                    <span className="jd-saved-score" style={{ color: 'var(--accent)' }}>
                      {item.result.scores?.job_fit ?? '—'}%
                    </span>
                    <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <button
                    className="saved-share-btn"
                    onClick={(e) => onShare(item.id, e)}
                    disabled={sharingId === item.id}
                    title="공유 URL 복사"
                    style={{ marginRight: 8 }}
                  >
                    {sharingId === item.id ? '⏳' : '🔗'}
                  </button>
                  <button
                    className="saved-delete-btn"
                    onClick={(e) => onDelete(item.id, e)}
                    disabled={deletingAnalysisId === item.id}
                    title="삭제"
                  >
                    {deletingAnalysisId === item.id ? '…' : '×'}
                  </button>
                </div>
                  ))}
                </div>
              )
            })()
          }
        </>
      )}
    </div>
  )
}
