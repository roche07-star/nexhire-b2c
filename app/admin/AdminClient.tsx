'use client'

import { useState } from 'react'

interface User {
  email: string
  name: string | null
  image: string | null
  plan: 'FREE' | 'PRO'
  analyze_count: number
  analyze_reset_at: string
  created_at: string
}

export default function AdminClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function changePlan(email: string, plan: 'FREE' | 'PRO') {
    setLoading(email + plan)
    const res = await fetch('/api/admin/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email ? { ...u, plan } : u))
      setMsg(`${email} → ${plan} 변경 완료`)
    }
    setLoading(null)
    setTimeout(() => setMsg(null), 3000)
  }

  async function resetCount(email: string) {
    setLoading(email + 'reset')
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email ? { ...u, analyze_count: 0 } : u))
      setMsg(`${email} 횟수 초기화 완료`)
    }
    setLoading(null)
    setTimeout(() => setMsg(null), 3000)
  }

  const total = users.length
  const proCount = users.filter((u) => u.plan === 'PRO').length
  const totalAnalyzes = users.reduce((sum, u) => sum + u.analyze_count, 0)

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="section-label">MANAGER</div>
          <h1 className="admin-title">관리자 대시보드</h1>
        </div>

        {msg && <div className="admin-toast">{msg}</div>}

        {/* 통계 */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-label">전체 가입자</div>
            <div className="admin-stat-value">{total}<span>명</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">PRO 플랜</div>
            <div className="admin-stat-value">{proCount}<span>명</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">FREE 플랜</div>
            <div className="admin-stat-value">{total - proCount}<span>명</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">전체 분석 건수</div>
            <div className="admin-stat-value">{totalAnalyzes}<span>건</span></div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">전환율</div>
            <div className="admin-stat-value">{total > 0 ? Math.round((proCount / total) * 100) : 0}<span>%</span></div>
          </div>
        </div>

        {/* 유저 목록 */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>유저</th>
                <th>플랜</th>
                <th>이번 달 분석</th>
                <th>가입일</th>
                <th>플랜 변경</th>
                <th>횟수 초기화</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email}>
                  <td>
                    <div className="admin-user-cell">
                      {u.image && <img src={u.image} alt="" className="admin-avatar" />}
                      <div>
                        <div className="admin-user-name">{u.name ?? '—'}</div>
                        <div className="admin-user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-plan-badge ${u.plan === 'PRO' ? 'pro' : 'free'}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="admin-count">{u.analyze_count}회</td>
                  <td className="admin-date">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-btn pro"
                        disabled={u.plan === 'PRO' || loading === u.email + 'PRO'}
                        onClick={() => changePlan(u.email, 'PRO')}
                      >PRO</button>
                      <button
                        className="admin-btn free"
                        disabled={u.plan === 'FREE' || loading === u.email + 'FREE'}
                        onClick={() => changePlan(u.email, 'FREE')}
                      >FREE</button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="admin-btn reset"
                      disabled={u.analyze_count === 0 || loading === u.email + 'reset'}
                      onClick={() => resetCount(u.email)}
                    >초기화</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">가입한 유저가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
