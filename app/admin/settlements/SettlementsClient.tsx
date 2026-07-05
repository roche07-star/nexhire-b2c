'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'

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

interface ChartData {
  month: string
  revenue: number
  refunds: number
  net: number
}

interface Refund {
  id: string
  user_email: string
  amount: number
  reason: string
  status: string
  requested_at: string
  processed_at: string | null
}

interface RefundsData {
  refunds: Refund[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SettlementsClient() {
  const [activeTab, setActiveTab] = useState<'summary' | 'payments' | 'refunds'>('summary')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [payments, setPayments] = useState<PaymentsData | null>(null)
  const [refunds, setRefunds] = useState<RefundsData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  // 필터 상태
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'lastMonth'>('month')
  const [planFilter, setPlanFilter] = useState<'ALL' | 'PRO' | 'EXPERT'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'success' | 'failed' | 'refunded' | 'pending'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [refundPage, setRefundPage] = useState(1)

  // 환불 모달 상태
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [refundReason, setRefundReason] = useState('')

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

  // 차트 데이터 로드
  useEffect(() => {
    const fetchChartData = async () => {
      const year = new Date().getFullYear()
      const res = await fetch(`/api/admin/settlements/chart?start=${year}-01-01&end=${year}-12-31`)
      if (res.ok) {
        const { data } = await res.json()
        setChartData(data || [])
      }
    }
    if (activeTab === 'summary') {
      fetchChartData()
    }
  }, [activeTab])

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
    if (activeTab === 'payments') {
      fetchPayments()
    }
  }, [activeTab, currentPage, planFilter, statusFilter, searchQuery])

  // 환불 내역 로드
  useEffect(() => {
    const fetchRefunds = async () => {
      setLoading(true)
      const res = await fetch(`/api/admin/settlements/refund?page=${refundPage}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setRefunds(data)
      }
      setLoading(false)
    }
    if (activeTab === 'refunds') {
      fetchRefunds()
    }
  }, [activeTab, refundPage])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      success: { bg: '#10b981', text: '#fff', label: '✅ 성공' },
      failed: { bg: '#ef4444', text: '#fff', label: '❌ 실패' },
      refunded: { bg: '#f59e0b', text: '#fff', label: '🔄 환불' },
      pending: { bg: '#6b7280', text: '#fff', label: '⏳ 대기' },
      approved: { bg: '#10b981', text: '#fff', label: '✅ 승인' },
      rejected: { bg: '#ef4444', text: '#fff', label: '❌ 거부' },
      completed: { bg: '#3b82f6', text: '#fff', label: '✅ 완료' },
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

  // 환불 처리
  const handleRefund = async () => {
    if (!selectedPayment || !refundReason.trim()) {
      alert('환불 사유를 입력해주세요')
      return
    }

    if (!confirm(`${formatCurrency(selectedPayment.amount)} 환불을 진행하시겠습니까?`)) {
      return
    }

    const res = await fetch('/api/admin/settlements/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: selectedPayment.id,
        amount: selectedPayment.amount,
        reason: refundReason,
      }),
    })

    if (res.ok) {
      alert('환불이 완료되었습니다')
      setShowRefundModal(false)
      setSelectedPayment(null)
      setRefundReason('')
      // 결제 내역 새로고침
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        plan: planFilter,
        status: statusFilter,
      })
      const refreshRes = await fetch(`/api/admin/settlements/payments?${params}`)
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setPayments(data)
      }
    } else {
      const error = await res.json()
      alert(`환불 실패: ${error.error}`)
    }
  }

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (!payments || payments.payments.length === 0) {
      alert('다운로드할 데이터가 없습니다')
      return
    }

    const excelData = payments.payments.map((p) => ({
      일자: new Date(p.paid_at).toLocaleString('ko-KR'),
      사용자: p.user_email,
      플랜: p.plan,
      금액: p.amount,
      결제방법: p.payment_method || '-',
      상태: p.status,
      거래ID: p.transaction_id || '-',
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '결제내역')
    XLSX.writeFile(wb, `결제내역_${new Date().toISOString().split('T')[0]}.xlsx`)
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

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '2px solid #e5e7eb' }}>
        {(['summary', 'payments', 'refunds'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab ? '3px solid #18181b' : '3px solid transparent',
              color: activeTab === tab ? '#18181b' : '#6b7280',
              fontWeight: activeTab === tab ? 700 : 600,
              fontSize: 15,
              cursor: 'pointer',
              marginBottom: -2,
              transition: 'all 0.2s'
            }}
          >
            {tab === 'summary' ? '📊 요약' : tab === 'payments' ? '💳 결제내역' : '🔄 환불'}
          </button>
        ))}
      </div>

      {/* 요약 탭 */}
      {activeTab === 'summary' && summary && (
        <>
          {/* KPI 타일 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
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

          {/* 월별 매출 차트 */}
          {chartData.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>📈 월별 매출 추이</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="총 매출" />
                  <Bar dataKey="refunds" fill="#ef4444" name="환불액" />
                  <Bar dataKey="net" fill="#10b981" name="순 매출" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* 결제 내역 탭 */}
      {activeTab === 'payments' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>🔍 결제 내역</h2>

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

              <button
                onClick={handleExcelDownload}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                📥 엑셀 다운로드
              </button>
            </div>
          </div>

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
                    <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>액션</th>
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
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {payment.status === 'success' && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowRefundModal(true)
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              border: '1px solid #ef4444',
                              background: '#fff',
                              color: '#ef4444',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            환불
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
      )}

      {/* 환불 탭 */}
      {activeTab === 'refunds' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>🔄 환불 내역</h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>로딩 중...</div>
          ) : refunds && refunds.refunds.length > 0 ? (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>요청일</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>사용자</th>
                    <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>금액</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>사유</th>
                    <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>상태</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>처리일</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.refunds.map((refund) => (
                    <tr key={refund.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: 12, fontSize: 13 }}>
                        {new Date(refund.requested_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                        {refund.user_email.replace(/(.{4}).*(@.*)/, '$1****$2')}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', fontSize: 14, fontWeight: 700 }}>
                        {formatCurrency(refund.amount)}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                        {refund.reason}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {getStatusBadge(refund.status)}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                        {refund.processed_at
                          ? new Date(refund.processed_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {refunds.pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                  <button
                    onClick={() => setRefundPage(Math.max(1, refundPage - 1))}
                    disabled={refundPage === 1}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: refundPage === 1 ? '#f3f4f6' : '#18181b',
                      color: refundPage === 1 ? '#9ca3af' : '#fff',
                      fontWeight: 600,
                      cursor: refundPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    이전
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600 }}>
                    {refundPage} / {refunds.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setRefundPage(Math.min(refunds.pagination.totalPages, refundPage + 1))}
                    disabled={refundPage === refunds.pagination.totalPages}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: refundPage === refunds.pagination.totalPages ? '#f3f4f6' : '#18181b',
                      color: refundPage === refunds.pagination.totalPages ? '#9ca3af' : '#fff',
                      fontWeight: 600,
                      cursor: refundPage === refunds.pagination.totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              환불 내역이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 환불 모달 */}
      {showRefundModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: '100%',
            margin: 20
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>환불 처리</h3>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>사용자</p>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{selectedPayment.user_email}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>환불 금액</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{formatCurrency(selectedPayment.amount)}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>환불 사유 *</p>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="환불 사유를 입력해주세요"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  minHeight: 100,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowRefundModal(false)
                  setSelectedPayment(null)
                  setRefundReason('')
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#18181b',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleRefund}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                환불 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
