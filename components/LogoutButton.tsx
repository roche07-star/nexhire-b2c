'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      className="btn-ghost"
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      로그아웃
    </button>
  )
}
