import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email
    const { candidate_name } = await req.json()

    if (!candidate_name || typeof candidate_name !== 'string' || candidate_name.trim().length === 0) {
      return NextResponse.json({ error: '후보자 이름을 입력해 주세요.' }, { status: 400 })
    }

    // 기존 분석 결과 조회
    const { data: row, error: fetchError } = await supabase
      .from('analyses')
      .select('result')
      .eq('id', id)
      .eq('user_email', email)
      .single()

    if (fetchError || !row) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    // result 객체 업데이트
    const updatedResult = {
      ...row.result,
      candidate_name: candidate_name.trim()
    }

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('analyses')
      .update({ result: updatedResult })
      .eq('id', id)
      .eq('user_email', email)

    if (updateError) {
      console.error('[analyze/update] DB update error:', updateError)
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, candidate_name: candidate_name.trim() })
  } catch (e) {
    console.error('[analyze/update]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

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

    // Storage 파일 삭제 (에러 무시 - 파일이 없을 수도 있음)
    if (row?.result?._file_path) {
      try {
        await supabase.storage.from('resumes').remove([row.result._file_path as string])
      } catch (storageError) {
        console.error('[analyze/delete] Storage delete error (ignored):', storageError)
        // 파일 삭제 실패해도 계속 진행 (DB 레코드는 삭제)
      }
    }

    // DB 레코드 삭제
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_email', email)

    if (error) {
      console.error('[analyze/delete] DB delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[analyze/delete]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
