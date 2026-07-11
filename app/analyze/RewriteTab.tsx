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
      <p className="rewrite-desc">
        JOBIZIC이 추천하는 <strong>깔끔하고 전문적인 포맷</strong>으로 이력서를 생성합니다.<br />
        가독성이 뛰어나고 채용 담당자가 선호하는 구조로 자동 구성되며, 최신 업무 활동 내역도 자동으로 반영됩니다.<br />
        JD 적합도 분석을 선택하여 해당 채용사에 맞게 전략적으로 최적화됩니다. 완료 시 <strong>.docx</strong> 파일로 다운로드됩니다.
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
      {(() => {
        try {
          const storageKey = `jobizic_last_rewrite_${userEmail || 'guest'}`
          let saved = localStorage.getItem(storageKey)

          // 마이그레이션: 이전 키에서 데이터 가져오기
          if (!saved) {
            const oldKey = 'jobizic_last_rewrite'
            const oldSaved = localStorage.getItem(oldKey)
            if (oldSaved) {
              try {
                const oldData = JSON.parse(oldSaved)
                // 새 키로 저장 (userEmail 추가)
                localStorage.setItem(storageKey, JSON.stringify({
                  ...oldData,
                  userEmail: userEmail
                }))
                // 이전 키 삭제
                localStorage.removeItem(oldKey)
                saved = localStorage.getItem(storageKey)
              } catch (e) {
                console.error('마이그레이션 실패:', e)
              }
            }
          }

          if (!saved) return null
          const data = JSON.parse(saved)
          const ageMinutes = Math.floor((Date.now() - data.timestamp) / 60000)
          if (ageMinutes > 60) return null // 1시간 이상 지나면 숨김

          // 사용자 검증 (마이그레이션된 데이터는 userEmail이 없을 수 있음)
          if (data.userEmail && data.userEmail !== userEmail) return null

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
                  {ageMinutes < 1 ? '방금 전' : `${ageMinutes}분 전`}, {data.plan} 플랜
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => window.open(`/analyze/preview?email=${encodeURIComponent(userEmail || '')}`, '_blank')}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  다시 보기 →
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('생성된 이력서를 삭제하시겠습니까?')) {
                      const storageKey = `jobizic_last_rewrite_${userEmail || 'guest'}`
                      localStorage.removeItem(storageKey)
                      // 강제 리렌더링
                      window.location.reload()
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
