/**
 * 키워드 성과 분석 대시보드
 *
 * 관리자 전용: 키워드별 전환율 확인 및 최적화
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeywordStat {
  keyword: string
  source: string
  signups: number
  conversions: number
  conversionRate: number
  revenue: number
  lastSignup: string
}

interface Summary {
  totalKeywords: number
  totalSignups: number
  totalConversions: number
  totalRevenue: number
  avgConversionRate: number
}

export default function KeywordAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [keywords, setKeywords] = useState<KeywordStat[]>([])

  useEffect(() => {
    fetch('/api/admin/keyword-analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummary(data.summary)
          setKeywords(data.keywords)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('키워드 분석 로드 실패:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.push('/admin')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#999',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← 관리자 홈
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          키워드 성과 분석
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          광고 키워드별 전환율을 확인하고 예산을 최적화하세요
        </p>
      </div>

      {/* 요약 통계 */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              총 키워드
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {summary.totalKeywords}개
            </div>
          </div>

          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              총 가입
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {summary.totalSignups}명
            </div>
          </div>

          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              유료 전환
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
              {summary.totalConversions}명
            </div>
          </div>

          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              평균 전환율
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
              {summary.avgConversionRate.toFixed(1)}%
            </div>
          </div>

          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              총 수익
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
              {(summary.totalRevenue / 10000).toFixed(0)}만원
            </div>
          </div>
        </div>
      )}

      {/* 키워드 테이블 */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>
                키워드
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>
                소스
              </th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                가입
              </th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                전환
              </th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                전환율
              </th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                수익
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>
                최근 가입
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {keywords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  아직 데이터가 없습니다. 광고를 시작하면 여기에 표시됩니다.
                </td>
              </tr>
            ) : (
              keywords.map((kw, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff'
                  }}
                >
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>
                    {kw.keyword}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {kw.source}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px' }}>
                    {kw.signups}명
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#10b981' }}>
                    {kw.conversions}명
                  </td>
                  <td
                    style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: kw.conversionRate >= 5 ? '#10b981' : kw.conversionRate >= 2 ? '#3b82f6' : '#ef4444',
                    }}
                  >
                    {kw.conversionRate.toFixed(1)}%
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px' }}>
                    {(kw.revenue / 10000).toFixed(0)}만원
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#999' }}>
                    {new Date(kw.lastSignup).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {kw.conversionRate >= 5 ? (
                      <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                        ✅ 우수
                      </span>
                    ) : kw.conversionRate >= 2 ? (
                      <span style={{ fontSize: '13px', color: '#3b82f6' }}>⚠️ 모니터링</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#ef4444' }}>❌ 검토 필요</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 가이드 */}
      <div
        style={{
          marginTop: '32px',
          padding: '20px',
          background: '#fffbeb',
          borderRadius: '12px',
          border: '1px solid #fde68a',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          💡 최적화 가이드
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
          <li>
            <strong style={{ color: '#10b981' }}>전환율 5% 이상:</strong> 우수 키워드 - 예산 증액 고려
          </li>
          <li>
            <strong style={{ color: '#3b82f6' }}>전환율 2-5%:</strong> 모니터링 - 현재 유지
          </li>
          <li>
            <strong style={{ color: '#ef4444' }}>전환율 2% 미만:</strong> 검토 필요 - 일시정지 또는 예산 축소
          </li>
          <li>광고 시작 후 2주간 데이터 수집 후 최적화를 시작하세요</li>
          <li>키워드는 주 1회 검토하는 것을 권장합니다</li>
        </ul>
      </div>
    </div>
  )
}
