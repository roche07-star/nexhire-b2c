'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateProposalHTML } from '@/lib/proposalHTMLTemplate'

interface AnalysisResult {
  id: string
  result: any
  createdAt: string
  stage: string
}

export default function ResultClient({ analysisId, userType }: { analysisId: string; userType?: string | null }) {
  const router = useRouter()
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jdList, setJdList] = useState<any[]>([])
  const [showJdSelect, setShowJdSelect] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [savedProposals, setSavedProposals] = useState<Record<string, { html: string; proposal: any }>>({})

  useEffect(() => {
    fetchResult()
    if (userType === 'HEADHUNTER') {
      fetchJdList()
      loadSavedProposals()
    }
  }, [analysisId, userType])

  const loadSavedProposals = () => {
    if (typeof window === 'undefined') return
    const saved: Record<string, any> = {}
    // localStorage에서 이 이력서와 관련된 모든 제안서 로드
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`proposal_resume_${analysisId}_jd_`)) {
        const jdId = key.replace(`proposal_resume_${analysisId}_jd_`, '')
        try {
          const data = localStorage.getItem(key)
          if (data) {
            saved[jdId] = JSON.parse(data)
          }
        } catch (e) {
          console.error('Failed to parse saved proposal:', e)
        }
      }
    }
    setSavedProposals(saved)
  }

  const fetchJdList = async () => {
    try {
      const res = await fetch('/api/analyze/jd/list')
      if (res.ok) {
        const { jdAnalyses } = await res.json()
        setJdList(jdAnalyses || [])
      }
    } catch (err) {
      console.error('JD 목록 불러오기 실패:', err)
    }
  }

  const generateProposal = async (jdId: string) => {
    try {
      setGeneratingProposal(true)
      setShowJdSelect(false)

      const jd = jdList.find(j => j.id === jdId)
      if (!jd || !data) return

      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeAnalysis: data.result,
          jdAnalysis: jd.result,
        }),
      })

      if (!res.ok) throw new Error('제안서 생성 실패')

      const { proposal } = await res.json()

      // HTML 생성
      const html = generateProposalHTML(proposal, data.result, jd.result)

      // localStorage에 저장
      const proposalKey = `proposal_resume_${analysisId}_jd_${jdId}`
      const dataToSave = { html, proposal }
      localStorage.setItem(proposalKey, JSON.stringify(dataToSave))
      setSavedProposals(prev => ({ ...prev, [jdId]: dataToSave }))

      // 다운로드
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `후보자제안서_${proposal.candidate_info?.name || '미상'}_${new Date().toISOString().slice(0, 10)}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Proposal generation error:', error)
      alert('제안서 생성에 실패했습니다.')
    } finally {
      setGeneratingProposal(false)
    }
  }

  const downloadSavedProposal = (jdId: string) => {
    const saved = savedProposals[jdId]
    if (!saved) return

    const blob = new Blob([saved.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `후보자제안서_${saved.proposal.candidate_info?.name || '미상'}_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchResult()
  }, [analysisId])

  const fetchResult = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analysis/${analysisId}`)

      if (!res.ok) {
        throw new Error('분석 결과를 불러올 수 없습니다.')
      }

      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center', background: '#fafafa', minHeight: '100vh' }}>
        <p>로딩 중...</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center', background: '#fafafa', minHeight: '100vh' }}>
        <p style={{ color: '#ef4444', marginBottom: 20 }}>{error || '데이터를 찾을 수 없습니다.'}</p>
        <Link href="/dashboard">
          <button style={{
            padding: '12px 24px',
            background: '#1a1a14',
            color: '#e8ff47',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}>
            대시보드로 돌아가기
          </button>
        </Link>
      </main>
    )
  }

  const result = data.result
  const name = result.candidate_name || result.name || '미정'
  const position = result.job_title || result.position || '미정'
  const score = result.scores?.job_fit || 0

  return (
    <main style={{
      padding: '80px 20px 40px',
      maxWidth: 1000,
      margin: '0 auto',
      background: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 8, color: '#1a1a1a' }}>분석 결과</h1>
          <p style={{ color: '#666', fontSize: 16 }}>{name} - {position}</p>
        </div>
        <button
          onClick={() => router.back()}
          style={{
            width: 40,
            height: 40,
            background: '#fff',
            color: '#666',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 24,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* 적합도 점수 */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ fontSize: 18, marginBottom: 16, color: '#1a1a1a' }}>직무 적합도</h2>
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: score >= 70 ? '#22c55e' : score >= 50 ? '#f97316' : '#ef4444',
          textAlign: 'center',
        }}>
          {score}점
        </div>
      </div>

      {/* 요약 */}
      {result.summary && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, color: '#1a1a1a' }}>요약</h2>
          <p style={{ color: '#333', lineHeight: 1.6, fontSize: 15 }}>{result.summary}</p>
        </div>
      )}

      {/* 강점 */}
      {result.strengths && result.strengths.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, color: '#1a1a1a' }}>✅ 강점</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#333' }}>
            {result.strengths.map((item: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 8, fontSize: 15 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 개선점 */}
      {result.improvements && result.improvements.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, color: '#1a1a1a' }}>⚠️ 개선점</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#333' }}>
            {result.improvements.map((item: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 8, fontSize: 15 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 키워드 */}
      {result.keywords && result.keywords.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, color: '#1a1a1a' }}>🏷️ 핵심 키워드</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.keywords.map((keyword: string, idx: number) => (
              <span
                key={idx}
                style={{
                  padding: '6px 12px',
                  background: '#f0f0f0',
                  borderRadius: 6,
                  fontSize: 14,
                  color: '#333',
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
        {userType === 'HEADHUNTER' && jdList.length > 0 && (
          <button
            onClick={() => setShowJdSelect(true)}
            disabled={generatingProposal}
            style={{
              flex: '1 1 100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: generatingProposal ? 'not-allowed' : 'pointer',
              opacity: generatingProposal ? 0.6 : 1,
            }}
          >
            {generatingProposal ? '⏳ 제안서 생성 중...' : '📄 후보자 제안서 생성'}
          </button>
        )}
        <Link href="/pipeline" style={{ flex: 1 }}>
          <button style={{
            width: '100%',
            padding: '12px',
            background: '#1a1a14',
            color: '#e8ff47',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            파이프라인으로
          </button>
        </Link>
        <Link href="/dashboard" style={{ flex: 1 }}>
          <button style={{
            width: '100%',
            padding: '12px',
            background: '#fff',
            color: '#666',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            대시보드로
          </button>
        </Link>
      </div>

      {/* JD 선택 모달 */}
      {showJdSelect && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowJdSelect(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              제안서에 반영할 JD 선택
            </h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              어떤 채용 공고에 대한 제안서를 생성하시겠습니까?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jdList.map((jd) => {
                const hasSaved = savedProposals[jd.id]
                return (
                  <div
                    key={jd.id}
                    onClick={() => hasSaved ? downloadSavedProposal(jd.id) : generateProposal(jd.id)}
                    style={{
                      padding: '16px',
                      border: hasSaved ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: hasSaved ? '#f5f3ff' : '#fff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8b5cf6'
                      e.currentTarget.style.background = '#f5f3ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = hasSaved ? '#8b5cf6' : '#e5e7eb'
                      e.currentTarget.style.background = hasSaved ? '#f5f3ff' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {jd.result.company} {jd.result.position && `- ${jd.result.position}`}
                      </div>
                      {hasSaved && (
                        <span style={{
                          padding: '4px 8px',
                          background: '#8b5cf6',
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          생성 완료
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      적합도: {jd.result.fit_score}점 | {new Date(jd.created_at).toLocaleDateString('ko-KR')}
                    </div>
                    <div style={{ fontSize: 12, color: hasSaved ? '#8b5cf6' : '#999', marginTop: 6 }}>
                      {hasSaved ? '📥 클릭하면 즉시 다운로드' : '📄 클릭하면 제안서 생성'}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowJdSelect(false)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '12px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
