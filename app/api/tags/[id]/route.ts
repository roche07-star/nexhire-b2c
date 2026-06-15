import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email
    const { id: tagId } = await params

    // 태그 삭제 (RLS 정책이 자동으로 본인 태그만 삭제하도록 보장)
    const { error } = await supabase
      .from('candidate_tags')
      .delete()
      .eq('id', tagId)
      .eq('user_email', email) // 이중 체크

    if (error) {
      console.error('Tag delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tagId,
    })
  } catch (error) {
    console.error('Tag delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
