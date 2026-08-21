import type { AnalysisListItem } from '@/types/analyze'

interface RewriteTabProps {
  analysisList: AnalysisListItem[] | null
  myCoupons: { id: string; code: string; feature: string; status?: string; claimed_at?: string; used_at?: string; expires_at?: string; credits: number; used: number }[]
  rewriteError: string | null
  rewriteChanges: string[]
  userEmail: string | null
  savedListLoading: boolean
  jdSavedList: { id: string; expires_at?: string | null }[] | null
  rewritingId: string | null
  rewriteLoadingMsg: string
  lastGeneratedResume: any | null
  userPlan: string
  onRewrite: (id: string, filePath: string | undefined) => void
}

export default function RewriteTab({
  analysisList,
  myCoupons,
  rewriteError,
  rewriteChanges,
  userEmail,
  savedListLoading,
  jdSavedList,
  rewritingId,
  rewriteLoadingMsg,
  lastGeneratedResume,
  userPlan,
  onRewrite
}: RewriteTabProps) {
  const preservedCount = (analysisList ?? []).filter(item => item.result?._file_path).length
  const storageCouponCount = myCoupons.filter(c => c.feature === 'storage' && c.status === 'active').length

  return (
    <div className="jd-section">
      <div className="rewrite-status-bar">
        <div className="rewrite-status-item">
          <span className="rewrite-status-label">보존된 이력서</span>
          <span className="rewrite-status-value">{analysisList ? `${preservedCount}개` : '—'}</span>
        </div>
        <div className="rewrite-status-divider" />
        <div className="rewrite-status-item">
          <span className="rewrite-status-label">무료 보존</span>
          <span className={`rewrite-status-value${preservedCount === 0 ? ' available' : ' used'}`}>
            {preservedCount === 0 ? '1회 사용 가능' : '사용 완료'}
          </span>
        </div>
        <div className="rewrite-status-divider" />
        <div className="rewrite-status-item">
          <span className="rewrite-status-label">보존 쿠폰</span>
          <span className={`rewrite-status-value${storageCouponCount > 0 ? ' available' : ''}`}>
            {storageCouponCount > 0 ? `${storageCouponCount}장` : '없음'}
          </span>
        </div>
      </div>

      <div className="jd-list-title">이력서 생성</div>
      {(!jdSavedList || jdSavedList.length === 0) && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          💡 <strong>이력서 생성은 JD 적합도 분석을 먼저 완료해야 사용할 수 있습니다.</strong><br />
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            JD 적합도 분석 탭에서 지원하고자 하는 공고를 분석한 후, 해당 결과를 선택하여 이력서를 생성하세요.
          </span>
        </div>
      )}
      <p className="rewrite-desc">
        JOBIZIC이 추천하는 <strong>깔끔하고 전문적인 포맷</strong>으로 이력서를 생성합니다.<br />
        가독성이 뛰어나고 채용 담당자가 선호하는 구조로 자동 구성되며, 최신 업무 활동 내역도 자동으로 반영됩니다.<br />
        JD 적합도 분석을 선택하여 해당 채용사에 맞게 전략적으로 최적화됩니다.
      </p>
      {rewriteError && <div className="analyze-error">{rewriteError}</div>}
      {rewriteChanges.length > 0 && (
        <div className="rewrite-changes-box">
          <div className="rewrite-changes-title">✏️ 주요 변경사항</div>
          <ul className="rewrite-changes-list">
            {rewriteChanges.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      {/* 최근 생성된 이력서 다시 보기 */}
      {lastGeneratedResume && (() => {
        try {
          const data = lastGeneratedResume
          const createdAt = new Date(data.created_at)
          const ageMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000)

          // 시간 포맷팅
          let timeAgo = '방금 전'
          if (ageMinutes >= 1440) {
            const days = Math.floor(ageMinutes / 1440)
            timeAgo = `${days}일 전`
          } else if (ageMinutes >= 60) {
            const hours = Math.floor(ageMinutes / 60)
            timeAgo = `${hours}시간 전`
          } else if (ageMinutes >= 1) {
            timeAgo = `${ageMinutes}분 전`
          }

          return (
            <div style={{
              background: 'rgba(232,255,71,0.08)',
              border: '1px solid rgba(232,255,71,0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  📄 최근 생성된 이력서
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted2)' }}>
                  {timeAgo}, {userPlan} 플랜
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = `/analyze/preview?email=${encodeURIComponent(userEmail || '')}`}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  다시 보기 →
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (confirm('생성된 이력서를 삭제하시겠습니까?')) {
                      try {
                        await fetch(`/api/analyze/rewrite/delete?id=${data.id}`, { method: 'DELETE' })
                        // 백그라운드 분석 중지
                        localStorage.removeItem('backgroundAnalysis')
                        sessionStorage.clear()
                        // 강제 리렌더링
                        window.location.reload()
                      } catch (error) {
                        console.error('삭제 실패:', error)
                        alert('삭제 중 오류가 발생했습니다')
                      }
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'var(--muted)',
                    fontSize: '18px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,0,0,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255,0,0,0.3)'
                    e.currentTarget.style.color = '#ff5555'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.color = 'var(--muted)'
                  }}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            </div>
          )
        } catch {
          return null
        }
      })()}

      {savedListLoading ? (
        <div className="jd-list-loading">불러오는 중...</div>
      ) : !analysisList || analysisList.length === 0 ? (
        <div className="jd-no-analysis">저장된 분석 결과가 없습니다. 먼저 이력서를 분석해 주세요.</div>
      ) : (
        <div className="jd-saved-list">
          {analysisList.map((item) => {
              const now2 = new Date()
              const hasValidJd = (jdSavedList ?? []).some(jd => !jd.expires_at || new Date(jd.expires_at) > now2)
              const filePath = item.result._file_path as string | undefined
              const isTextPaste = filePath?.endsWith('.txt') ?? false
              const noFile = !filePath
              const disabledTitle = noFile
                ? '원본 파일이 보존되지 않은 이력서입니다'
                : !hasValidJd
                ? 'JD 적합도 분석을 먼저 진행해 주세요'
                : undefined
              return (
                <div key={item.id} className="jd-saved-card rewrite-card">
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
                      {isTextPaste
                        ? <span className="preserve-badge text-paste">텍스트 입력</span>
                        : filePath
                        ? <span className="preserve-badge saved">보존됨</span>
                        : <span className="preserve-badge unsaved">미보존</span>
                      }
                    </span>
                    {(() => {
                      // 보안: localStorage에서 읽지 않고 result에서 직접 사용
                      const candidateName = item.result.candidate_name
                      return candidateName ? (
                        <div className="candidate-name-badge" style={{
                          display: 'inline-block',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          marginTop: '6px',
                          marginBottom: '4px',
                        }}>
                          👤 후보자: {candidateName}
                        </div>
                      ) : null
                    })()}
                    <span className="jd-saved-resume">
                      {isTextPaste
                        ? '양식 업로드 또는 자율 포맷으로 이력서 생성 가능'
                        : item.result.summary?.slice(0, 60) + '…'
                      }
                    </span>
                  </div>
                  <div className="jd-saved-card-right">
                    <span className="jd-saved-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <button
                    className="rewrite-dl-btn"
                    onClick={() => onRewrite(item.id, filePath)}
                    disabled={rewritingId === item.id || noFile || !hasValidJd}
                    title={disabledTitle}
                  >
                    {rewritingId === item.id ? '생성 중...' : '✏️ 이력서 생성'}
                  </button>
                  {rewritingId === item.id && rewriteLoadingMsg && (
                    <div className="rewrite-loading-msg">{rewriteLoadingMsg}</div>
                  )}
                </div>
              )
            })}
        </div>
      )}

    </div>
  )
}
