import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email || email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { html_content } = await req.json()

    if (!html_content) {
      return NextResponse.json({ error: 'HTML content required' }, { status: 400 })
    }

    // 최근 생성된 이력서의 HTML 업데이트
    const { data: resume } = await supabase
      .from('generated_resumes')
      .select('id')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('generated_resumes')
      .update({ html_content })
      .eq('id', resume.id)
      .eq('user_email', email)

    if (error) {
      console.error('HTML 업데이트 실패:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('HTML 업데이트 오류:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
