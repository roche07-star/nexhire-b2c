import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 본인 일정인지 확인 후 삭제
    const { error } = await supabase
      .from('job_schedules')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      console.error('일정 삭제 실패:', error)
      return NextResponse.json(
        { error: '일정 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('일정 삭제 오류:', error)
    return NextResponse.json(
      { error: error.message || '일정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
