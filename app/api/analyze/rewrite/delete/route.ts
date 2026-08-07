import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // 삭제
    const { error } = await supabase
      .from('generated_resumes')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email) // 본인 것만 삭제

    if (error) {
      console.error('생성된 이력서 삭제 실패:', error)
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('생성된 이력서 삭제 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
