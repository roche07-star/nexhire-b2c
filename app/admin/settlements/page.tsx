import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth-helpers'
import SettlementsClient from './SettlementsClient'

export const metadata = {
  title: '정산 관리 — Jobizic Admin',
}

export default async function SettlementsPage() {
  const session = await auth()

  if (!session?.user || !isSuperAdmin(session)) {
    redirect('/admin')
  }

  return <SettlementsClient />
}
