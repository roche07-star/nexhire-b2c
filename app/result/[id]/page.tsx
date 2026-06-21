import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ResultClient from './ResultClient'

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const userType = session.user.userType

  return <ResultClient analysisId={id} userType={userType} />
}
