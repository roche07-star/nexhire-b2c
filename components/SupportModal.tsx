'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface SupportModalProps {
  open: boolean
  onClose: () => void
}

export default function SupportModal({ open, onClose }: SupportModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('문의가 접수되었습니다.\n\n빠른 시일 내에 답변드리겠습니다.')
        setSubject('')
        setMessage('')
        onClose()
      } else {
        alert(data.error ?? '문의 등록에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  if (!open || typeof window === 'undefined') return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#18181b',
            margin: 0,
          }}>
            문의하기
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              fontSize: 18,
              color: '#71717a',
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#18181b',
              marginBottom: 8,
            }}>
              제목 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="문의 제목을 입력하세요"
              disabled={sending}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#18181b',
              marginBottom: 8,
            }}>
              내용 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="문의 내용을 상세히 입력해주세요"
              disabled={sending}
              rows={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer',
                color: '#71717a',
                opacity: sending ? 0.6 : 1,
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={sending || !subject.trim() || !message.trim()}
              style={{
                flex: 1,
                padding: '12px',
                background: sending || !subject.trim() || !message.trim() ? '#cbd5e1' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: sending || !subject.trim() || !message.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? '전송 중...' : '보내기'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
