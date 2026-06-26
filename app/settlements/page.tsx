'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Settlement {
  id: string
  candidate_name: string
  company?: string
  position?: string
  start_date: string
  salary: number
  commission_rate: number
  incentive_rate: number
  personal_override: number
  memo?: string
  year: number
}

export default function SettlementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [goalAmount] = useState(5000)
  const [formData, setFormData] = useState({
    candidate_name: '',
    company: '',
    position: '',
    start_date: '',
    salary: 0,
    commission_rate: 17,
    incentive_rate: 70,
    personal_override: 0,
    memo: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.userType !== 'HEADHUNTER') {
      alert('헤드헌터 전용 기능입니다.')
      router.push('/')
      return
    }
    if (session.user.plan === 'FREE') {
      alert('PRO 이상 플랜이 필요합니다.')
      router.push('/pricing')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user.userType === 'HEADHUNTER') {
      loadSettlements()
    }
  }, [selectedYear, session])

  const loadSettlements = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/settlements?year=${selectedYear}`)
      const data = await res.json()
      if (res.ok) {
        setSettlements(data.settlements || [])
      } else {
        alert(data.error || '조회 실패')
      }
    } catch (err) {
      alert('서버 연결 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.candidate_name || !formData.start_date || !formData.salary) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    try {
      const url = editingId ? `/api/settlements/${editingId}` : '/api/settlements'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        alert(editingId ? '수정되었습니다.' : '등록되었습니다.')
        setShowForm(false)
        setEditingId(null)
        resetForm()
        loadSettlements()
      } else {
        alert(data.error || '실패')
      }
    } catch (err) {
      alert('서버 연결 실패')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/settlements/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('삭제되었습니다.')
        loadSettlements()
      } else {
        const data = await res.json()
        alert(data.error || '삭제 실패')
      }
    } catch (err) {
      alert('서버 연결 실패')
    }
  }

  const startEdit = (s: Settlement) => {
    setFormData({
      candidate_name: s.candidate_name,
      company: s.company || '',
      position: s.position || '',
      start_date: s.start_date,
      salary: s.salary,
      commission_rate: s.commission_rate,
      incentive_rate: s.incentive_rate,
      personal_override: s.personal_override,
      memo: s.memo || '',
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      candidate_name: '',
      company: '',
      position: '',
      start_date: '',
      salary: 0,
      commission_rate: 17,
      incentive_rate: 70,
      personal_override: 0,
      memo: '',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const calculateCommission = (salary: number, rate: number) => Math.round(salary * (rate / 100) * 10) / 10
  const calculatePersonalCommission = (commission: number) => Math.round(commission / 2 * 10) / 10
  const calculateIncentive = (commission: number, rate: number) => Math.round(commission * (rate / 100) * 10) / 10
  const calculateTax = (commission: number, incentive: number, taxRate: number) =>
    Math.round((commission - incentive) * (taxRate / 100) * 10) / 10
  const calculateNetIncome = (incentive: number, tax: number) => Math.round((incentive - tax) * 10) / 10

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const stats = settlements.reduce(
    (acc, s) => {
      const commission = calculateCommission(s.salary, s.commission_rate)
      const personalCommission = calculatePersonalCommission(commission)
      const incentive = calculateIncentive(personalCommission, s.incentive_rate)

      return {
        totalSalary: acc.totalSalary + s.salary,
        totalCommission: acc.totalCommission + commission,
        totalPersonalCommission: acc.totalPersonalCommission + personalCommission,
        totalIncentive: acc.totalIncentive + incentive,
        totalCommissionRate: acc.totalCommissionRate + s.commission_rate,
      }
    },
    { totalSalary: 0, totalCommission: 0, totalPersonalCommission: 0, totalIncentive: 0, totalCommissionRate: 0 }
  )

  const avgCommissionRate = settlements.length > 0 ? stats.totalCommissionRate / settlements.length : 0
  const achievementRate = (stats.totalPersonalCommission / goalAmount) * 100
  const remaining = goalAmount - stats.totalPersonalCommission

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-600 border-t-transparent"></div>
          <p className="mt-4 text-stone-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f5f1e8' }}>
      <div className="max-w-[1600px] mx-auto">
        {/* 연도 탭 */}
        <div className="flex items-center gap-3 mb-6">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-8 py-2.5 rounded-xl font-semibold transition-all text-lg ${
                selectedYear === year
                  ? 'text-white shadow-md'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
              style={selectedYear === year ? { backgroundColor: '#b8860b' } : {}}
            >
              {year}년
            </button>
          ))}
          <button
            className="ml-2 w-10 h-10 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-xl text-stone-600"
          >
            +
          </button>
        </div>

        {/* 진행바 */}
        {settlements.length > 0 && (
          <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#e8e1d3' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <span className="font-semibold text-stone-700 text-lg">
                  전환액 (개인매출액 기준)
                </span>
                <span className="text-3xl font-bold text-stone-900">
                  {stats.totalPersonalCommission.toLocaleString()}
                </span>
                <span className="text-stone-600 text-lg">만원</span>
                <button className="px-4 py-1.5 rounded-md text-sm font-medium" style={{ backgroundColor: '#d4c5a9', color: '#6b5d47' }}>
                  수정
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-600">미수금 전환 추가:</span>
                <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-stone-300 text-stone-700">
                  + 추가
                </button>
                <span className="font-bold text-lg" style={{ color: '#b8860b' }}>
                  {achievementRate.toFixed(0)}% 달성
                </span>
                <span className="text-red-600 font-medium">
                  ({remaining > 0 ? remaining.toLocaleString() : '0'}만원 남음)
                </span>
              </div>
            </div>
            <div className="w-full rounded-full h-4" style={{ backgroundColor: '#d4c5a9' }}>
              <div
                className="h-4 rounded-full transition-all"
                style={{
                  width: `${Math.min(achievementRate, 100)}%`,
                  backgroundColor: '#b8860b'
                }}
              />
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        {settlements.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <div className="text-sm text-stone-500 mb-2">총 실매출액</div>
              <div className="text-4xl font-bold mb-1" style={{ color: '#8b7355' }}>
                {stats.totalCommission.toLocaleString()}<span className="text-xl ml-1">만원</span>
              </div>
              <div className="text-xs text-stone-400">{settlements.length}건 입사</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <div className="text-sm text-stone-500 mb-2">개인 매출액</div>
              <div className="text-4xl font-bold mb-1" style={{ color: '#4a7c9e' }}>
                {stats.totalPersonalCommission.toLocaleString()}<span className="text-xl ml-1">만원</span>
              </div>
              <div className="text-xs text-stone-400">실매출 × 1/2</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <div className="text-sm text-stone-500 mb-2">총 인센티브 (실수령)</div>
              <div className="text-4xl font-bold mb-1" style={{ color: '#6b9e4a' }}>
                {stats.totalIncentive.toLocaleString()}<span className="text-xl ml-1">만원</span>
              </div>
              <div className="text-xs text-stone-400">
                세전 {stats.totalPersonalCommission.toLocaleString()} × 세율 {avgCommissionRate.toFixed(2)}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
              <div className="text-sm text-stone-500 mb-2">평균 수수료율</div>
              <div className="text-4xl font-bold mb-1 text-stone-800">
                {avgCommissionRate.toFixed(1)}<span className="text-2xl">%</span>
              </div>
              <div className="text-xs text-stone-400">전체 평균</div>
            </div>
          </div>
        )}

        {/* 정산 내역 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-stone-800">정산 내역</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 rounded-xl text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#b8860b' }}
          >
            + 정산 추가
          </button>
        </div>

        {/* 등록 폼 */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-md border border-stone-200">
            <h3 className="text-lg font-bold mb-4">{editingId ? '정산 수정' : '정산 등록'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">합격자 *</label>
                <input
                  type="text"
                  value={formData.candidate_name}
                  onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">입사일 *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">연봉(만) *</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">수수료율%</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">고과사</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">포지션</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                />
              </div>
              <div className="col-span-3 flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-6 py-2 text-white rounded-lg font-medium"
                  style={{ backgroundColor: '#b8860b' }}
                >
                  {editingId ? '수정' : '등록'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="px-6 py-2 bg-stone-300 text-stone-700 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-xl overflow-hidden shadow-md border border-stone-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-600 border-t-transparent"></div>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              정산 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#f9f6f0' }}>
                    <th className="px-4 py-3 text-left font-semibold text-stone-600">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-600">합격자</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-600">입사일</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">연봉(만)</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">수수료율%</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">실매출액(만)</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">개인매출액(만)</th>
                    <th className="px-4 py-3 text-center font-semibold text-stone-600">누적 개인매출</th>
                    <th className="px-4 py-3 text-center font-semibold text-stone-600">요율</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">인센티브(만)</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">세금(3.3%)</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-600">실수령(만)</th>
                    <th className="px-4 py-3 text-center font-semibold text-stone-600">고과사</th>
                    <th className="px-4 py-3 text-center font-semibold text-stone-600">포지션</th>
                    <th className="px-4 py-3 text-center font-semibold text-stone-600">요율</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s, idx) => {
                    const commission = calculateCommission(s.salary, s.commission_rate)
                    const personalCommission = calculatePersonalCommission(commission)
                    const incentive = calculateIncentive(personalCommission, s.incentive_rate)
                    const tax = calculateTax(personalCommission, incentive, 3.3)
                    const netIncome = calculateNetIncome(incentive, tax)

                    const cumulativeCommission = settlements
                      .slice(0, idx + 1)
                      .reduce((sum, item) => sum + calculatePersonalCommission(calculateCommission(item.salary, item.commission_rate)), 0)

                    return (
                      <tr key={s.id} className="border-t border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-3 text-stone-600">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEdit(s)}
                            className="font-medium hover:underline"
                            style={{ color: '#4a7c9e' }}
                          >
                            {s.candidate_name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-stone-700">{formatDate(s.start_date)}</td>
                        <td className="px-4 py-3 text-right font-medium text-stone-800">{s.salary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-stone-700">{s.commission_rate}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: '#b8860b' }}>{commission.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: '#4a7c9e' }}>{personalCommission.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center font-medium text-stone-700">{cumulativeCommission.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                            {s.incentive_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: '#6b9e4a' }}>{incentive.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-stone-600">{tax.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-stone-800">{netIncome.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-stone-700">{s.company || '-'}</td>
                        <td className="px-4 py-3 text-center text-stone-700">{s.position || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-stone-400 hover:text-red-500 text-xl font-bold"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
