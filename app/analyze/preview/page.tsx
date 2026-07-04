'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Section {
  title: string
  content: string
}

function PreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<string>('FREE')
  const [originalPreview, setOriginalPreview] = useState<string>('')
  const [changes, setChanges] = useState<string[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [docx, setDocx] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [showFullComparison, setShowFullComparison] = useState(false)

  useEffect(() => {
    try {
      const userEmail = searchParams.get('email')
      if (!userEmail) {
        alert('사용자 정보가 없습니다.')
        router.push('/analyze')
        return
      }

      const storageKey = `jobizic_last_rewrite_${userEmail}`
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

      if (!saved) {
        alert('미리보기 데이터가 없습니다.')
        router.push('/analyze')
        return
      }

      const data = JSON.parse(saved)

      // 사용자 검증 (마이그레이션된 데이터는 userEmail이 없을 수 있음)
      if (data.userEmail && data.userEmail !== userEmail) {
        alert('권한이 없습니다.')
        router.push('/analyze')
        return
      }

      const ageMinutes = Math.floor((Date.now() - data.timestamp) / 60000)
      if (ageMinutes > 60) {
        alert('미리보기 데이터가 만료되었습니다. (1시간 제한)')
        router.push('/analyze')
        return
      }

      setPlan(data.plan ?? 'FREE')
      setOriginalPreview(data.originalPreview ?? '')
      setChanges(data.changes ?? [])
      setDocx(data.docx ?? null)
      setFilename(data.filename ?? null)

      // HTML을 섹션별로 파싱
      const parsedSections = parseHTMLToSections(data.preview ?? '')
      setSections(parsedSections)

      setLoading(false)
    } catch (e) {
      console.error('미리보기 로드 실패:', e)
      alert('미리보기를 불러올 수 없습니다.')
      router.push('/analyze')
    }
  }, [router, searchParams])

  function downloadDocx() {
    if (!docx || !filename) {
      alert('다운로드할 파일이 없습니다.')
      return
    }
    try {
      const bytes = Uint8Array.from(atob(docx), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = filename
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('다운로드 실패:', e)
      alert('다운로드에 실패했습니다.')
    }
  }

  function parseHTMLToSections(htmlString: string): Section[] {
    if (!htmlString) return []

    // HTML에서 섹션 추출 (h3 태그 기준)
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlString, 'text/html')
    const h3Elements = doc.querySelectorAll('h3')

    if (h3Elements.length > 0) {
      // h3 태그가 있는 경우 (PDF/text 경로)
      const sectionList: Section[] = []
      h3Elements.forEach((h3) => {
        const title = h3.textContent?.trim() || ''

        // "개인정보 수집 동의서" 섹션 제외 (고정 섹션이므로 표시 불필요)
        if (title.includes('개인정보') || title.includes('동의서') || title.includes('수집')) {
          return
        }

        const nextDiv = h3.nextElementSibling
        const content = nextDiv?.textContent?.trim() || ''
        if (title || content) {
          sectionList.push({ title, content })
        }
      })
      return sectionList
    } else {
      // p 태그가 있는 경우 (DOCX 경로) - 하나의 섹션으로 통합
      const paragraphs = doc.querySelectorAll('p')
      const content = Array.from(paragraphs).map(p => p.textContent?.trim() || '').join('\n\n')
      return content ? [{ title: '이력서 내용', content }] : []
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: 'Noto Sans KR, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#fff' }}>로딩 중...</div>
          <div style={{ fontSize: 14, color: '#999' }}>미리보기를 준비하고 있습니다.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: 'Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif',
      background: '#0a0a0a',
      minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* 헤더 */}
        <div style={{
          marginBottom: '32px',
        }}>
          <button
            onClick={() => router.push('/analyze')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 0',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#999'
            }}
          >
            ← 목록으로
          </button>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px',
          }}>생성 Report</h1>

          <div style={{
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(232,255,71,0.2)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>📁</span>
              <div>
                <div style={{ fontSize: '14px', color: '#e8ff47', fontWeight: 600 }}>
                  저장된 분석 결과
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {plan === 'FREE' && '🆓 FREE 플랜 - HTML 미리보기'}
                  {plan === 'PRO' && '⭐ PRO 플랜'}
                  {plan === 'EXPERT' && '💎 EXPERT 플랜'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#999' }}>
                분석일: {new Date().toLocaleDateString('ko-KR')}
              </span>
              {/* PRO/EXPERT: DOCX 다운로드 버튼 */}
              {(plan === 'PRO' || plan === 'EXPERT') && docx && (
                <button
                  onClick={downloadDocx}
                  style={{
                    background: 'linear-gradient(135deg, #e8ff47 0%, #d4eb33 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  📥 DOCX 다운로드
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 변경사항 섹션 */}
        {changes.length > 0 && (
          <div style={{
            background: 'rgba(20,20,25,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#999',
              marginBottom: '20px',
              letterSpacing: '0.05em',
            }}>✨ 주요 변경사항</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {changes.map((change, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#e8ff47',
                    flexShrink: 0,
                  }}>✓</span>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#e0e0e0',
                    margin: 0,
                  }}>{change}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div style={{
          background: 'rgba(232,255,71,0.05)',
          border: '1px solid rgba(232,255,71,0.2)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          <p style={{
            fontSize: '15px',
            color: '#e8ff47',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            📥 생성된 이력서는 DOCX 파일로 다운로드하여 확인하세요
          </p>
          <p style={{
            fontSize: '13px',
            color: '#999',
            lineHeight: '1.7',
          }}>
            {plan === 'PRO' || plan === 'EXPERT'
              ? '상단의 "DOCX 다운로드" 버튼을 클릭하여 완성된 이력서를 받으세요.'
              : 'PRO 플랜 이상에서 DOCX 다운로드가 가능합니다.'}
          </p>
        </div>

        {/* 푸터 */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontSize: '13px',
          color: '#666',
        }}>
          Generated by <strong style={{ color: '#e8ff47' }}>Jobizic</strong>, Resume Generator
        </div>

        {/* 인쇄 버튼 (고정 위치) */}
        <button
          onClick={() => window.print()}
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            background: '#e8ff47',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(232,255,71,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(232,255,71,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(232,255,71,0.3)'
          }}
          title="인쇄하기"
        >
          🖨️
        </button>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function RewritePreviewPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: 'Noto Sans KR, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#fff' }}>로딩 중...</div>
          <div style={{ fontSize: 14, color: '#999' }}>미리보기를 준비하고 있습니다.</div>
        </div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
