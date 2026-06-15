'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  isPro: boolean
}

export default function NavLinks({ isPro }: NavLinksProps) {
  const pathname = usePathname()

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path))
    return {
      color: isActive ? '#e8ff47' : undefined,
      fontWeight: isActive ? 600 : undefined,
    }
  }

  if (isPro) {
    return (
      <>
        <li><Link href="/dashboard" style={getLinkStyle('/dashboard')}>대시보드</Link></li>
        <li><Link href="/analyze" style={getLinkStyle('/analyze')}>분석</Link></li>
        <li><a href="/#faq" style={pathname === '/' && window.location.hash === '#faq' ? { color: '#e8ff47', fontWeight: 600 } : {}}>FAQ</a></li>
        <li><Link href="/store" style={getLinkStyle('/store')}>Store</Link></li>
      </>
    )
  }

  return (
    <>
      <li><a href="/#how">사용법</a></li>
      <li><a href="/#features">기능</a></li>
      <li><a href="/#pricing">가격</a></li>
      <li><a href="/#faq">FAQ</a></li>
      <li><Link href="/store" style={getLinkStyle('/store')}>Store</Link></li>
    </>
  )
}
