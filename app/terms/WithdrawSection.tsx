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
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '오류가 발생했습니다.')
        return
      }
      const data = await res.json()
      alert(data.message || '탈퇴가 완료되었습니다.')
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
      <p>탈퇴 신청 시 모든 데이터가 영구 삭제되며 복구할 수 없습니다. 신중하게 결정해주세요.</p>
      <p style={{ marginTop: 8 }}>유료 플랜 이용 중이라면 플랜 종료일까지 정상적으로 서비스를 이용할 수 있습니다.</p>
      <p style={{ marginTop: 8 }}>문의가 있으시면 탈퇴 전 <a href="/support" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>고객센터</a>로 연락해 주세요.</p>
      <button
        className="withdraw-link"
        style={{ marginTop: 16, fontSize: 13 }}
        onClick={() => {
          setOpen(true)
          setInputEmail('')
          setError(null)
        }}
      >
        계정 탈퇴 신청
      </button>

      {open && (
        <div className="withdraw-overlay" onClick={() => !loading && setOpen(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-modal-icon">⚠️</div>
            <div className="withdraw-modal-title">정말 탈퇴하시겠어요?</div>
            <div className="withdraw-modal-desc">탈퇴 신청 시 아래와 같이 처리됩니다.</div>
            <ul className="withdraw-modal-list">
              <li>유료 플랜: 플랜 종료일까지 서비스 이용 가능</li>
              <li>FREE 플랜: 즉시 탈퇴 처리</li>
            </ul>
            <div className="withdraw-modal-warning">⚠️ 탈퇴 시 모든 데이터가 영구 삭제됩니다. 신중하게 결정해주세요.</div>
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
