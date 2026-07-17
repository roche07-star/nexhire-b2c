import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
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
    const resumeId = params.id
    const body = await request.json()
    const { html_content } = body

    if (!html_content) {
      return NextResponse.json({ error: 'HTML 내용이 필요합니다.' }, { status: 400 })
    }

    // 2. 기존 이력서 조회
    const { data: resume, error: fetchError } = await supabase
      .from('generated_resumes')
      .select('user_email')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      return NextResponse.json({ error: '이력서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 3. 권한 확인
    if (resume.user_email !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 4. DB 업데이트
    const { error: updateError } = await supabase
      .from('generated_resumes')
      .update({
        html_content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: '이력서 업데이트 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '이력서가 저장되었습니다.',
    })
  } catch (error) {
    console.error('Save resume error:', error)
    return NextResponse.json(
      { error: '이력서 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
