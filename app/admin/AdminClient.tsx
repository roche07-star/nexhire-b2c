'use client'

import { useState } from 'react'

interface User {
  email: string
  name: string | null
  image: string | null
  plan: 'FREE' | 'PRO' | 'EXPERT'
  user_type: 'INDIVIDUAL' | 'HEADHUNTER' | null
  analyze_count: number
  jd_count: number
  rewrite_count: number
  interview_count: number
  monthly_reset_at: string | null
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

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE:   { analyze: 3,  jd: 3,  rewrite: 3,  interview: 0 },
  PRO:    { analyze: 30, jd: 30, rewrite: 10, interview: 0 },
  EXPERT: { analyze: 50, jd: 50, rewrite: 50, interview: 50 },
}

const FEATURE_LABELS: Record<string, string> = {
  resume: '이력서 분석',
  direction: '방향성 분석',
  jd: 'JD 매칭 분석',
  rewrite: '이력서 생성',
}

type AdminTab = 'users' | 'coupons' | 'tokens'

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

  // 유저 상세 모달
  const [detailEmail, setDetailEmail] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  async function openUserDetail(email: string) {
    setDetailEmail(email)
    setDetailData(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/user-detail?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setDetailData(data)
    } finally {
      setDetailLoading(false)
    }
  }

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
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, plan, analyze_count: 0, jd_count: 0, rewrite_count: 0, interview_count: 0 }
        : u
      ))
      showMsg(`${email} → ${plan} 변경 완료 (사용량 초기화됨)`)
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
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, analyze_count: 0, jd_count: 0, rewrite_count: 0, interview_count: 0 }
        : u
      ))
      showMsg(`${email} 사용량 초기화 완료`)
    }
    setLoading(null)
  }

  async function changeUserType(email: string, userType: 'INDIVIDUAL' | 'HEADHUNTER') {
    setLoading(email + userType)
    const res = await fetch('/api/admin/user-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userType }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, user_type: userType }
        : u
      ))
      showMsg(`${email} → ${userType === 'INDIVIDUAL' ? '개인' : '헤드헌터'} 변경 완료`)
    } else {
      const data = await res.json()
      alert(data.error || '변경 실패')
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
        setCoupons(null)
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

  function nextResetDate(u: User) {
    if (!u.monthly_reset_at) return '—'
    const d = new Date(u.monthly_reset_at)
    d.setMonth(d.getMonth() + 1)
    return d.toLocaleDateString('ko-KR')
  }

  function usageCell(count: number, plan: string, feature: 'analyze' | 'jd' | 'rewrite' | 'interview') {
    const limit = PLAN_LIMITS[plan]?.[feature] ?? 0
    if (limit === 0) return <span className="admin-count muted">—</span>
    const remaining = Math.max(0, limit - count)
    const pct = Math.min(100, Math.round((count / limit) * 100))
    const cls = pct >= 100 ? 'full' : pct >= 70 ? 'warn' : ''
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span className={`admin-count ${cls}`}>
          {count}<span className="admin-count-limit">/{limit}</span>
        </span>
        <span style={{ fontSize: '11px', color: remaining === 0 ? '#ff4444' : '#999' }}>
          {remaining}회 남음
        </span>
      </div>
    )
  }

  const total = users.length
  const expertCount = users.filter((u) => u.plan === 'EXPERT').length
  const proCount = users.filter((u) => u.plan === 'PRO').length
  const individualCount = users.filter((u) => u.user_type === 'INDIVIDUAL').length
  const headhunterCount = users.filter((u) => u.user_type === 'HEADHUNTER').length
  const noTypeCount = users.filter((u) => !u.user_type).length
  const totalAnalyze = users.reduce((s, u) => s + (u.analyze_count ?? 0), 0)
  const totalJd = users.reduce((s, u) => s + (u.jd_count ?? 0), 0)
  const totalRewrite = users.reduce((s, u) => s + (u.rewrite_count ?? 0), 0)
  const totalInterview = users.reduce((s, u) => s + (u.interview_count ?? 0), 0)
  const paidCount = proCount + expertCount

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
          <button className={`admin-tab-btn${tab === 'tokens' ? ' active' : ''}`} onClick={() => onTabChange('tokens')}>🔍 토큰 관리</button>
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
                <div className="admin-stat-label">🎯 개인 구직자</div>
                <div className="admin-stat-value">{individualCount}<span>명</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">💼 헤드헌터</div>
                <div className="admin-stat-value">{headhunterCount}<span>명</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">⚠️ 미선택</div>
                <div className="admin-stat-value">{noTypeCount}<span>명</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">EXPERT 플랜</div>
                <div className="admin-stat-value">{expertCount}<span>명</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">PRO 플랜</div>
                <div className="admin-stat-value">{proCount}<span>명</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">FREE 플랜</div>
                <div className="admin-stat-value">{total - paidCount}<span>명</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">전환율</div>
                <div className="admin-stat-value">{total > 0 ? Math.round((paidCount / total) * 100) : 0}<span>%</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">이력서 분석</div>
                <div className="admin-stat-value">{totalAnalyze}<span>건</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">JD 분석</div>
                <div className="admin-stat-value">{totalJd}<span>건</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">이력서 생성</div>
                <div className="admin-stat-value">{totalRewrite}<span>건</span></div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">면접 가이드</div>
                <div className="admin-stat-value">{totalInterview}<span>건</span></div>
              </div>
            </div>

            {/* 유저 목록 */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>유저</th>
                    <th>플랜</th>
                    <th>유형</th>
                    <th>이력서 분석</th>
                    <th>JD 분석</th>
                    <th>이력서 생성</th>
                    <th>면접 가이드</th>
                    <th>다음 초기화</th>
                    <th>가입일</th>
                    <th>플랜 변경</th>
                    <th>유형 변경</th>
                    <th>초기화</th>
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
                      <td>
                        <span className={`admin-plan-badge ${
                          u.user_type === 'INDIVIDUAL' ? 'pro' :
                          u.user_type === 'HEADHUNTER' ? 'expert' :
                          'free'
                        }`}>
                          {u.user_type === 'INDIVIDUAL' ? '개인' :
                           u.user_type === 'HEADHUNTER' ? '헤드헌터' :
                           '미선택'}
                        </span>
                      </td>
                      <td>{usageCell(u.analyze_count ?? 0, u.plan, 'analyze')}</td>
                      <td>{usageCell(u.jd_count ?? 0, u.plan, 'jd')}</td>
                      <td>{usageCell(u.rewrite_count ?? 0, u.plan, 'rewrite')}</td>
                      <td>{usageCell(u.interview_count ?? 0, u.plan, 'interview')}</td>
                      <td className="admin-date">{nextResetDate(u)}</td>
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
                        <div className="admin-actions">
                          <button
                            className="admin-btn pro"
                            disabled={u.user_type === 'INDIVIDUAL' || loading === u.email + 'INDIVIDUAL'}
                            onClick={() => changeUserType(u.email, 'INDIVIDUAL')}
                            title="개인 구직자로 변경"
                          >🎯 개인</button>
                          <button
                            className="admin-btn expert"
                            disabled={u.user_type === 'HEADHUNTER' || loading === u.email + 'HEADHUNTER'}
                            onClick={() => changeUserType(u.email, 'HEADHUNTER')}
                            title="헤드헌터로 변경"
                          >💼 헤드헌터</button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="admin-btn reset"
                          disabled={
                            (u.analyze_count === 0 && u.jd_count === 0 && u.rewrite_count === 0 && u.interview_count === 0)
                            || loading === u.email + 'reset'
                          }
                          onClick={() => resetCount(u.email)}
                        >초기화</button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={12} className="admin-empty">가입한 유저가 없습니다.</td></tr>
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
                          <td className="admin-user-email">
                            {c.claimed_by
                              ? <button className="admin-detail-link" onClick={() => openUserDetail(c.claimed_by!)}>{c.claimed_by}</button>
                              : '—'}
                          </td>
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

      {/* 유저 상세 모달 */}
      {detailEmail && (
        <div className="withdraw-overlay" onClick={() => setDetailEmail(null)}>
          <div className="admin-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-detail-header">
              <span className="admin-detail-email">{detailEmail}</span>
              <button className="withdraw-close" onClick={() => setDetailEmail(null)}>×</button>
            </div>

            {detailLoading ? (
              <div className="admin-detail-loading">불러오는 중...</div>
            ) : detailData && (() => {
              const u = detailData.user as Record<string, unknown> | null
              const analyses = detailData.analyses as Array<Record<string, unknown>>
              const jdAnalyses = detailData.jdAnalyses as Array<Record<string, unknown>>
              const couponsUsed = detailData.coupons as Array<Record<string, unknown>>
              return (
                <>
                  {u && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">플랜, 사용량</div>
                      <div className="admin-detail-row">
                        <span className={`plan-badge ${String(u.plan).toLowerCase()}`}>{String(u.plan)}</span>
                        <span>이력서 분석 {String(u.analyze_count)}회</span>
                        <span>JD 분석 {String(u.jd_count)}회</span>
                        <span>이력서 생성 {String(u.rewrite_count)}회</span>
                        <span>면접 가이드 {String(u.interview_count)}회</span>
                      </div>
                    </div>
                  )}

                  {couponsUsed.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">등록한 쿠폰</div>
                      {couponsUsed.map((c, i) => (
                        <div key={i} className="admin-detail-row">
                          <code>{String(c.code)}</code>
                          <span>{FEATURE_LABELS[String(c.feature)] ?? String(c.feature)}</span>
                          <span>{c.used_at ? '사용 완료' : '미사용'}</span>
                          <span className="admin-date">{new Date(String(c.claimed_at)).toLocaleDateString('ko-KR')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {analyses.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">이력서 분석 내역 (최근 5건)</div>
                      {analyses.map((a, i) => {
                        const r = a.result as Record<string, unknown>
                        return (
                          <div key={i} className="admin-detail-row">
                            <span>{String(r?.job_title ?? '—')}</span>
                            <span className="admin-date">{new Date(String(a.created_at)).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {jdAnalyses.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">JD 분석 내역 (최근 5건)</div>
                      {jdAnalyses.map((a, i) => {
                        const r = a.result as Record<string, unknown>
                        return (
                          <div key={i} className="admin-detail-row">
                            <span>{String(r?.company ?? '—')}</span>
                            <span>{String(r?.position ?? '')}</span>
                            <span className="admin-date">{new Date(String(a.created_at)).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* 🔍 토큰 관리 탭 */}
      {tab === 'tokens' && (
        <div className="admin-content">
          <h2 className="admin-subtitle">토큰 사용량 관리</h2>

          {/* 환경 설정 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>⚙️ 환경 설정</h3>
            <div className="admin-stats">
              <div className="admin-stat-card" style={{ minWidth: '300px' }}>
                <div className="admin-stat-label">검증 단계 (ENABLE_VALIDATION)</div>
                <div className="admin-stat-value" style={{ fontSize: '24px' }}>
                  활성화
                  <span style={{ fontSize: '14px', color: '#999', marginLeft: '8px' }}>
                    (환경 변수)
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  ✅ 품질 우선 모드 (기본값)
                  <br />
                  비활성화 시: 월 $2.25 절약, 품질 약간 하락
                </div>
              </div>

              <div className="admin-stat-card" style={{ minWidth: '300px' }}>
                <div className="admin-stat-label">Circuit Breaker</div>
                <div className="admin-stat-value" style={{ fontSize: '24px', color: '#10b981' }}>
                  ✅ 작동 중
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  연속 3회 실패 시 5분 차단
                  <br />
                  무한루프 방지 완료
                </div>
              </div>

              <div className="admin-stat-card" style={{ minWidth: '300px' }}>
                <div className="admin-stat-label">제안서 자동 생성</div>
                <div className="admin-stat-value" style={{ fontSize: '24px', color: '#ef4444' }}>
                  🚫 비활성화
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  수동 생성만 가능
                  <br />
                  무한루프 완전 차단
                </div>
              </div>
            </div>
          </div>

          {/* 외부 링크 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>🔗 외부 모니터링</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="https://console.anthropic.com/workbench/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-download-btn"
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔥 Anthropic Console
                <span style={{ fontSize: '12px', opacity: 0.9 }}>→ 실시간 토큰 사용량</span>
              </a>

              <a
                href="https://vercel.com/roche07s-projects/nexhire-b2c/logs"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-download-btn"
                style={{
                  background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📊 Vercel Logs
                <span style={{ fontSize: '12px', opacity: 0.9 }}>→ API 호출 로그</span>
              </a>
            </div>
          </div>

          {/* 토큰 사용량 가이드 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📖 로그 확인 방법</h3>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '20px',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.8',
              color: '#e5e5e5'
            }}>
              <div style={{ color: '#10b981', marginBottom: '12px' }}>
                <strong>Vercel Logs에서 검색:</strong>
              </div>
              <div style={{ color: '#999', marginBottom: '8px' }}>
                1. Vercel → Functions → Logs
              </div>
              <div style={{ color: '#999', marginBottom: '8px' }}>
                2. Filter: <code style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#fbbf24' }}>[analyze]</code> 또는 <code style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#fbbf24' }}>[rewrite]</code>
              </div>
              <div style={{ color: '#999', marginBottom: '16px' }}>
                3. 토큰 사용량 확인
              </div>

              <div style={{ color: '#8b5cf6', marginBottom: '8px' }}>
                <strong>예시 로그:</strong>
              </div>
              <div style={{ background: '#0a0a0a', padding: '12px', borderRadius: '6px', border: '1px solid #222' }}>
                <div style={{ color: '#10b981' }}>[analyze] 기본 분석 토큰: {'{'} input: 2000, output: 500, total: 2500 {'}'}</div>
                <div style={{ color: '#fbbf24' }}>[analyze] 검증 단계 토큰: {'{'} input: 1500, output: 300, total: 1800 {'}'}</div>
                <div style={{ color: '#06b6d4' }}>[analyze] 커리어 경로 토큰: {'{'} input: 2000, output: 400, total: 2400 {'}'}</div>
                <div style={{ color: '#999', marginTop: '8px' }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                <div style={{ color: '#fff' }}>총 사용: 6,700 tokens</div>
              </div>
            </div>
          </div>

          {/* 환경 변수 설정 가이드 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>⚙️ 환경 변수 설정 (Vercel)</h3>
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                💡 토큰 절약 모드 활성화 방법:
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#78350f' }}>
                <li>Vercel → Settings → Environment Variables</li>
                <li>변수 추가: <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>ENABLE_VALIDATION</code> = <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>false</code></li>
                <li>Redeploy 필요 (Settings → Deployments → Redeploy)</li>
              </ol>
              <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '6px', color: '#78350f' }}>
                <strong>⚠️ 주의:</strong> 검증 비활성화 시 품질이 약간 하락할 수 있습니다.
                <br />
                <strong>절감액:</strong> 월 $2.25 (이력서 분석 토큰 26% 감소)
              </div>
            </div>
          </div>

          {/* 현재 상태 요약 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📊 현재 상태 요약</h3>
            <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-label">무한루프 방지</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>✅ 완료</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Circuit Breaker</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>✅ 작동 중</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">토큰 로깅</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>✅ 활성화</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">제안서 자동생성</div>
                <div className="admin-stat-value" style={{ color: '#ef4444' }}>🚫 차단됨</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
