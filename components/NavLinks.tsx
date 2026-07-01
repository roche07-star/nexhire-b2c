'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavLinksProps {
  isPro: boolean
  isHeadhunter: boolean
  sidebarOpen?: boolean
  setSidebarOpen?: (open: boolean) => void
}

export default function NavLinks({ isPro, isHeadhunter, sidebarOpen = false, setSidebarOpen }: NavLinksProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && setSidebarOpen) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen && setSidebarOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [sidebarOpen, setSidebarOpen])

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path))
    return {
      color: isActive ? '#e8ff47' : undefined,
      fontWeight: isActive ? 600 : undefined,
    }
  }

  const handleHashLink = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault()

    if (pathname === '/') {
      // 이미 홈페이지에 있으면 스크롤만 이동
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // 다른 페이지에 있으면 홈페이지로 이동
      router.push(`/${hash}`)
    }
  }

  const menuItems = [
    // 헤드헌터: 대시보드 → 채용프로세스 → 분석&생성 → 정산 → Store → 플랜정책
    // 구직자: 분석&생성 → Store → 플랜정책
    ...(isHeadhunter ? [{ href: '/dashboard', label: '대시보드' }] : []),
    ...(isHeadhunter ? [{ href: '/hiring-process', label: '채용 프로세스' }] : []),
    ...(isPro ? [{ href: '/analyze', label: '분석&생성' }] : []),
    ...(isHeadhunter ? [{ href: '/settlements', label: '정산' }] : []),
    { href: '/store', label: 'Store' },
    { href: '/plans', label: '플랜정책' },
  ]

  // 헤드헌터는 햄버거 메뉴, 구직자는 기존 방식
  if (isHeadhunter) {
    return (
      <>
        {/* 오버레이 */}
        {sidebarOpen && setSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* 사이드바 */}
        {sidebarOpen && setSidebarOpen && (
          <div className="headhunter-sidebar">
            {/* 메뉴 아이템 */}
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen && setSidebarOpen(false)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* 사용법 링크 */}
            <a
              href="/#how"
              onClick={(e) => {
                handleHashLink('#how')(e)
                setSidebarOpen && setSidebarOpen(false)
              }}
              className="sidebar-item"
            >
              사용법
            </a>
          </div>
        )}
      </>
    )
  }

  // 구직자용 기존 메뉴
  return (
    <>
      {/* 데스크톱 메뉴 */}
      {isPro && (
        <li className="desktop-only"><Link href="/analyze" style={getLinkStyle('/analyze')}>분석&생성</Link></li>
      )}
      <li className="desktop-only"><Link href="/store" style={getLinkStyle('/store')}>Store</Link></li>
      <li className="desktop-only"><Link href="/plans" style={getLinkStyle('/plans')}>플랜정책</Link></li>
      <li className="desktop-only"><a href="/#how" onClick={handleHashLink('#how')}>사용법</a></li>

      {/* 모바일 햄버거 버튼 */}
      <li className="mobile-menu-toggle">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          aria-label="메뉴"
        >
          ☰
        </button>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </li>
    </>
  )
}
