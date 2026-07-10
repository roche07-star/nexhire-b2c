import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { UpdatePipelineCandidateInput } from '@/types/pipeline'

/**
 * PATCH /api/pipeline/[id]
 * 후보자 정보 업데이트 (단계 이동 포함)
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
    const input: any = await req.json()

    console.log('[pipeline/PATCH] Updating candidate:', id, input)

    const updateData: any = {}
    if (input.stage !== undefined) updateData.stage = input.stage
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.next_action !== undefined) updateData.next_action = input.next_action
    if (input.next_action_date !== undefined) updateData.next_action_date = input.next_action_date
    if (input.hired_date !== undefined) updateData.hired_date = input.hired_date
    if (input.fee !== undefined) updateData.fee = input.fee
    if (input.salary !== undefined) updateData.salary = input.salary

    console.log('[pipeline/PATCH] Update data:', updateData)

    const { data, error } = await supabase
      .from('hiring_pipeline')
      .update(updateData)
      .eq('id', id)
      .eq('user_email', session.user.email)
      .select()
      .single()

    if (error) {
      console.error('[pipeline/PATCH] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '후보자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ candidate: data })
  } catch (e: any) {
    console.error('[pipeline/PATCH] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * DELETE /api/pipeline/[id]
 * 후보자 삭제
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('hiring_pipeline')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      console.error('[pipeline/DELETE] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[pipeline/DELETE] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
