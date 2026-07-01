import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import WorkReportClient from './WorkReportClient'

export const metadata: Metadata = {
  title: '업무 Report | NexHire',
  description: '주간/월간 업무 보고서 작성 및 이력서 반영',
}

export default async function WorkReportPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  return <WorkReportClient userEmail={session.user.email} />
}
