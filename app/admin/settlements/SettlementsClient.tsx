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
  description: string | null
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
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // 1~12
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
        // selectedMonth 기준 (1~12)
        const monthStart = new Date(year, selectedMonth - 1, 1)
        const monthEnd = new Date(year, selectedMonth, 0)
        return {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        }
    }
  }

  // 요약 데이터 로드
  useEffect(() => {
    const fetchSummary = async () => {
      const { start, end } = getDateRange()
      console.log('요약 데이터 요청:', { start, end })
      const res = await fetch(`/api/admin/settlements/summary?start=${start}&end=${end}`)
      console.log('요약 API 응답 상태:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('요약 데이터:', data)
        setSummary(data)
      } else {
        console.error('요약 데이터 로드 실패:', await res.text())
      }
    }
    fetchSummary()
  }, [dateRange, selectedMonth])

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

      console.log('결제 내역 요청:', params.toString())
      const res = await fetch(`/api/admin/settlements/payments?${params}`)
      console.log('결제 API 응답 상태:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('결제 데이터:', data)
        setPayments(data)
      } else {
        console.error('결제 내역 로드 실패:', await res.text())
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
      <span className="status-badge" style={{
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
      플랜: p.description || p.plan,
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
    <>
      <div className="settlements-container">
        {/* 헤더 */}
        <div className="header">
          <h1 className="title">📊 정산 대시보드</h1>

          {/* 기간 선택 */}
          <div className="date-range-buttons">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`date-btn ${dateRange === range ? 'active' : ''}`}
              >
                {range === 'today' ? '오늘' : range === 'week' ? '이번 주' : `${selectedMonth}월`}
              </button>
            ))}
            {dateRange === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  marginLeft: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tabs-container">
          <div className="tabs">
            {(['summary', 'payments', 'refunds'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab === 'summary' ? '📊 요약' : tab === 'payments' ? '💳 결제내역' : '🔄 환불'}
              </button>
            ))}
          </div>
        </div>

        {/* 요약 탭 */}
        {activeTab === 'summary' && summary && (
          <>
            {/* KPI 타일 */}
            <div className="kpi-grid">
              <div className="kpi-tile kpi-blue">
                <div className="kpi-label">💰 총 매출</div>
                <div className="kpi-value">{formatCurrency(summary.grossRevenue)}</div>
                <div className="kpi-subtitle">{summary.period.start} ~ {summary.period.end}</div>
              </div>

              <div className="kpi-tile kpi-green">
                <div className="kpi-label">✨ 순 매출</div>
                <div className="kpi-value">{formatCurrency(summary.netRevenue)}</div>
                <div className="kpi-subtitle">총 매출 - 환불액</div>
              </div>

              <div className="kpi-tile kpi-red">
                <div className="kpi-label">🔄 환불액</div>
                <div className="kpi-value">{formatCurrency(summary.totalRefunds)}</div>
                <div className="kpi-subtitle">완료된 환불</div>
              </div>

              <div className="kpi-tile kpi-purple">
                <div className="kpi-label">📈 MRR</div>
                <div className="kpi-value">{formatCurrency(summary.mrr)}</div>
                <div className="kpi-subtitle">
                  활성 구독: {summary.activeSubscriptions}명<br />
                  PRO {summary.planCounts.PRO}명 / EXPERT {summary.planCounts.EXPERT}명
                </div>
              </div>
            </div>

            {/* 월별 매출 차트 */}
            {chartData.length > 0 && (
              <div className="chart-container">
                <h2 className="section-title">📈 월별 매출 추이</h2>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                        formatter={(value: any) => formatCurrency(Number(value) || 0)}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      <Bar dataKey="revenue" fill="#3b82f6" name="총 매출" />
                      <Bar dataKey="refunds" fill="#ef4444" name="환불액" />
                      <Bar dataKey="net" fill="#10b981" name="순 매출" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* 결제 내역 탭 */}
        {activeTab === 'payments' && (
          <div className="content-container">
            <div className="content-header">
              <h2 className="section-title">🔍 결제 내역</h2>

              <div className="filters">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="filter-select"
                >
                  <option value="ALL">전체 플랜</option>
                  <option value="PRO">PRO</option>
                  <option value="EXPERT">EXPERT</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="filter-select"
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
                  className="search-input"
                />

                <button onClick={handleExcelDownload} className="excel-btn">
                  📥 엑셀
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : payments && payments.payments.length > 0 ? (
              <>
                {/* 데스크톱 테이블 */}
                <div className="desktop-table">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>일자</th>
                        <th>사용자</th>
                        <th>플랜</th>
                        <th className="text-right">금액</th>
                        <th className="text-center">결제방법</th>
                        <th className="text-center">상태</th>
                        <th className="text-center">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                          <td className="email">{payment.user_email}</td>
                          <td>
                            <span className={`plan-badge ${payment.plan === 'EXPERT' ? 'expert' : payment.plan === 'STORE' ? 'store' : 'pro'}`}>
                              {payment.description || payment.plan}
                            </span>
                          </td>
                          <td className="text-right amount" style={{ minWidth: '100px', fontWeight: 700 }}>{payment.amount ? formatCurrency(payment.amount) : '0원'}</td>
                          <td className="text-center method">{payment.payment_method || '-'}</td>
                          <td className="text-center">{getStatusBadge(payment.status)}</td>
                          <td className="text-center">
                            {payment.status === 'success' && (
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setShowRefundModal(true)
                                }}
                                className="refund-btn"
                              >
                                환불
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일 카드 */}
                <div className="mobile-cards">
                  {payments.payments.map((payment) => (
                    <div key={payment.id} className="payment-card">
                      <div className="card-header">
                        <span className={`plan-badge ${payment.plan === 'EXPERT' ? 'expert' : payment.plan === 'STORE' ? 'store' : 'pro'}`}>
                          {payment.description || payment.plan}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="card-amount">{payment.amount ? formatCurrency(payment.amount) : '0원'}</div>
                      <div className="card-details">
                        <div className="detail-row">
                          <span className="label">사용자</span>
                          <span className="value">{payment.user_email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">일자</span>
                          <span className="value">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">결제방법</span>
                          <span className="value">{payment.payment_method || '-'}</span>
                        </div>
                      </div>
                      {payment.status === 'success' && (
                        <button
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowRefundModal(true)
                          }}
                          className="card-refund-btn"
                        >
                          환불 처리
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {payments.pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      이전
                    </button>
                    <span className="page-info">
                      {currentPage} / {payments.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(payments.pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === payments.pagination.totalPages}
                      className="page-btn"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">결제 내역이 없습니다.</div>
            )}
          </div>
        )}

        {/* 환불 탭 */}
        {activeTab === 'refunds' && (
          <div className="content-container">
            <h2 className="section-title">🔄 환불 내역</h2>

            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : refunds && refunds.refunds.length > 0 ? (
              <>
                {/* 데스크톱 테이블 */}
                <div className="desktop-table">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>요청일</th>
                        <th>사용자</th>
                        <th className="text-right">금액</th>
                        <th>사유</th>
                        <th className="text-center">상태</th>
                        <th>처리일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.refunds.map((refund) => (
                        <tr key={refund.id}>
                          <td>{new Date(refund.requested_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="email">{refund.user_email}</td>
                          <td className="text-right amount">{formatCurrency(refund.amount)}</td>
                          <td className="reason">{refund.reason}</td>
                          <td className="text-center">{getStatusBadge(refund.status)}</td>
                          <td>{refund.processed_at ? new Date(refund.processed_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일 카드 */}
                <div className="mobile-cards">
                  {refunds.refunds.map((refund) => (
                    <div key={refund.id} className="payment-card">
                      <div className="card-header">
                        {getStatusBadge(refund.status)}
                      </div>
                      <div className="card-amount">{formatCurrency(refund.amount)}</div>
                      <div className="card-details">
                        <div className="detail-row">
                          <span className="label">사용자</span>
                          <span className="value">{refund.user_email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">요청일</span>
                          <span className="value">{new Date(refund.requested_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">사유</span>
                          <span className="value">{refund.reason}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">처리일</span>
                          <span className="value">{refund.processed_at ? new Date(refund.processed_at).toLocaleDateString('ko-KR') : '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {refunds.pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setRefundPage(Math.max(1, refundPage - 1))}
                      disabled={refundPage === 1}
                      className="page-btn"
                    >
                      이전
                    </button>
                    <span className="page-info">
                      {refundPage} / {refunds.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setRefundPage(Math.min(refunds.pagination.totalPages, refundPage + 1))}
                      disabled={refundPage === refunds.pagination.totalPages}
                      className="page-btn"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">환불 내역이 없습니다.</div>
            )}
          </div>
        )}

        {/* 환불 모달 */}
        {showRefundModal && selectedPayment && (
          <div className="modal-overlay" onClick={() => {
            setShowRefundModal(false)
            setSelectedPayment(null)
            setRefundReason('')
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">환불 처리</h3>

              <div className="modal-field">
                <p className="field-label">사용자</p>
                <p className="field-value">{selectedPayment.user_email}</p>
              </div>

              <div className="modal-field">
                <p className="field-label">환불 금액</p>
                <p className="field-value refund-amount">{formatCurrency(selectedPayment.amount)}</p>
              </div>

              <div className="modal-field">
                <p className="field-label">환불 사유 *</p>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="환불 사유를 입력해주세요"
                  className="refund-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowRefundModal(false)
                    setSelectedPayment(null)
                    setRefundReason('')
                  }}
                  className="cancel-btn"
                >
                  취소
                </button>
                <button onClick={handleRefund} className="confirm-btn">
                  환불 처리
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .settlements-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: #fafafa;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .title {
          font-size: 24px;
          font-weight: 800;
          color: #18181b;
          margin: 0;
        }

        .date-range-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .date-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          background: #fff;
          color: #18181b;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .date-btn.active {
          background: #18181b;
          color: #fff;
        }

        .tabs-container {
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tabs {
          display: flex;
          gap: 8px;
          min-width: max-content;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: transparent;
          border-bottom: 3px solid transparent;
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: -2px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab.active {
          border-bottom-color: #18181b;
          color: #18181b;
          font-weight: 700;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-tile {
          border-radius: 16px;
          padding: 20px;
          color: #fff;
        }

        .kpi-blue {
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .kpi-green {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .kpi-red {
          background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .kpi-purple {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .kpi-label {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .kpi-value {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .kpi-subtitle {
          font-size: 11px;
          opacity: 0.8;
          line-height: 1.4;
        }

        .chart-container, .content-container {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .chart-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-select, .search-input {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 13px;
          font-weight: 600;
        }

        .search-input {
          width: 150px;
        }

        .excel-btn {
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: #10b981;
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }

        .desktop-table {
          display: block;
          overflow-x: auto;
        }

        .mobile-cards {
          display: none;
        }

        .payments-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .payments-table thead tr {
          border-bottom: 2px solid #e5e7eb;
        }

        .payments-table th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
        }

        .payments-table td {
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid #f3f4f6;
          color: #18181b !important;
        }

        .text-right {
          text-align: right !important;
        }

        .text-center {
          text-align: center !important;
        }

        .email {
          color: #6b7280;
        }

        .amount {
          font-weight: 700;
          font-size: 14px;
          color: #18181b !important;
        }

        .method {
          color: #6b7280;
          font-size: 12px;
        }

        .reason {
          color: #6b7280;
          max-width: 200px;
        }

        .plan-badge {
          padding: 4px 8px;
          borderRadius: 6px;
          fontSize: 12px;
          fontWeight: 700;
          white-space: nowrap;
        }

        .plan-badge.expert {
          background: #fef3c7;
          color: #92400e;
        }

        .plan-badge.pro {
          background: #dbeafe;
          color: #1e40af;
        }

        .plan-badge.store {
          background: #e0e7ff;
          color: #4338ca;
        }

        .refund-btn {
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid #ef4444;
          background: #fff;
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .loading, .empty-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
        }

        .page-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: #18181b;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }

        .page-btn:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .page-info {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #fff;
          borderRadius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
        }

        .modal-field {
          margin-bottom: 16px;
        }

        .field-label {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .field-value {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
        }

        .refund-amount {
          font-size: 18px;
          font-weight: 700;
          color: #ef4444;
        }

        .refund-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
          min-height: 80px;
          resize: vertical;
          font-family: inherit;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .cancel-btn, .confirm-btn {
          flex: 1;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #18181b;
        }

        .confirm-btn {
          border: none;
          background: #ef4444;
          color: #fff;
        }

        /* 모바일 최적화 */
        @media (max-width: 768px) {
          .settlements-container {
            padding: 16px;
          }

          .title {
            font-size: 20px;
          }

          .date-btn {
            padding: 6px 10px;
            font-size: 11px;
          }

          .tab {
            padding: 10px 14px;
            font-size: 13px;
          }

          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .kpi-tile {
            padding: 16px;
          }

          .kpi-value {
            font-size: 22px;
          }

          .kpi-subtitle {
            font-size: 10px;
          }

          .chart-container, .content-container {
            padding: 16px;
          }

          .section-title {
            font-size: 16px;
          }

          .content-header {
            flex-direction: column;
            align-items: stretch;
          }

          .filters {
            flex-direction: column;
          }

          .filter-select, .search-input, .excel-btn {
            width: 100%;
          }

          .desktop-table {
            display: none;
          }

          .mobile-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .payment-card {
            background: #f9fafb;
            border-radius: 12px;
            padding: 16px;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .card-amount {
            font-size: 24px;
            font-weight: 800;
            color: #18181b;
            margin-bottom: 12px;
          }

          .card-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }

          .detail-row .label {
            color: #6b7280;
            font-weight: 500;
          }

          .detail-row .value {
            color: #18181b;
            font-weight: 600;
            text-align: right;
          }

          .card-refund-btn {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #ef4444;
            background: #fff;
            color: #ef4444;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .modal-content {
            padding: 20px;
          }

          .modal-title {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .date-range-buttons {
            width: 100%;
          }

          .date-btn {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>
    </>
  )
}
