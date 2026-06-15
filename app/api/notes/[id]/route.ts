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
    const { id: noteId } = await params

    // 메모 삭제 (RLS 정책이 자동으로 본인 메모만 삭제하도록 보장)
    const { error } = await supabase
      .from('candidate_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_email', email) // 이중 체크

    if (error) {
      console.error('Note delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      noteId,
    })
  } catch (error) {
    console.error('Note delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
