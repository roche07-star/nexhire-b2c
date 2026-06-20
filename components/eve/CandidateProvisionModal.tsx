'use client'

import { useState, useEffect } from 'react'
import './eve-components.css'

interface CandidateProvisionModalProps {
  candidate: {
    email: string
    name: string
    resumeUrl?: string
  }
  company: string
  position?: string
  onConfirm?: (provisionId: string) => void
  onCancel?: () => void
  isOpen: boolean
}

export default function CandidateProvisionModal({
  candidate,
  company,
  position,
  onConfirm,
  onCancel,
  isOpen
}: CandidateProvisionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentStatus, setConsentStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    if (isOpen) {
      checkConsent()
    }
  }, [isOpen, candidate.email, company])

  async function checkConsent() {
    setConsentStatus('checking')
    setError(null)

    try {
      const res = await fetch(
        `/api/consents/record?candidateEmail=${encodeURIComponent(candidate.email)}&company=${encodeURIComponent(company)}`
      )

      if (!res.ok) {
        throw new Error('동의 확인 실패')
      }

      const data = await res.json()
      setConsentStatus(data.hasValidConsent ? 'valid' : 'invalid')

    } catch (err: any) {
      console.error(err)
      setError(err.message || '동의 확인에 실패했습니다.')
      setConsentStatus('invalid')
    }
  }

  async function handleProvide() {
    if (!confirm(`${candidate.name}님의 정보를 ${company}에 제공하시겠습니까?\\n\\n제공 기록은 3년간 보관됩니다.`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/candidates/provide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail: candidate.email,
          recipientCompany: company,
          position: position || null,
          providedItems: ['이름', '전화번호', '이메일', '이력서'],
          resumeFileUrl: candidate.resumeUrl || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'CONSENT_NOT_FOUND') {
          setConsentStatus('invalid')
          throw new Error('동의 기록이 없습니다. 먼저 동의를 받고 기록해주세요.')
        }
        throw new Error(data.error || '정보 제공에 실패했습니다.')
      }

      if (data.code === 'ALREADY_PROVIDED') {
        // 이미 제공된 경우 - 경고만 표시하고 진행
        alert(`⚠️ ${data.warning}\\n\\n계속 진행하시겠습니까?`)
      } else {
        alert('✅ 후보자 정보가 성공적으로 제공되었습니다.')
      }

      onConfirm?.(data.provisionId)

    } catch (err: any) {
      console.error(err)
      setError(err.message || '정보 제공에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="provision-modal-overlay"
      onClick={onCancel}
    >
      <div
        className="provision-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>📤 후보자 정보 제공</h3>

        {error && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* 후보자/채용사 정보 */}
        <div className="provision-info">
          <div className="info-row">
            <span className="info-label">후보자:</span>
            <span className="info-value">
              {candidate.name} ({candidate.email})
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">채용사:</span>
            <span className="info-value">{company}</span>
          </div>
          {position && (
            <div className="info-row">
              <span className="info-label">포지션:</span>
              <span className="info-value">{position}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">제공 항목:</span>
            <span className="info-value">이름, 전화번호, 이메일, 이력서</span>
          </div>
        </div>

        {/* 동의 상태 */}
        {consentStatus === 'checking' && (
          <div className="provision-notice">
            <p>⏳ 동의 기록을 확인하는 중...</p>
          </div>
        )}

        {consentStatus === 'valid' && (
          <div className="provision-notice">
            <p>✅ 동의 기록이 확인되었습니다.</p>
            <p>📋 제공 기록은 3년간 보관됩니다.</p>
          </div>
        )}

        {consentStatus === 'invalid' && (
          <div className="provision-notice" style={{
            background: '#fff5f5',
            borderColor: '#ff4444'
          }}>
            <p style={{ color: '#cc0000' }}>
              ❌ 동의 기록이 없습니다.
            </p>
            <p style={{ color: '#cc0000', fontSize: '12px' }}>
              먼저 후보자로부터 제3자 제공 동의를 받고 기록해주세요.
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="provision-actions">
          <button
            onClick={onCancel}
            className="btn-cancel"
            disabled={loading}
          >
            취소
          </button>
          <button
            onClick={handleProvide}
            disabled={loading || consentStatus !== 'valid'}
            className="btn-provide"
          >
            {loading ? '제공 중...' : '정보 제공하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
