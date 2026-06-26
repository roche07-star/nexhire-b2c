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
  const [goalAmount] = useState(5000) // 목표액 (만원)
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

  const calculateCommission = (salary: number, rate: number) => Math.round(salary * (rate / 100))
  const calculateIncentive = (salary: number, cRate: number, iRate: number, override: number) =>
    Math.round(calculateCommission(salary, cRate) * (iRate / 100)) + override

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const stats = settlements.reduce(
    (acc, s) => ({
      totalSalary: acc.totalSalary + s.salary,
      totalCommission: acc.totalCommission + calculateCommission(s.salary, s.commission_rate),
      totalIncentive:
        acc.totalIncentive +
        calculateIncentive(s.salary, s.commission_rate, s.incentive_rate, s.personal_override),
    }),
    { totalSalary: 0, totalCommission: 0, totalIncentive: 0 }
  )

  const avgCommissionRate = settlements.length > 0
    ? settlements.reduce((sum, s) => sum + s.commission_rate, 0) / settlements.length
    : 0

  const achievementRate = (stats.totalIncentive / goalAmount) * 100

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 연도 탭 */}
        <div className="flex gap-3 mb-6">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedYear === year
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              {year}년
            </button>
          ))}
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 shadow-md"
          >
            + 정산 추가
          </button>
        </div>

        {/* 진행바 */}
        {settlements.length > 0 && (
          <div className="bg-stone-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">💡</span>
                <span className="font-medium text-stone-700">
                  전환액 (개인매출액 기준)
                </span>
                <span className="text-2xl font-bold text-stone-800">
                  {stats.totalCommission.toLocaleString()}
                </span>
                <span className="text-stone-600">만원</span>
                <button className="px-3 py-1 bg-stone-300 text-stone-700 rounded text-sm">수정</button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-600">미수금 전환 추가:</span>
                <button className="px-3 py-1 bg-stone-200 text-stone-700 rounded text-sm">+ 추가</button>
                <span className="text-yellow-600 font-bold">{achievementRate.toFixed(0)}% 달성</span>
                <span className="text-red-500">({(stats.totalIncentive - goalAmount).toLocaleString()}만원 남음)</span>
              </div>
            </div>
            <div className="w-full bg-stone-300 rounded-full h-3">
              <div
                className="bg-yellow-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        {settlements.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-stone-200">
              <div className="text-sm text-stone-600 mb-1">총 실매출액</div>
              <div className="text-3xl font-bold text-stone-800 mb-1">
                {stats.totalSalary.toLocaleString()}<span className="text-lg ml-1">만원</span>
              </div>
              <div className="text-xs text-stone-500">{settlements.length}건 입사</div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-stone-200">
              <div className="text-sm text-stone-600 mb-1">개인 매출액(만)</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats.totalCommission.toLocaleString()}<span className="text-lg ml-1">만원</span>
              </div>
              <div className="text-xs text-stone-500">실매출 × 1/2</div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-stone-200">
              <div className="text-sm text-stone-600 mb-1">총 인센티브 (실수령)</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.totalIncentive.toLocaleString()}<span className="text-lg ml-1">만원</span>
              </div>
              <div className="text-xs text-stone-500">세전 {stats.totalCommission.toLocaleString()} × 세율 {avgCommissionRate.toFixed(2)}</div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-stone-200">
              <div className="text-sm text-stone-600 mb-1">평균 수수료율</div>
              <div className="text-3xl font-bold text-stone-800 mb-1">{avgCommissionRate.toFixed(1)}%</div>
              <div className="text-xs text-stone-500">전체 평균</div>
            </div>
          </div>
        )}

        {/* 등록 폼 */}
        {showForm && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-stone-200">
            <h2 className="text-xl font-bold mb-4">{editingId ? '정산 수정' : '정산 등록'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">후보자 이름 *</label>
                <input
                  type="text"
                  value={formData.candidate_name}
                  onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">입사일 *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">연봉(만) *</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">수수료율%</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">채용사</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">포지션</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">인센티브율%</label>
                <input
                  type="number"
                  value={formData.incentive_rate}
                  onChange={(e) => setFormData({ ...formData, incentive_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-600 text-white rounded font-medium hover:bg-yellow-700"
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
                  className="px-6 py-2 bg-stone-300 text-stone-700 rounded font-medium hover:bg-stone-400"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 정산 내역 테이블 */}
        <div className="bg-white rounded-lg overflow-hidden border border-stone-200">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-800">정산 내역</h2>
          </div>

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
                <thead className="bg-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">No</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">합격자</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">입사일</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">연봉(만)</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">수수료율%</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">실매출액(만)</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">개인매출액(만)</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-700">누적 개인매출</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-700">요율</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">인센티브(만)</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">세금</th>
                    <th className="px-4 py-3 text-right font-medium text-stone-700">실수령(만)</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-700">고과사</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-700">포지션</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-700">요율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {settlements.map((s, idx) => {
                    const commission = calculateCommission(s.salary, s.commission_rate)
                    const personalCommission = commission / 2
                    const incentive = calculateIncentive(s.salary, s.commission_rate, s.incentive_rate, s.personal_override)
                    const tax = commission - incentive

                    return (
                      <tr key={s.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 text-stone-600">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEdit(s)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {s.candidate_name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-stone-700">{s.start_date}</td>
                        <td className="px-4 py-3 text-right font-medium">{s.salary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{s.commission_rate}</td>
                        <td className="px-4 py-3 text-right font-bold text-yellow-700">{commission.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">{personalCommission.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-stone-600">-</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                            {s.incentive_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{incentive.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-stone-600">{tax.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{incentive.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-stone-700">{s.company || '-'}</td>
                        <td className="px-4 py-3 text-center text-stone-700">{s.position || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-red-500 hover:text-red-700 text-xl"
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
