'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import MyInfoButton from './MyInfoModal'
import LogoutButton from './LogoutButton'
import AnalysisBadge from './AnalysisBadge'
import NavLinks from './NavLinks'
import { useState } from 'react'

const JobizicLogo = () => (
  <svg className="nav-logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#1a1a14"/>
    <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
    <text x="50" y="70" textAnchor="middle" fontFamily="'Arial Black', 'Outfit', sans-serif" fontWeight="900" fontSize="50" letterSpacing="-1">
      <tspan fill="#e8e8de">J</tspan><tspan fill="#e8ff47">z</tspan>
    </text>
  </svg>
)

export default function Nav({ minimal = false }: { minimal?: boolean }) {
  const { data: session } = useSession()
  const user = session?.user

  const isPro = !!(user && (user.plan === 'PRO' || user.plan === 'EXPERT'))
  const isHeadhunter = user?.userType === 'HEADHUNTER'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link className="nav-logo" href="/">
          <JobizicLogo />
          <span className="nav-logo-text">JOBIZIC</span>
        </Link>

        {/* 헤드헌터 햄버거 버튼 - 로고 바로 옆 */}
        {isHeadhunter && !minimal && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hamburger-btn"
            aria-label="메뉴"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        )}
      </div>

      {!minimal && (
        <ul className="nav-links">
          <NavLinks
            isPro={isPro}
            isHeadhunter={isHeadhunter}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
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
