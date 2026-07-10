import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * PATCH /api/analyses/[id]/update-name
 * 이력서 분석의 후보자 이름 수정
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const { name } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '유효한 이름을 입력하세요.' }, { status: 400 })
    }

    // 본인 분석인지 확인 후 업데이트
    const { data, error } = await supabase
      .from('analyses')
      .update({ candidate_name: name.trim() })
      .eq('id', id)
      .eq('user_email', session.user.email)
      .select()
      .single()

    if (error) {
      console.error('[update-name] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '분석을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, candidate: data })
  } catch (e: any) {
    console.error('[update-name] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
