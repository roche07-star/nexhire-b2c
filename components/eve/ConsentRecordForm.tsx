'use client'

import { useState } from 'react'
import './eve-components.css'

interface ConsentRecordFormProps {
  candidateEmail?: string
  onSuccess?: (consentId: string) => void
  onCancel?: () => void
}

export default function ConsentRecordForm({
  candidateEmail: initialEmail,
  onSuccess,
  onCancel
}: ConsentRecordFormProps) {
  const [formData, setFormData] = useState({
    candidateEmail: initialEmail || '',
    candidateName: '',
    candidatePhone: '',
    recipientCompany: '',
    position: '',
    providedItems: ['이름', '전화번호', '이메일', '이력서'],
    consentMethod: 'phone' as 'phone' | 'email' | 'in-person' | 'document',
    agreedAt: new Date().toISOString().slice(0, 16),
    notes: ''
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allItems = ['이름', '전화번호', '이메일', '이력서', '경력기술서', '포트폴리오']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. 동의서 파일 업로드 (있는 경우)
      let consentDocumentUrl = null
      if (file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'consent')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadRes.ok) {
          throw new Error('파일 업로드 실패')
        }

        const uploadData = await uploadRes.json()
        consentDocumentUrl = uploadData.url
      }

      // 2. 동의 기록 등록
      const res = await fetch('/api/consents/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          consentDocumentUrl
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '동의 기록 등록 실패')
      }

      alert('✅ 동의 기록이 성공적으로 등록되었습니다.')
      onSuccess?.(data.consentId)

      // 폼 초기화
      setFormData({
        candidateEmail: '',
        candidateName: '',
        candidatePhone: '',
        recipientCompany: '',
        position: '',
        providedItems: ['이름', '전화번호', '이메일', '이력서'],
        consentMethod: 'phone',
        agreedAt: new Date().toISOString().slice(0, 16),
        notes: ''
      })
      setFile(null)

    } catch (err: any) {
      console.error(err)
      setError(err.message || '동의 기록 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="consent-record-container">
      <form onSubmit={handleSubmit} className="consent-record-form">
        <div className="form-header">
          <h3>📋 제3자 제공 동의 기록</h3>
          <p className="form-subtitle">
            후보자로부터 오프라인으로 받은 동의를 시스템에 기록합니다
          </p>
        </div>

        {error && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* 후보자 정보 */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">👤</span>
            후보자 정보
          </h4>

          <div className="form-group">
            <label className="form-label">
              이메일 <span className="required">*</span>
            </label>
            <input
              type="email"
              value={formData.candidateEmail}
              onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
              required
              className="form-input"
              placeholder="candidate@example.com"
              disabled={!!initialEmail}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                이름 <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                required
                className="form-input"
                placeholder="홍길동"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                전화번호 <span className="optional">(선택)</span>
              </label>
              <input
                type="tel"
                value={formData.candidatePhone}
                onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                className="form-input"
                placeholder="010-1234-5678"
              />
            </div>
          </div>
        </div>

        {/* 채용사 정보 */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">🏢</span>
            채용사 정보
          </h4>

          <div className="form-group">
            <label className="form-label">
              채용사명 <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.recipientCompany}
              onChange={(e) => setFormData({ ...formData, recipientCompany: e.target.value })}
              required
              className="form-input"
              placeholder="예) 삼성전자, 카카오, 네이버"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              포지션 <span className="optional">(선택)</span>
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="form-input"
              placeholder="예) 마케팅 매니저, Backend 개발자"
            />
          </div>
        </div>

        {/* 제공 항목 */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">📄</span>
            제공 항목 <span className="required">*</span>
          </h4>

          <div className="checkbox-grid">
            {allItems.map(item => (
              <label key={item} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.providedItems.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        providedItems: [...formData.providedItems, item]
                      })
                    } else {
                      setFormData({
                        ...formData,
                        providedItems: formData.providedItems.filter(i => i !== item)
                      })
                    }
                  }}
                  className="checkbox-input"
                />
                <span className="checkbox-text">{item}</span>
              </label>
            ))}
          </div>
          {formData.providedItems.length === 0 && (
            <p className="form-help error">최소 1개 이상 선택해주세요</p>
          )}
        </div>

        {/* 동의 방법 */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">📞</span>
            동의 받은 방법 <span className="required">*</span>
          </h4>

          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="phone"
                checked={formData.consentMethod === 'phone'}
                onChange={(e) => setFormData({
                  ...formData,
                  consentMethod: e.target.value as any
                })}
                className="radio-input"
              />
              <span className="radio-text">
                <span className="radio-icon">📱</span>
                전화 (구두 동의)
              </span>
            </label>

            <label className="radio-label">
              <input
                type="radio"
                value="email"
                checked={formData.consentMethod === 'email'}
                onChange={(e) => setFormData({
                  ...formData,
                  consentMethod: e.target.value as any
                })}
                className="radio-input"
              />
              <span className="radio-text">
                <span className="radio-icon">📧</span>
                이메일
              </span>
            </label>

            <label className="radio-label">
              <input
                type="radio"
                value="in-person"
                checked={formData.consentMethod === 'in-person'}
                onChange={(e) => setFormData({
                  ...formData,
                  consentMethod: e.target.value as any
                })}
                className="radio-input"
              />
              <span className="radio-text">
                <span className="radio-icon">🤝</span>
                대면
              </span>
            </label>

            <label className="radio-label">
              <input
                type="radio"
                value="document"
                checked={formData.consentMethod === 'document'}
                onChange={(e) => setFormData({
                  ...formData,
                  consentMethod: e.target.value as any
                })}
                className="radio-input"
              />
              <span className="radio-text">
                <span className="radio-icon">📝</span>
                서면 동의서
              </span>
            </label>
          </div>
        </div>

        {/* 동의 일시 */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">🕐</span>
            동의 받은 일시 <span className="required">*</span>
          </h4>

          <div className="form-group">
            <input
              type="datetime-local"
              value={formData.agreedAt}
              onChange={(e) => setFormData({ ...formData, agreedAt: e.target.value })}
              required
              className="form-input"
              max={new Date().toISOString().slice(0, 16)}
            />
            <p className="form-help">동의를 받은 정확한 일시를 입력해주세요</p>
          </div>
        </div>

        {/* 동의서 파일 업로드 */}
        {formData.consentMethod === 'document' && (
          <div className="form-section">
            <h4 className="section-title">
              <span className="section-icon">📎</span>
              동의서 파일 업로드 <span className="optional">(선택)</span>
            </h4>

            <div className="form-group">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="form-file-input"
              />
              {file && (
                <div className="file-preview">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="file-remove"
                  >
                    ×
                  </button>
                </div>
              )}
              <p className="form-help">PDF, JPG, PNG 파일만 업로드 가능 (최대 10MB)</p>
            </div>
          </div>
        )}

        {/* 메모 */}
        <div className="form-section">
          <h4 className="section-title">
            <span className="section-icon">💭</span>
            메모 <span className="optional">(선택)</span>
          </h4>

          <div className="form-group">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="예) 전화 통화 후 구두 동의 받음. 채용사명, 포지션, 제공 항목 모두 설명 완료."
            />
          </div>
        </div>

        {/* 유의사항 */}
        <div className="form-notice">
          <h4 className="notice-title">⚠️ 유의사항</h4>
          <ul className="notice-list">
            <li>후보자에게 <strong>채용사명, 포지션, 제공 항목</strong>을 명확히 안내했는지 확인하세요.</li>
            <li>동의 기록은 <strong>법적 효력</strong>이 있으므로 정확하게 입력하세요.</li>
            <li>제공 기록은 <strong>3년간 보관</strong>됩니다.</li>
            <li>동의 철회 요청 시 즉시 처리해야 합니다.</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={loading || formData.providedItems.length === 0}
            className="btn-primary"
          >
            {loading ? '등록 중...' : '✅ 동의 기록 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
