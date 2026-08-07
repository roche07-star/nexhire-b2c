import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      preview,
      plan,
      originalPreview,
      changes,
      docx,
      filename,
      resumeId,
    } = body

    // DB에 저장
    const { data, error } = await supabase
      .from('generated_resumes')
      .insert({
        user_email: session.user.email,
        preview: preview || null,
        plan: plan || 'FREE',
        original_preview: originalPreview || null,
        changes: changes || [],
        docx: docx || null,
        filename: filename || null,
        resume_id: resumeId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('생성된 이력서 저장 실패:', error)
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('생성된 이력서 저장 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
