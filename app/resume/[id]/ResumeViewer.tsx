'use client'

import { useState, useRef, useEffect } from 'react'

interface Resume {
  id: string
  analysis_id: string
  user_email: string
  html_content: string
  created_at: string
  updated_at: string
}

export default function ResumeViewer({ resume }: { resume: Resume }) {
  const [regenerating, setRegenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // editing 모드로 전환 시 innerHTML 설정
  useEffect(() => {
    if (editing && contentRef.current) {
      contentRef.current.innerHTML = resume.html_content
    }
  }, [editing, resume.html_content])

  const handleRegenerate = async () => {
    if (!confirm('이력서를 재생성하시겠습니까?\n\n기존 내용이 새로운 버전으로 교체됩니다.')) {
      return
    }

    setRegenerating(true)
    localStorage.setItem('resumeGenerating', 'true') // 전역 표시용

    try {
      const res = await fetch(`/api/resume/${resume.id}/regenerate`, {
        method: 'PUT',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '재생성 실패')
        setRegenerating(false)
        localStorage.removeItem('resumeGenerating') // 전역 표시 제거
        return
      }

      alert('✅ 이력서가 재생성되었습니다!')
      localStorage.removeItem('resumeGenerating') // 전역 표시 제거
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('재생성 중 오류가 발생했습니다.')
      setRegenerating(false)
      localStorage.removeItem('resumeGenerating') // 전역 표시 제거
    }
  }

  const handleDownload = () => {
    const content = editing && contentRef.current ? contentRef.current.innerHTML : resume.html_content
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `이력서_${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    if (!contentRef.current) return

    const newContent = contentRef.current.innerHTML

    setSaving(true)
    try {
      const res = await fetch(`/api/resume/${resume.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_content: newContent }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '저장 실패')
        return
      }

      alert('✅ 이력서가 저장되었습니다!')
      setEditing(false)
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* 상단 액션 바 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => window.close()}
          style={{ minWidth: '120px' }}
        >
          ← 닫기
        </button>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          style={{ minWidth: '120px' }}
        >
          📥 다운로드
        </button>
        <button
          className="btn btn-accent"
          onClick={handleRegenerate}
          disabled={regenerating || editing}
          style={{ minWidth: '120px' }}
        >
          {regenerating ? '⏳ 생성 중...' : '🔄 재생성'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setEditing(!editing)}
          disabled={regenerating}
          style={{ minWidth: '120px' }}
        >
          {editing ? '👀 미리보기' : '✏️ 편집'}
        </button>
        {editing && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: '120px' }}
          >
            {saving ? '💾 저장 중...' : '💾 저장'}
          </button>
        )}
      </div>

      {/* 이력서 내용 */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: editing ? '0 4px 20px rgba(167, 139, 250, 0.3)' : '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            border: editing ? '2px solid #a78bfa' : 'none',
          }}
        >
          {editing ? (
            <div
              ref={contentRef}
              contentEditable={true}
              suppressContentEditableWarning
              style={{
                padding: '40px',
                color: '#000',
                lineHeight: 1.6,
                outline: '2px solid rgba(167, 139, 250, 0.2)',
                cursor: 'text',
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: resume.html_content }}
              style={{
                padding: '40px',
                color: '#000',
                lineHeight: 1.6,
              }}
            />
          )}
        </div>

        {/* 메타 정보 */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'var(--surface)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          <p>생성일: {new Date(resume.created_at).toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          })}</p>
          {resume.updated_at !== resume.created_at && (
            <p style={{ marginTop: '4px' }}>
              최종 수정: {new Date(resume.updated_at).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
              })}
            </p>
          )}
        </div>
      </div>

      {regenerating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(167,139,250,0.3)',
                borderTopColor: '#a78bfa',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>이력서 생성중...</p>
            <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '14px' }}>
              약 60-90초 소요됩니다
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}
    </main>
  )
}
