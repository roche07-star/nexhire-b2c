import Link from 'next/link'
import { auth, signOut } from '@/auth'

const NexhireLogo = () => (
  <svg className="nav-logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#2a2a22"/>
    <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
    <path d="M24 75 L24 25 L35 25 L62 62 L62 25 L73 25 L73 75 L62 75 L35 38 L35 75 Z" fill="#e8e8de" strokeLinejoin="round"/>
    <circle cx="73" cy="22" r="10" fill="#e8ff47"/>
  </svg>
)

export default async function Nav() {
  const session = await auth()
  const user = session?.user

  return (
    <nav>
      <Link className="nav-logo" href="/">
        <NexhireLogo />
        <span className="nav-logo-text">NEXHIRE</span>
      </Link>
      <ul className="nav-links">
        <li><a href="/#how">사용법</a></li>
        <li><a href="/#features">기능</a></li>
        <li><a href="/#pricing">가격</a></li>
        <li><a href="/#faq">FAQ</a></li>
      </ul>
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
            </div>
            {user.role === 'MANAGER' && (
              <Link href="/admin"><button className="btn-ghost">관리자</button></Link>
            )}
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
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
