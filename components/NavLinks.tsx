'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  isPro: boolean
  isHeadhunter: boolean
  isManager: boolean
  isSuperAdmin: boolean
}

export default function NavLinks({ isPro, isHeadhunter, isManager, isSuperAdmin }: NavLinksProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path))
    return {
      color: isActive ? '#e8ff47' : undefined,
      fontWeight: isActive ? 600 : undefined,
    }
  }

  const menuItems = isSuperAdmin
    ? [
        { href: '/admin', label: '관리자' },
        { href: '/admin/settlements', label: '정산' },
        { href: '/store', label: 'STORE' },
        { href: '/plans', label: '플랜정책' },
      ]
    : isManager
    ? [
        { href: '/dashboard', label: '대시보드' },
        { href: '/hiring-process', label: '채용 프로세스' },
        { href: '/pipeline', label: '파이프라인' },
        { href: '/analyze', label: '분석&생성' },
        { href: '/settlements', label: '정산' },
        { href: '/admin', label: '관리자' },
        { href: '/store', label: 'STORE' },
        { href: '/plans', label: '플랜정책' },
      ]
    : [
        ...(isHeadhunter ? [{ href: '/dashboard', label: '대시보드' }] : [{ href: '/job-seeker', label: '대시보드' }]),
        ...(isHeadhunter ? [{ href: '/hiring-process', label: '채용 프로세스' }] : []),
        ...(isHeadhunter ? [{ href: '/pipeline', label: '파이프라인' }] : []),
        { href: '/analyze', label: '분석&생성' },
        ...(!isHeadhunter ? [{ href: '/work-report', label: isPro ? '업무 Report' : '업무 Report 🔒' }] : []),
        ...(isHeadhunter ? [{ href: '/settlements', label: '정산' }] : []),
        { href: '/store', label: 'STORE' },
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
          ref={buttonRef}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          aria-label="메뉴"
        >
          ☰
        </button>

        {/* 모바일 드롭다운 메뉴 - Portal로 렌더링 */}
        {mounted && mobileMenuOpen && createPortal(
          <>
            {/* Overlay */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99998,
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(2px)'
              }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Dropdown */}
            <div
              className="mobile-menu-dropdown"
              style={{
                position: 'fixed',
                top: '60px',
                right: '24px',
                zIndex: 99999,
                background: 'rgba(10,10,15,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '180px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
            >
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-menu-item"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    color: '#e5e5e5',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </>,
          document.body
        )}
      </li>
    </>
  )
}
