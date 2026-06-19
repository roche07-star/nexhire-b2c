import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getJobStatus } from '@/lib/jobs'

/**
 * GET /api/jobs/[id]
 * Job 상태 조회 (polling용)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const job = await getJobStatus(id, session.user.email)

    if (!job) {
      return NextResponse.json({ error: 'Job을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (e) {
    console.error('[GET /api/jobs/[id]]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
