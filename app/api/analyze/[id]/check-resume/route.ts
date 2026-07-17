import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email
    const params = await context.params
    const analysisId = params.id

    // 2. 생성된 이력서 확인
    const { data: resume } = await supabase
      .from('generated_resumes')
      .select('id, user_email')
      .eq('analysis_id', analysisId)
      .single()

    // 3. 권한 확인
    if (resume && resume.user_email !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      resumeId: resume?.id || null,
    })
  } catch (error) {
    console.error('Check resume error:', error)
    return NextResponse.json(
      { resumeId: null },
      { status: 200 }
    )
  }
}
