'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Section {
  title: string
  content: string
}

export default function RewritePreviewPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<string>('FREE')
  const [originalPreview, setOriginalPreview] = useState<string>('')
  const [changes, setChanges] = useState<string[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [originalSections, setOriginalSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jobizic_last_rewrite')
      if (!saved) {
        alert('미리보기 데이터가 없습니다.')
        router.push('/analyze')
        return
      }

      const data = JSON.parse(saved)
      const ageMinutes = Math.floor((Date.now() - data.timestamp) / 60000)
      if (ageMinutes > 60) {
        alert('미리보기 데이터가 만료되었습니다. (1시간 제한)')
        router.push('/analyze')
        return
      }

      setPlan(data.plan ?? 'FREE')
      setOriginalPreview(data.originalPreview ?? '')
      setChanges(data.changes ?? [])

      // HTML을 섹션별로 파싱
      const parsedSections = parseHTMLToSections(data.preview ?? '')
      setSections(parsedSections)

      // 원본도 섹션별로 파싱 (플레인 텍스트를 섹션별로 분리)
      const parsedOriginalSections = parseOriginalTextToSections(data.originalPreview ?? '')
      setOriginalSections(parsedOriginalSections)

      setLoading(false)
    } catch (e) {
      console.error('미리보기 로드 실패:', e)
      alert('미리보기를 불러올 수 없습니다.')
      router.push('/analyze')
    }
  }, [router])

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

  function parseOriginalTextToSections(htmlString: string): Section[] {
    if (!htmlString) return []

    // HTML에서 텍스트 추출
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlString, 'text/html')
    const text = doc.body.textContent || ''

    // 줄바꿈으로 분리
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

    // 섹션 키워드
    const sectionKeywords = [
      '경력사항', '학력', '학교', '자격증', '외국어', '개인', '프로젝트', '수상', '자기소개',
      '경력', '교육', '자격', '어학', '기술', '기타', '활동', '포트폴리오', '직무',
      '업무', '보유', '능력', '특기', '수료', '교육사항'
    ]

    const sections: Section[] = []
    let currentSection: Section | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 섹션 제목 감지 (짧고, 키워드 포함)
      const isLikelyTitle = line.length < 30 &&
        sectionKeywords.some(kw => line.includes(kw) || line.replace(/\s+/g, '').includes(kw))

      if (isLikelyTitle) {
        // 이전 섹션 저장
        if (currentSection && currentSection.content) {
          sections.push(currentSection)
        }
        // 새 섹션 시작
        currentSection = {
          title: line,
          content: ''
        }
      } else if (currentSection) {
        // 현재 섹션에 내용 추가
        currentSection.content += (currentSection.content ? '\n' : '') + line
      } else {
        // 첫 섹션 전의 내용은 "기본 정보"로
        if (!sections.length) {
          currentSection = {
            title: '기본 정보',
            content: line
          }
        }
      }
    }

    // 마지막 섹션 저장
    if (currentSection && currentSection.content) {
      sections.push(currentSection)
    }

    // 섹션이 없으면 전체를 하나의 섹션으로
    if (sections.length === 0 && text.trim()) {
      return [{ title: '이력서 내용', content: text.trim() }]
    }

    return sections
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
            <span style={{ fontSize: '13px', color: '#999' }}>
              분석일: {new Date().toLocaleDateString('ko-KR')}
            </span>
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

        {/* 섹션별 좌우 비교 */}
        {sections.map((section, idx) => {
          const originalSection = originalSections[idx] || { title: section.title, content: '(원본 정보 없음)' }

          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '24px',
              }}
            >
              {/* 왼쪽: 수정 전 (원본) */}
              <div style={{
                background: 'rgba(20,20,25,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '32px',
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#999',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(153,153,153,0.3)',
                }}>
                  {idx === 0 ? '📄 수정 전 이력서 (원본)' : ''}
                </h2>

                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#999',
                  marginBottom: '12px',
                }}>{originalSection.title}</h3>

                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: '#999',
                  whiteSpace: 'pre-wrap',
                }}>
                  {originalSection.content}
                </div>
              </div>

              {/* 오른쪽: 수정 후 (생성) */}
              <div style={{
                background: 'rgba(20,20,25,0.6)',
                border: '1px solid rgba(232,255,71,0.3)',
                borderRadius: '16px',
                padding: '32px',
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#e8ff47',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(232,255,71,0.3)',
                }}>
                  {idx === 0 ? '✨ 수정 후 이력서 (AI 생성)' : ''}
                </h2>

                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#e8ff47',
                  marginBottom: '12px',
                }}>{section.title}</h3>

                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: '#d0d0d0',
                  whiteSpace: 'pre-wrap',
                }}>
                  {section.content.replace(/·/g, '/')}
                </div>
              </div>
            </div>
          )
        })}

        {/* 푸터 */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontSize: '13px',
          color: '#666',
        }}>
          Generated by <strong style={{ color: '#e8ff47' }}>Jobizic</strong> · AI Resume Generator
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
