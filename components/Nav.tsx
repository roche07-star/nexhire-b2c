import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { supabase } from '@/lib/supabase'

const JobizicLogo = () => (
  <svg className="nav-logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#1a1a14"/>
    <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
    <text x="50" y="70" textAnchor="middle" fontFamily="'Arial Black', 'Outfit', sans-serif" fontWeight="900" fontSize="50" letterSpacing="-1">
      <tspan fill="#e8e8de">J</tspan><tspan fill="#e8ff47">z</tspan>
    </text>
  </svg>
)

const PLAN_LIMITS = {
  FREE:   { resume: 1,  jd: 0  },
  PRO:    { resume: 10, jd: 15 },
  EXPERT: { resume: 30, jd: 30 },
} as const

export default async function Nav({ minimal = false }: { minimal?: boolean }) {
  const session = await auth()
  const user = session?.user

  let usage: { resumeUsed: number; resumeLimit: number; jdUsed: number; jdLimit: number } | null = null
  if (user?.email && user.role !== 'MANAGER') {
    const { data } = await supabase
      .from('users')
      .select('plan, analyze_count, analyze_reset_at, jd_count, jd_reset_at')
      .eq('email', user.email)
      .single()
    if (data) {
      const now = new Date()
      const resumeUsed = data.analyze_reset_at && new Date(data.analyze_reset_at) <= now ? 0 : (data.analyze_count ?? 0)
      const jdUsed = data.jd_reset_at && new Date(data.jd_reset_at) <= now ? 0 : (data.jd_count ?? 0)
      const limits = PLAN_LIMITS[(data.plan as keyof typeof PLAN_LIMITS) ?? 'FREE'] ?? PLAN_LIMITS.FREE
      usage = { resumeUsed, resumeLimit: limits.resume, jdUsed, jdLimit: limits.jd }
    }
  }

  return (
    <nav>
      <Link className="nav-logo" href="/">
        <JobizicLogo />
        <span className="nav-logo-text">JOBIZIC</span>
      </Link>
      {!minimal && (
        <ul className="nav-links">
          <li><a href="/#how">사용법</a></li>
          <li><a href="/#features">기능</a></li>
          <li><a href="/#pricing">가격</a></li>
          <li><a href="/#faq">FAQ</a></li>
          <li><Link href="/store">Store</Link></li>
        </ul>
      )}
      <div className="nav-cta">
        {user ? (
          <div className="nav-user">
            {user.image && (
              <img src={user.image} alt={user.name ?? ''} className="nav-avatar" />
            )}
            <div className="nav-user-info">
              <span className="nav-user-name">{user.name}</span>
              <div className="nav-badges">
                <span className={`nav-role-badge ${user.role === 'MANAGER' ? 'role-manager' : 'role-user'}`}>
                  {user.role === 'MANAGER' ? 'Manager' : 'User'}
                </span>
                <span className={`nav-plan-badge plan-${(user.plan ?? 'FREE').toLowerCase()}`}>
                  {user.plan ?? 'FREE'}
                </span>
              </div>
              {usage && (
                <div className="nav-usage">
                  <span className={usage.resumeUsed >= usage.resumeLimit ? 'nav-usage-exhausted' : ''}>
                    이력서 {usage.resumeUsed}/{usage.resumeLimit}
                  </span>
                  {usage.jdLimit > 0 && (
                    <>
                      <span className="nav-usage-sep">·</span>
                      <span className={usage.jdUsed >= usage.jdLimit ? 'nav-usage-exhausted' : ''}>
                        JD {usage.jdUsed}/{usage.jdLimit}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            {user.role === 'MANAGER' && (
              <Link href="/admin"><button className="btn-ghost">관리자</button></Link>
            )}
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}>
              <button className="btn-ghost" type="submit">로그아웃</button>
            </form>
          </div>
        ) : (
          <>
            <Link href="/login"><button className="btn-ghost">로그인</button></Link>
            <Link href="/login"><button className="btn-primary">무료로 시작하기</button></Link>
          </>
        )}
      </div>
    </nav>
  )
}
