import { useState } from 'react'
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

  const handleGenerateResume = async () => {
    if (!savedSelectedItem || generating) return

    setGenerating(true)
    try {
      const res = await fetch(`/api/analyze/${savedSelectedItem.id}/generate-resume`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '이력서 생성 실패')
        return
      }

      const { resumeId } = await res.json()
      setGeneratedResumeId(resumeId)
      alert('✅ 이력서가 생성되었습니다!')
    } catch (error) {
      console.error(error)
      alert('이력서 생성 중 오류가 발생했습니다.')
    } finally {
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

          {/* 이력서 재생성 버튼 (구직자만) */}
          {userType?.toUpperCase() !== 'HEADHUNTER' && userRole !== 'MANAGER' && (
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              {generatedResumeId ? (
                <button
                  className="btn btn-primary"
                  onClick={() => window.open(`/resume/${generatedResumeId}`, '_blank')}
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  👁️ 이력서 보기
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateResume}
                  disabled={generating}
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  {generating ? '⏳ 생성 중...' : '📄 이력서 재생성'}
                </button>
              )}
              {generating && (
                <p style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '14px' }}>
                  AI가 개선된 이력서를 작성하고 있습니다... (약 60-90초 소요)
                </p>
              )}
            </div>
          )}
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
