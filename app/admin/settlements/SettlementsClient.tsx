'use client'

import { useState, useEffect } from 'react'

interface SummaryData {
  grossRevenue: number
  netRevenue: number
  totalRefunds: number
  mrr: number
  arpu: number
  activeSubscriptions: number
  planCounts: { PRO: number; EXPERT: number }
  period: { start: string; end: string }
}

interface Payment {
  id: string
  user_email: string
  plan: string
  amount: number
  status: string
  payment_method: string | null
  paid_at: string
  transaction_id: string | null
}

interface PaymentsData {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SettlementsClient() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [payments, setPayments] = useState<PaymentsData | null>(null)
  const [loading, setLoading] = useState(true)

  // 필터 상태
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'lastMonth' | 'custom'>('month')
  const [planFilter, setPlanFilter] = useState<'ALL' | 'PRO' | 'EXPERT'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'success' | 'failed' | 'refunded' | 'pending'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 기간 계산
  const getDateRange = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    switch (dateRange) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        }
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        return {
          start: weekAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        }
      case 'month':
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        }
      case 'lastMonth':
        return {
          start: new Date(year, month - 1, 1).toISOString().split('T')[0],
          end: new Date(year, month, 0).toISOString().split('T')[0]
        }
      default:
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        }
    }
  }

  // 요약 데이터 로드
  useEffect(() => {
    const fetchSummary = async () => {
      const { start, end } = getDateRange()
      const res = await fetch(`/api/admin/settlements/summary?start=${start}&end=${end}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    }
    fetchSummary()
  }, [dateRange])

  // 결제 내역 로드
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        plan: planFilter,
        status: statusFilter,
      })
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/settlements/payments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
      setLoading(false)
    }
    fetchPayments()
  }, [currentPage, planFilter, statusFilter, searchQuery])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      success: { bg: '#10b981', text: '#fff', label: '✅ 성공' },
      failed: { bg: '#ef4444', text: '#fff', label: '❌ 실패' },
      refunded: { bg: '#f59e0b', text: '#fff', label: '🔄 환불' },
      pending: { bg: '#6b7280', text: '#fff', label: '⏳ 대기' },
    }
    const style = styles[status] || styles.pending
    return (
      <span style={{
        background: style.bg,
        color: style.text,
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600
      }}>
        {style.label}
      </span>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', background: '#fafafa', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#18181b' }}>📊 정산 대시보드</h1>

        {/* 기간 선택 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['today', 'week', 'month', 'lastMonth'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: dateRange === range ? '#18181b' : '#fff',
                color: dateRange === range ? '#fff' : '#18181b',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {range === 'today' ? '오늘' : range === 'week' ? '이번 주' : range === 'month' ? '이번 달' : '지난달'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 타일 */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
          {/* 총 매출 */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: 16,
            padding: 24,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>💰 총 매출</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
              {formatCurrency(summary.grossRevenue)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {summary.period.start} ~ {summary.period.end}
            </div>
          </div>

          {/* 순 매출 */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            borderRadius: 16,
            padding: 24,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>✨ 순 매출</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
              {formatCurrency(summary.netRevenue)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              총 매출 - 환불액
            </div>
          </div>

          {/* 환불액 */}
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            borderRadius: 16,
            padding: 24,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>🔄 환불액</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
              {formatCurrency(summary.totalRefunds)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              완료된 환불
            </div>
          </div>

          {/* MRR */}
          <div style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            borderRadius: 16,
            padding: 24,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>📈 MRR</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
              {formatCurrency(summary.mrr)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              활성 구독: {summary.activeSubscriptions}명<br />
              PRO {summary.planCounts.PRO}명 / EXPERT {summary.planCounts.EXPERT}명
            </div>
          </div>
        </div>
      )}

      {/* 결제 내역 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>🔍 결제 내역</h2>

          {/* 필터 */}
          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <option value="ALL">전체 플랜</option>
              <option value="PRO">PRO</option>
              <option value="EXPERT">EXPERT</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <option value="ALL">전체 상태</option>
              <option value="success">성공</option>
              <option value="failed">실패</option>
              <option value="refunded">환불</option>
              <option value="pending">대기</option>
            </select>

            <input
              type="text"
              placeholder="이메일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                width: 200
              }}
            />
          </div>
        </div>

        {/* 테이블 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>로딩 중...</div>
        ) : payments && payments.payments.length > 0 ? (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>일자</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>사용자</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>플랜</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>금액</th>
                  <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>결제방법</th>
                  <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {payments.payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {new Date(payment.paid_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                      {payment.user_email.replace(/(.{4}).*(@.*)/, '$1****$2')}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        background: payment.plan === 'EXPERT' ? '#fef3c7' : '#dbeafe',
                        color: payment.plan === 'EXPERT' ? '#92400e' : '#1e40af',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        {payment.plan}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right', fontSize: 14, fontWeight: 700 }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
                      {payment.payment_method || '-'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {getStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {payments.pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: currentPage === 1 ? '#f3f4f6' : '#18181b',
                    color: currentPage === 1 ? '#9ca3af' : '#fff',
                    fontWeight: 600,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  이전
                </button>
                <span style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600 }}>
                  {currentPage} / {payments.pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(payments.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === payments.pagination.totalPages}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: currentPage === payments.pagination.totalPages ? '#f3f4f6' : '#18181b',
                    color: currentPage === payments.pagination.totalPages ? '#9ca3af' : '#fff',
                    fontWeight: 600,
                    cursor: currentPage === payments.pagination.totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            결제 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
