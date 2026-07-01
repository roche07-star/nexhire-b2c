import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

  // 사용자 플랜 조회
  const { data: userData } = await supabase
    .from('users')
    .select('plan, user_type')
    .eq('email', session.user.email)
    .single()

  const isPro = userData?.plan === 'PRO' || userData?.plan === 'EXPERT'

  return <WorkReportClient userEmail={session.user.email} isPro={isPro} />
}
