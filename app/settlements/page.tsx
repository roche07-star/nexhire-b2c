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

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-center gap-3">
            <div className="text-4xl">💰</div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                정산 관리
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                헤드헌터 전용 · <span className="font-semibold text-blue-600">{session.user.plan}</span> 플랜
              </p>
            </div>
          </div>
        </div>

        {/* 연도 선택 */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
          <div className="flex justify-center gap-2 flex-wrap">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedYear === year
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}년
              </button>
            ))}
          </div>
        </div>

        {/* 통계 카드 */}
        {settlements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">총 급여</span>
                <span className="text-2xl">💵</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalSalary.toLocaleString()}<span className="text-lg text-gray-600 ml-1">만원</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">총 수수료</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {stats.totalCommission.toLocaleString()}<span className="text-lg text-blue-700 ml-1">만원</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl shadow-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">총 인센티브</span>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-3xl font-bold text-green-900">
                {stats.totalIncentive.toLocaleString()}<span className="text-lg text-green-700 ml-1">만원</span>
              </div>
            </div>
          </div>
        )}

        {/* 추가 버튼 */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setEditingId(null)
                resetForm()
              }
            }}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
              showForm
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {showForm ? '✕ 닫기' : '+ 정산 추가'}
          </button>
        </div>

        {/* 등록/수정 폼 */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">{editingId ? '✏️' : '➕'}</span>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? '정산 수정' : '정산 등록'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👤 후보자 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.candidate_name}
                    onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="홍길동"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 채용사</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="채용사명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">💼 포지션</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="백엔드 개발자"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 입사일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 연봉 (만원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="5000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📊 수수료율 (%)</label>
                  <input
                    type="number"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="17"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 인센티브율 (%)</label>
                  <input
                    type="number"
                    value={formData.incentive_rate}
                    onChange={(e) => setFormData({ ...formData, incentive_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="70"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📝 메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="추가 메모사항을 입력하세요"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  {editingId ? '✅ 수정 완료' : '✅ 등록하기'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 정산 목록 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-7xl mb-6">💰</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">정산 내역이 없습니다</h3>
              <p className="text-gray-500">+ 정산 추가 버튼을 눌러 첫 정산을 등록하세요!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">후보자</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">채용사/포지션</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">입사일</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">연봉</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">수수료</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">인센티브</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👤</span>
                          <span className="text-sm font-semibold text-gray-900">{s.candidate_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{s.company || '-'}</div>
                        <div className="text-xs text-gray-500">{s.position || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">📅 {s.start_date}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">{s.salary.toLocaleString()}만</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {calculateCommission(s.salary, s.commission_rate).toLocaleString()}만
                        </div>
                        <div className="text-xs text-gray-500">{s.commission_rate}%</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-green-600">
                          {calculateIncentive(s.salary, s.commission_rate, s.incentive_rate, s.personal_override).toLocaleString()}만
                        </div>
                        <div className="text-xs text-gray-500">{s.incentive_rate}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => startEdit(s)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 총계 */}
        {settlements.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-300 mb-2">총 건수</div>
                <div className="text-3xl font-bold text-white">{settlements.length}건</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-300 mb-2">총 급여</div>
                <div className="text-3xl font-bold text-white">{stats.totalSalary.toLocaleString()}만</div>
              </div>
              <div className="bg-blue-500/20 rounded-xl p-4">
                <div className="text-sm text-blue-200 mb-2">총 수수료</div>
                <div className="text-3xl font-bold text-blue-300">{stats.totalCommission.toLocaleString()}만</div>
              </div>
              <div className="bg-green-500/20 rounded-xl p-4">
                <div className="text-sm text-green-200 mb-2">총 인센티브</div>
                <div className="text-3xl font-bold text-green-300">{stats.totalIncentive.toLocaleString()}만</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
