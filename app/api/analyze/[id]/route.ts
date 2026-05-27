import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email

    // Storage 파일 경로 조회 후 삭제
    const { data: row } = await supabase
      .from('analyses')
      .select('result')
      .eq('id', id)
      .eq('user_email', email)
      .single()

    if (row?.result?._file_path) {
      await supabase.storage.from('resumes').remove([row.result._file_path as string])
    }

    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_email', email)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[analyze/delete]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
