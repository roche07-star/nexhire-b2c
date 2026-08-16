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

export default function ResumeViewer({ resume, userPlan, canDownload }: { resume: Resume; userPlan: string; canDownload: boolean }) {
  const [regenerating, setRegenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)

  // editing 모드로 전환 시 innerHTML 설정
  useEffect(() => {
    if (editing && contentRef.current) {
      contentRef.current.innerHTML = resume.html_content
    }
  }, [editing, resume.html_content])

  // 생성된 HTML의 body 스타일 강제 제거 (모바일 대응)
  useEffect(() => {
    if (!editing && displayRef.current) {
      const bodyElement = displayRef.current.querySelector('body')
      if (bodyElement) {
        // 모바일에서 padding 강제 제거
        if (window.innerWidth <= 768) {
          bodyElement.style.padding = '0'
          bodyElement.style.margin = '0'
        }
      }
    }
  }, [editing, resume.html_content])

  // FREE 플랜 워터마크 추가 (경력 섹션 블러 처리)
  useEffect(() => {
    if (userPlan === 'FREE' && !editing && displayRef.current) {
      const container = displayRef.current

      // 경력 섹션 찾기 (h2, h3 태그 중에서)
      const headings = container.querySelectorAll('h1, h2, h3, h4')
      let foundCareerSection: Element | null = null
      let foundCareerHeading: Element | null = null

      headings.forEach((heading) => {
        const text = heading.textContent?.trim() || ''
        if (text.includes('경력') || text.includes('Experience') || text.includes('Work')) {
          foundCareerHeading = heading
          foundCareerSection = heading.parentElement || heading.nextElementSibling
        }
      })

      if (foundCareerSection && foundCareerHeading) {
        // 기존 워터마크 제거
        const existing = container.querySelector('.free-watermark-wrapper')
        if (existing) {
          existing.remove()
        }

        // 타입 단언을 위한 참조
        const careerSectionElement = foundCareerSection as Element

        // 경력 섹션을 감싸는 wrapper 생성
        const wrapper = document.createElement('div')
        wrapper.className = 'free-watermark-wrapper'
        wrapper.style.cssText = `
          position: relative;
          margin: 20px 0;
        `

        // 경력 섹션 복제 및 블러 처리
        const blurredSection = careerSectionElement.cloneNode(true) as HTMLElement
        blurredSection.style.cssText = `
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
        `

        // 워터마크 생성 (작고 간결하게)
        const watermark = document.createElement('div')
        watermark.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #ff9800;
          border-radius: 8px;
          padding: 16px 24px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10;
        `
        watermark.innerHTML = `
          <div style="font-size: 16px; font-weight: 700; color: #f57c00; margin-bottom: 6px;">
            🔒 PRO 플랜 전용
          </div>
          <div style="font-size: 12px; color: #e65100;">
            업그레이드하고 전체 경력사항을 확인하세요
          </div>
        `

        // wrapper에 블러된 경력 + 워터마크 추가
        wrapper.appendChild(blurredSection)
        wrapper.appendChild(watermark)

        // 원래 경력 섹션을 wrapper로 교체
        if (careerSectionElement.parentNode) {
          careerSectionElement.parentNode.replaceChild(wrapper, careerSectionElement)
        }
      }
    }
  }, [userPlan, editing, resume.html_content])

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
    // 다운로드 권한 확인
    if (!canDownload) {
      alert('🔒 다운로드 권한이 없습니다.\n\nStore에서 "이력서 생성" 상품을 구매하거나\nPRO 플랜으로 업그레이드해주세요.')
      return
    }

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
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: 'Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* 상단 액션 바 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 20px',
          display: 'flex',
          gap: '8px',
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
          {canDownload ? '📥 다운로드' : '🔒 다운로드'}
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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 8px 40px',
        }}
      >
        <div
          className="resume-card"
          style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: editing ? '0 8px 32px rgba(232,255,71,0.3)' : '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            outline: editing ? '3px solid #e8ff47' : 'none',
          }}
        >
          {editing ? (
            <div
              ref={contentRef}
              contentEditable={true}
              suppressContentEditableWarning
              className="resume-content"
              style={{
                color: '#000',
                lineHeight: 1.6,
                cursor: 'text',
              }}
            />
          ) : (
            <div
              ref={displayRef}
              dangerouslySetInnerHTML={{ __html: resume.html_content }}
              className="resume-content"
              style={{
                color: '#000',
                lineHeight: 1.6,
              }}
            />
          )}
        </div>

        {/* 메타 정보 */}
        <div
          style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '13px',
            color: '#666',
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

      {/* 반응형 스타일 */}
      <style jsx global>{`
        .resume-content {
          padding: 48px;
        }

        /* 생성된 HTML 내부 강제 스타일 */
        .resume-content body,
        .resume-content > * {
          max-width: 100% !important;
          width: 100% !important;
        }

        @media (max-width: 768px) {
          .resume-content {
            padding: 16px !important;
          }

          .resume-content body {
            padding: 12px 8px !important;
          }
        }
      `}</style>
    </main>
  )
}
