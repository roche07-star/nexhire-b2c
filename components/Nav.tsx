import Link from 'next/link'
import { auth } from '@/auth'
import MyInfoButton from './MyInfoModal'
import LogoutButton from './LogoutButton'
import AnalysisBadge from './AnalysisBadge'

const JobizicLogo = () => (
  <svg className="nav-logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#1a1a14"/>
    <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
    <text x="50" y="70" textAnchor="middle" fontFamily="'Arial Black', 'Outfit', sans-serif" fontWeight="900" fontSize="50" letterSpacing="-1">
      <tspan fill="#e8e8de">J</tspan><tspan fill="#e8ff47">z</tspan>
    </text>
  </svg>
)

export default async function Nav({ minimal = false }: { minimal?: boolean }) {
  const session = await auth()
  const user = session?.user


  return (
    <nav>
      <Link className="nav-logo" href="/">
        <JobizicLogo />
        <span className="nav-logo-text">JOBIZIC</span>
      </Link>
      {!minimal && (
        <ul className="nav-links">
          {user && (user.plan === 'PRO' || user.plan === 'EXPERT') ? (
            <>
              <li><Link href="/dashboard" style={{ color: '#e8ff47', fontWeight: 600 }}>대시보드</Link></li>
              <li><Link href="/analyze">분석</Link></li>
              <li><a href="/#faq">FAQ</a></li>
              <li><Link href="/store">Store</Link></li>
            </>
          ) : (
            <>
              <li><a href="/#how">사용법</a></li>
              <li><a href="/#features">기능</a></li>
              <li><a href="/#pricing">가격</a></li>
              <li><a href="/#faq">FAQ</a></li>
              <li><Link href="/store">Store</Link></li>
            </>
          )}
        </ul>
      )}
      <div className="nav-cta">
        <AnalysisBadge />
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
            </div>
            {user.role !== 'MANAGER' && <MyInfoButton />}
            {user.role === 'MANAGER' && (
              <Link href="/admin"><button className="btn-ghost">관리자</button></Link>
            )}
            <LogoutButton />
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
