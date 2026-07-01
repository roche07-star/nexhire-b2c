'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  isPro: boolean
  isHeadhunter: boolean
}

export default function NavLinks({ isPro, isHeadhunter }: NavLinksProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path))
    return {
      color: isActive ? '#e8ff47' : undefined,
      fontWeight: isActive ? 600 : undefined,
    }
  }

  const menuItems = [
    ...(isHeadhunter ? [{ href: '/dashboard', label: '대시보드' }] : []),
    ...(isHeadhunter ? [{ href: '/hiring-process', label: '채용 프로세스' }] : []),
    ...(isPro ? [{ href: '/analyze', label: '분석&생성' }] : []),
    ...(isPro && !isHeadhunter ? [{ href: '/work-report', label: '업무 Report' }] : []),
    ...(isHeadhunter ? [{ href: '/settlements', label: '정산' }] : []),
    { href: '/store', label: 'Store' },
    { href: '/plans', label: '플랜정책' },
  ]

  return (
    <>
      {/* 데스크톱 메뉴 */}
      {menuItems.map((item) => (
        <li key={item.href} className="desktop-only">
          <Link href={item.href} style={getLinkStyle(item.href)}>
            {item.label}
          </Link>
        </li>
      ))}

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
