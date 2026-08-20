import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 헤드헌터만 접근 가능
    const userType = (session.user as any).type?.toLowerCase()
    if (userType !== 'headhunter') {
      return NextResponse.json({ error: '헤드헌터만 이용 가능한 기능입니다.' }, { status: 403 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('jd_analyses')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[jd-analysis/delete] Error:', e)
    return NextResponse.json({ error: e.message || '삭제 실패' }, { status: 500 })
  }
}
