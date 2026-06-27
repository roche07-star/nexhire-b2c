import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { HiringProcess, UpdateHiringProcessInput } from '@/types/hiring-process'

export const maxDuration = 30

/**
 * GET /api/hiring-process/[id]
 * 채용 프로세스 상세 조회
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await context.params

    const { data, error } = await supabase
      .from('hiring_processes')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '프로세스를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ process: data as HiringProcess })
  } catch (e) {
    console.error('[hiring-process/id] GET exception:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * PATCH /api/hiring-process/[id]
 * 채용 프로세스 업데이트
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json() as UpdateHiringProcessInput

    const updateData: Record<string, unknown> = {}
    if (body.current_stage !== undefined) updateData.current_stage = body.current_stage
    if (body.status !== undefined) updateData.status = body.status
    if (body.next_action !== undefined) updateData.next_action = body.next_action
    if (body.next_action_date !== undefined) updateData.next_action_date = body.next_action_date
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from('hiring_processes')
      .update(updateData)
      .eq('id', id)
      .eq('user_email', session.user.email)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
    }

    return NextResponse.json({ process: data as HiringProcess })
  } catch (e) {
    console.error('[hiring-process/id] PATCH exception:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * DELETE /api/hiring-process/[id]
 * 채용 프로세스 삭제
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await context.params

    const { error } = await supabase
      .from('hiring_processes')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[hiring-process/id] DELETE exception:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
