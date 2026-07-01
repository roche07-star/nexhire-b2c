'use client'

import { useState, useEffect } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [sidebarOpen])

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
        {/* 헤드헌터용 햄버거 버튼 (좌측) */}
        <li style={{
          position: 'fixed',
          left: 24,
          top: 24,
          zIndex: 10000
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: 48,
              height: 48,
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: 12,
              color: '#22d3ee',
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)'
            }}
            aria-label="메뉴"
          >
            ☰
          </button>
        </li>

        {/* 오버레이 */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 사이드바 */}
        {sidebarOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 280,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderLeft: 'none',
            zIndex: 9999,
            padding: '80px 0 24px',
            overflowY: 'auto',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
            animation: 'slideInLeft 0.3s ease-out'
          }}>
            <style>{`
              @keyframes slideInLeft {
                from {
                  transform: translateX(-100%);
                }
                to {
                  transform: translateX(0);
                }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>

            {/* 메뉴 타이틀 */}
            <div style={{
              padding: '0 24px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 8
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#22d3ee',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 4
              }}>
                헤드헌터 메뉴
              </div>
              <div style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)'
              }}>
                Headhunter Dashboard
              </div>
            </div>

            {/* 메뉴 아이템 */}
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'block',
                    padding: '16px 24px',
                    color: isActive ? '#22d3ee' : 'rgba(255,255,255,0.8)',
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 600,
                    textDecoration: 'none',
                    borderLeft: isActive ? '3px solid #22d3ee' : '3px solid transparent',
                    background: isActive ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.paddingLeft = '28px'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.paddingLeft = '24px'
                    }
                  }}
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
                setSidebarOpen(false)
              }}
              style={{
                display: 'block',
                padding: '16px 24px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                borderLeft: '3px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.paddingLeft = '28px'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.paddingLeft = '24px'
              }}
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
