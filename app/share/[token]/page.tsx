'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface SharedAnalysis {
  result: {
    job_title?: string
    scores?: {
      job_fit: number
      market_competitiveness: number
      growth_potential: number
    }
    strengths: string[]
    improvements: string[]
    keywords: string[]
    summary: string
    career_paths?: Array<{
      type: string
      label: string
      title: string
      salary_range: string
      points: string[]
    }>
  }
  created_at: string
  expires_at?: string
  shared: boolean
}

export default function SharedAnalysisPage() {
  const params = useParams()
  const token = params.token as string
  const [analysis, setAnalysis] = useState<SharedAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSharedAnalysis() {
      try {
        const res = await fetch(`/api/share/${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || '분석 결과를 불러올 수 없습니다.')
        } else {
          setAnalysis(data)
        }
      } catch {
        setError('네트워크 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    if (token) loadSharedAnalysis()
  }, [token])

  if (loading) {
    return (
      <main style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '40px auto' }} />
        <p>공유된 분석 결과를 불러오는 중...</p>
      </main>
    )
  }

  if (error || !analysis) {
    return (
      <main style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16, color: 'var(--danger)' }}>⚠️ {error || '오류'}</h1>
        <p style={{ marginBottom: 32, color: 'var(--text-secondary)' }}>
          {error === '공유 기간이 만료되었습니다.'
            ? '이 분석 결과의 공유 기간이 만료되었습니다. 분석 소유자에게 새 공유 링크를 요청해 주세요.'
            : '공유 링크가 유효하지 않거나 삭제되었습니다.'}
        </p>
        <Link href="/">
          <button className="btn-plan btn-plan-fill">홈으로 돌아가기</button>
        </Link>
      </main>
    )
  }

  const { result, created_at, expires_at } = analysis

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>🔗</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>공유된 이력서 분석 결과</h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              분석일: {new Date(created_at).toLocaleDateString('ko-KR')}
              {expires_at && ` · 공유 만료: ${new Date(expires_at).toLocaleDateString('ko-KR')}`}
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(232, 255, 71, 0.1)',
          borderLeft: '3px solid var(--accent)',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--text-secondary)'
        }}>
          💡 이 분석 결과는 읽기 전용입니다. 본인의 이력서를 분석하려면 <Link href="/analyze" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>여기</Link>를 클릭하세요.
        </div>
      </div>

      {/* Scores */}
      {result.scores && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>직무 적합도</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>{result.scores.job_fit}%</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>시장 경쟁력</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>{result.scores.market_competitiveness}%</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>성장 가능성</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#e8a020' }}>{result.scores.growth_potential}%</div>
          </div>
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">종합 요약</div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>{result.summary}</p>
        </div>
      )}

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">핵심 강점</div>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.strengths.map((s, i) => (
              <li key={i} style={{ fontSize: 14, color: 'var(--success)' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {result.improvements?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">개선 포인트</div>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.improvements.map((s, i) => (
              <li key={i} style={{ fontSize: 14, color: 'var(--warn)' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Career Paths */}
      {result.career_paths && result.career_paths.length > 0 && (
        <div className="card">
          <div className="card-title">커리어 경로</div>
          {result.career_paths.map((path, idx) => (
            <div key={idx} style={{ marginBottom: idx < result.career_paths!.length - 1 ? 20 : 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {path.label} - {path.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                예상 연봉: {path.salary_range}
              </div>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {path.points.map((p, i) => (
                  <li key={i} style={{ fontSize: 13 }}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>당신의 커리어도 분석해보세요!</p>
        <Link href="/analyze">
          <button className="btn-plan btn-plan-fill" style={{ padding: '14px 32px' }}>
            무료로 시작하기 →
          </button>
        </Link>
      </div>
    </main>
  )
}
