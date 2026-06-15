'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalysisResult {
  id: string
  result: any
  createdAt: string
  stage: string
}

export default function ResultClient({ analysisId }: { analysisId: string }) {
  const router = useRouter()
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      {/* 커리어 경로 */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ fontSize: 18, marginBottom: 16, color: '#1a1a1a' }}>📊 커리어 경로</h2>
        {result.career_paths && result.career_paths.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result.career_paths.map((path: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              >
                <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1a1a1a' }}>
                  {path.type === 'BASELINE' && '🔵 기본 경로'}
                  {path.type === 'RECOMMENDED' && '⭐ 추천 경로'}
                  {path.type === 'STRETCH' && '📈 도전 경로'}
                </h3>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>{path.description}</p>
                {path.milestones && path.milestones.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>주요 단계:</div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#333' }}>
                      {path.milestones.map((milestone: any, mIdx: number) => (
                        <li key={mIdx} style={{ fontSize: 14, marginBottom: 4 }}>
                          {milestone.year}년차: {milestone.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: 40,
            textAlign: 'center',
            background: '#fef3c7',
            borderRadius: 8,
            border: '1px solid #fde68a',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 15, color: '#92400e', fontWeight: 600 }}>
              커리어 경로는 PRO 플랜에서 제공됩니다
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#b45309' }}>
              {result.plan === 'FREE'
                ? 'PRO 플랜으로 업그레이드하여 3가지 커리어 경로를 확인하세요!'
                : '커리어 경로 정보가 없습니다. 다시 분석해주세요.'}
            </p>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
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
    </main>
  )
}
