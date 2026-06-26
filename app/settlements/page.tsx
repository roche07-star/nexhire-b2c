'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Settlement {
  id: string
  candidate_name: string
  candidate_email?: string
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
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
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
      candidate_email: s.candidate_email || '',
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
      candidate_email: '',
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

  if (status === 'loading' || !session) {
    return <div className="p-8 text-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💰 정산 관리</h1>
          <p className="mt-2 text-gray-600">헤드헌터 전용 - {session.user.plan} 플랜</p>
        </div>

        <div className="flex gap-2 mb-6">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {year}년
            </button>
          ))}
        </div>

        {settlements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">총 급여</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalSalary.toLocaleString()}만원
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">총 수수료</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalCommission.toLocaleString()}만원
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">총 인센티브</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalIncentive.toLocaleString()}만원
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setEditingId(null)
                resetForm()
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            {showForm ? '✕ 닫기' : '+ 정산 추가'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? '정산 수정' : '정산 등록'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  후보자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.candidate_name}
                  onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={formData.candidate_email}
                  onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">포지션</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입사일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연봉 (만원) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수수료율 (%)</label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">인센티브율 (%)</label>
                <input
                  type="number"
                  value={formData.incentive_rate}
                  onChange={(e) => setFormData({ ...formData, incentive_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">💰</div>
              <div className="text-gray-500">정산 내역이 없습니다.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">후보자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사/포지션</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">입사일</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">연봉</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">수수료</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">인센티브</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{s.candidate_name}</div>
                        {s.candidate_email && <div className="text-sm text-gray-500">{s.candidate_email}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{s.company || '-'}</div>
                        <div className="text-sm text-gray-500">{s.position || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{s.start_date}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {s.salary.toLocaleString()}만원
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                        {calculateCommission(s.salary, s.commission_rate).toLocaleString()}만원
                        <div className="text-xs text-gray-500">{s.commission_rate}%</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">
                        {calculateIncentive(s.salary, s.commission_rate, s.incentive_rate, s.personal_override).toLocaleString()}만원
                        <div className="text-xs text-gray-500">{s.incentive_rate}%</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {settlements.length > 0 && (
          <div className="mt-6 bg-gray-900 text-white p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-400 mb-1">총 건수</div>
                <div className="text-2xl font-bold">{settlements.length}건</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">총 급여</div>
                <div className="text-2xl font-bold">{stats.totalSalary.toLocaleString()}만원</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">총 수수료</div>
                <div className="text-2xl font-bold text-blue-300">{stats.totalCommission.toLocaleString()}만원</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">총 인센티브</div>
                <div className="text-2xl font-bold text-green-300">{stats.totalIncentive.toLocaleString()}만원</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
