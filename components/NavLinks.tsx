'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavLinksProps {
  isPro: boolean
}

export default function NavLinks({ isPro }: NavLinksProps) {
  const pathname = usePathname()
  const router = useRouter()

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

  if (isPro) {
    return (
      <>
        <li><Link href="/dashboard" style={getLinkStyle('/dashboard')}>대시보드</Link></li>
        <li><Link href="/analyze" style={getLinkStyle('/analyze')}>분석</Link></li>
        <li>
          <a
            href="/#faq"
            onClick={handleHashLink('#faq')}
            style={pathname === '/' && typeof window !== 'undefined' && window.location.hash === '#faq' ? { color: '#e8ff47', fontWeight: 600 } : {}}
          >
            FAQ
          </a>
        </li>
        <li><Link href="/store" style={getLinkStyle('/store')}>Store</Link></li>
      </>
    )
  }

  return (
    <>
      <li><a href="/#how" onClick={handleHashLink('#how')}>사용법</a></li>
      <li><a href="/#features" onClick={handleHashLink('#features')}>기능</a></li>
      <li><a href="/#pricing" onClick={handleHashLink('#pricing')}>가격</a></li>
      <li><a href="/#faq" onClick={handleHashLink('#faq')}>FAQ</a></li>
      <li><Link href="/store" style={getLinkStyle('/store')}>Store</Link></li>
    </>
  )
}
