'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavLinksProps {
  isPro: boolean
  isHeadhunter: boolean
}

export default function NavLinks({ isPro, isHeadhunter }: NavLinksProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    // 헤드헌터만 정산 표시
    ...(isPro && isHeadhunter ? [{ href: '/settlements', label: '💰 정산' }] : []),
    { href: '/store', label: 'Store' },
    // 개인 구직자만 이력서 분석 표시
    ...(isPro && !isHeadhunter ? [{ href: '/analyze', label: '이력서 분석' }] : []),
  ]

  return (
    <>
      {/* 데스크톱 메뉴 */}
      <li className="desktop-only"><a href="/#how" onClick={handleHashLink('#how')}>사용법</a></li>
      <li className="desktop-only"><a href="/#features" onClick={handleHashLink('#features')}>기능</a></li>
      <li className="desktop-only"><a href="/#pricing" onClick={handleHashLink('#pricing')}>가격</a></li>
      <li className="desktop-only"><a href="/#faq" onClick={handleHashLink('#faq')}>FAQ</a></li>

      {/* 헤드헌터만 정산 */}
      {isPro && isHeadhunter && (
        <li className="desktop-only"><Link href="/settlements" style={getLinkStyle('/settlements')}>💰 정산</Link></li>
      )}
      <li className="desktop-only"><Link href="/store" style={getLinkStyle('/store')}>Store</Link></li>
      {/* 개인 구직자만 이력서 분석 */}
      {isPro && !isHeadhunter && (
        <li className="desktop-only"><Link href="/analyze" style={getLinkStyle('/analyze')}>이력서 분석</Link></li>
      )}

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
