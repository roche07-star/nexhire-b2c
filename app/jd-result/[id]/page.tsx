import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function JDResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // JD 분석 결과는 /analyze 페이지의 JD 탭에서 확인
  redirect(`/analyze?tab=jd&id=${id}`)
}
