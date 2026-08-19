import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 가장 최근 생성된 이력서 조회 (analysis 정보 포함)
    const { data: resume, error } = await supabase
      .from('generated_resumes')
      .select('*')
      .eq('user_email', session.user.email)
      .is('deleted_at', null) // ✅ 복원된 데이터만 조회
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터 없음
        return NextResponse.json({ success: true, data: null })
      }
      console.error('생성된 이력서 조회 실패:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    // analysis 정보 조회 (파일 타입 확인용)
    let filePath = null
    if (resume?.resume_id) {
      const { data: analysis } = await supabase
        .from('analyses')
        .select('file_path')
        .eq('id', resume.resume_id)
        .single()

      filePath = analysis?.file_path || null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...resume,
        file_path: filePath
      }
    })
  } catch (error) {
    console.error('생성된 이력서 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
