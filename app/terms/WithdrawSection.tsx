'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function WithdrawSection() {
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? null

  const [open, setOpen] = useState(false)
  const [inputEmail, setInputEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!userEmail) return null

  async function handleWithdraw() {
    if (inputEmail !== userEmail) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '오류가 발생했습니다.')
        return
      }
      await signOut({ callbackUrl: '/' })
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="privacy-section" style={{ borderTop: '1px solid rgba(255,107,107,0.15)', marginTop: 40, paddingTop: 32 }}>
      <h2 style={{ color: '#ff6b6b' }}>계정 탈퇴</h2>
      <p>탈퇴하시면 저장된 분석 결과, JD 적합도 분석, 보유 쿠폰이 즉시 삭제됩니다. 삭제된 데이터는 복구되지 않습니다.</p>
      <p style={{ marginTop: 8 }}>문의가 있으시면 탈퇴 전 <strong>privacy@jobizic.io</strong>로 연락해 주세요.</p>
      <button
        className="withdraw-link"
        style={{ marginTop: 16, fontSize: 13 }}
        onClick={() => { setOpen(true); setInputEmail(''); setError(null) }}
      >
        계정 탈퇴 신청
      </button>

      {open && (
        <div className="withdraw-overlay" onClick={() => !loading && setOpen(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-modal-icon">⚠️</div>
            <div className="withdraw-modal-title">정말 탈퇴하시겠어요?</div>
            <div className="withdraw-modal-desc">탈퇴하면 아래 데이터가 즉시 삭제됩니다.</div>
            <ul className="withdraw-modal-list">
              <li>저장된 이력서 분석 결과 전체</li>
              <li>JD 적합도 분석 결과 전체</li>
              <li>면접 가이드</li>
              <li>보유 쿠폰</li>
              <li>개인정보 동의 기록</li>
              <li>사용자 유형 선택 (개인/헤드헌터)</li>
              <li>주소 등 선택 항목</li>
            </ul>
            <div className="withdraw-modal-warning">🚨 삭제된 데이터는 복구가 불가능합니다.</div>
            <div className="withdraw-modal-confirm-label">확인을 위해 가입한 이메일을 입력해 주세요</div>
            <input
              className="withdraw-modal-input"
              type="email"
              placeholder={userEmail}
              value={inputEmail}
              onChange={(e) => { setInputEmail(e.target.value); setError(null) }}
              disabled={loading}
              autoComplete="off"
            />
            {error && <div className="withdraw-modal-error">{error}</div>}
            <div className="withdraw-modal-btns">
              <button className="withdraw-modal-cancel" onClick={() => setOpen(false)} disabled={loading}>
                취소
              </button>
              <button
                className="withdraw-modal-confirm"
                onClick={handleWithdraw}
                disabled={inputEmail !== userEmail || loading}
              >
                {loading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
