'use client'

import { useState } from 'react'

interface User {
  email: string
  name: string | null
  image: string | null
  plan: 'FREE' | 'PRO' | 'EXPERT'
  analyze_count: number
  analyze_reset_at: string
  jd_count: number
  jd_reset_at: string
  created_at: string
}

interface Coupon {
  id: string
  code: string
  feature: string
  price: number
  issued_to: string | null
  claimed_by: string | null
  claimed_at: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
}

const FEATURE_LABELS: Record<string, string> = {
  resume: '이력서 분석',
  direction: '방향성 분석',
  jd: 'JD 매칭 분석',
  rewrite: 'Re-Writing',
}

type AdminTab = 'users' | 'coupons'

export default function AdminClient({ users: initialUsers }: { users: User[] }) {
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  // coupon state
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [genFeature, setGenFeature] = useState('resume')
  const [genQty, setGenQty] = useState('1')
  const [genPrice, setGenPrice] = useState('0')
  const [genIssuedTo, setGenIssuedTo] = useState('')
  const [genExpires, setGenExpires] = useState('')
  const [genResult, setGenResult] = useState<string[] | null>(null)
  const [genLoading, setGenLoading] = useState(false)

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(null), 3000)
  }

  async function changePlan(email: string, plan: 'FREE' | 'PRO' | 'EXPERT') {
    setLoading(email + plan)
    const res = await fetch('/api/admin/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email ? { ...u, plan } : u))
      showMsg(`${email} → ${plan} 변경 완료`)
    }
    setLoading(null)
  }

  async function resetCount(email: string) {
    setLoading(email + 'reset')
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email ? { ...u, analyze_count: 0, jd_count: 0 } : u))
      showMsg(`${email} 횟수 초기화 완료`)
    }
    setLoading(null)
  }

  async function loadCoupons() {
    if (coupons !== null) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      setCoupons(data.coupons ?? [])
    } finally {
      setCouponLoading(false)
    }
  }

  async function generateCoupons(e: React.FormEvent) {
    e.preventDefault()
    setGenLoading(true)
    setGenResult(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: genFeature,
          quantity: genQty,
          price: genPrice,
          issued_to: genIssuedTo || null,
          expires_days: genExpires || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setGenResult(data.codes)
        setCoupons(null) // refresh list
        await loadCoupons()
        showMsg(`쿠폰 ${data.codes.length}개 생성 완료`)
      } else {
        showMsg(data.error ?? '오류 발생')
      }
    } finally {
      setGenLoading(false)
    }
  }

  function onTabChange(t: AdminTab) {
    setTab(t)
    if (t === 'coupons') loadCoupons()
  }

  function couponStatus(c: Coupon) {
    if (c.used_at) return { label: '사용 완료', cls: 'used' }
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: '만료', cls: 'expired' }
    if (c.claimed_by) return { label: '등록됨', cls: 'claimed' }
    return { label: '미사용', cls: 'unused' }
  }

  const total = users.length
  const proCount = users.filter((u) => u.plan === 'PRO' || u.plan === 'EXPERT').length
  const totalResume = users.reduce((sum, u) => sum + (u.analyze_count ?? 0), 0)
  const totalJd = users.reduce((sum, u) => sum + (u.jd_count ?? 0), 0)

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="section-label">MANAGER</div>
          <h1 className="admin-title">관리자 대시보드</h1>
        </div>

        {msg && <div className="admin-toast">{msg}</div>}

        {/* 탭 */}
        <div className="admin-tab-bar">
          <button className={`admin-tab-btn${tab === 'users' ? ' active' : ''}`} onClick={() => onTabChange('users')}>유저 관리</button>
          <button className={`admin-tab-btn${tab === 'coupons' ? ' active' : ''}`} onClick={() => onTabChange('coupons')}>쿠폰 관리</button>
        </div>

        {tab === 'users' && (
          <>
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
                <div className="admin-stat-label">이력서 분석 건수</div>
                <div className="admin-stat-value">{totalResume}<span>건</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">JD 분석 건수</div>
                <div className="admin-stat-value">{totalJd}<span>건</span></div>
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
                    <th>이번 달 이력서</th>
                    <th>이번 달 JD</th>
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
                        <span className={`admin-plan-badge ${u.plan === 'EXPERT' ? 'expert' : u.plan === 'PRO' ? 'pro' : 'free'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="admin-count">{u.analyze_count ?? 0}회</td>
                      <td className="admin-count">{u.jd_count ?? 0}회</td>
                      <td className="admin-date">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-btn expert"
                            disabled={u.plan === 'EXPERT' || loading === u.email + 'EXPERT'}
                            onClick={() => changePlan(u.email, 'EXPERT')}
                          >EXPERT</button>
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
                          disabled={(u.analyze_count === 0 && u.jd_count === 0) || loading === u.email + 'reset'}
                          onClick={() => resetCount(u.email)}
                        >초기화</button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="admin-empty">가입한 유저가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'coupons' && (
          <div className="coupon-admin-wrap">
            {/* 발급 폼 */}
            <div className="coupon-gen-card">
              <div className="coupon-gen-title">쿠폰 발급</div>
              <form className="coupon-gen-form" onSubmit={generateCoupons}>
                <div className="coupon-gen-row">
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">기능</label>
                    <select className="coupon-gen-select" value={genFeature} onChange={e => setGenFeature(e.target.value)}>
                      {Object.entries(FEATURE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">수량 (최대 100)</label>
                    <input className="coupon-gen-input" type="number" min={1} max={100} value={genQty} onChange={e => setGenQty(e.target.value)} />
                  </div>
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">단가 (₩, 기록용)</label>
                    <input className="coupon-gen-input" type="number" min={0} value={genPrice} onChange={e => setGenPrice(e.target.value)} />
                  </div>
                </div>
                <div className="coupon-gen-row">
                  <div className="coupon-gen-field" style={{ flex: 2 }}>
                    <label className="coupon-gen-label">특정 이메일 지정 (선택)</label>
                    <input className="coupon-gen-input" type="email" placeholder="비워두면 누구나 등록 가능" value={genIssuedTo} onChange={e => setGenIssuedTo(e.target.value)} />
                  </div>
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">유효기간 (일, 선택)</label>
                    <input className="coupon-gen-input" type="number" min={1} placeholder="무제한" value={genExpires} onChange={e => setGenExpires(e.target.value)} />
                  </div>
                </div>
                <button className="btn-primary coupon-gen-btn" type="submit" disabled={genLoading}>
                  {genLoading ? '생성 중...' : '쿠폰 생성'}
                </button>
              </form>

              {genResult && (
                <div className="coupon-result-wrap">
                  <div className="coupon-result-label">생성된 코드 ({genResult.length}개)</div>
                  <div className="coupon-codes-list">
                    {genResult.map(code => (
                      <div key={code} className="coupon-code-chip">{code}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 목록 */}
            <div className="admin-table-wrap">
              {couponLoading ? (
                <div className="admin-empty">불러오는 중...</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>코드</th>
                      <th>기능</th>
                      <th>단가</th>
                      <th>지정 이메일</th>
                      <th>등록자</th>
                      <th>유효기간</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(coupons ?? []).map((c) => {
                      const st = couponStatus(c)
                      return (
                        <tr key={c.id}>
                          <td><code className="coupon-code-text">{c.code}</code></td>
                          <td>{FEATURE_LABELS[c.feature] ?? c.feature}</td>
                          <td>{c.price > 0 ? `₩${c.price.toLocaleString()}` : '—'}</td>
                          <td className="admin-user-email">{c.issued_to ?? '—'}</td>
                          <td className="admin-user-email">{c.claimed_by ?? '—'}</td>
                          <td className="admin-date">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('ko-KR') : '무제한'}</td>
                          <td><span className={`coupon-status-badge ${st.cls}`}>{st.label}</span></td>
                        </tr>
                      )
                    })}
                    {(coupons ?? []).length === 0 && (
                      <tr><td colSpan={7} className="admin-empty">발급된 쿠폰이 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
