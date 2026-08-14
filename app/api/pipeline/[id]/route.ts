import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { UpdatePipelineCandidateInput } from '@/types/pipeline'
import { PIPELINE_STAGE_LABELS } from '@/types/pipeline'

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
    const oldStage = input.old_stage || null
    const autoSettlement = input.autoSettlement || false

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

    let settlementId = null

    // PASSED 처리 시 정산 자동 등록
    if (input.stage === 'PASSED' && (autoSettlement || input.hired_date || input.salary)) {
      try {
        const settlementData: any = {
          candidate_name: data.candidate_name || '미정',
          company: data.company_name,
          position: data.position_title,
          start_date: input.hired_date || new Date().toISOString().slice(0, 10),
          salary: input.salary || 0,
          commission_rate: input.fee || 17, // 합격 정보의 수수료율 사용, 없으면 17%
          incentive_rate: 70,
          my_role: 'PM',
          my_ratio: 50,
          headhunter_email: session.user.email,
          memo: `파이프라인 합격 등록 (ID: ${id})`,
        }

        // 정산 등록
        const { data: settlementRecord, error: settlementError } = await supabase
          .from('settlements')
          .insert(settlementData)
          .select()
          .single()

        if (settlementError) {
          console.error('[pipeline/PATCH] Settlement insert error:', settlementError)
        } else {
          settlementId = settlementRecord.id
          console.log('[pipeline/PATCH] Settlement created:', settlementId)
        }
      } catch (e) {
        console.error('[pipeline/PATCH] Settlement creation error:', e)
      }
    }

    // 알림 생성 (후보자 상태 변경)
    if (input.stage && session?.user?.email) {
      try {
        const stageName = (PIPELINE_STAGE_LABELS as any)[input.stage] || input.stage
        let message = `${data.candidate_name || '후보자'} : ${stageName}`
        if (settlementId) {
          message += ' (정산 자동 등록 완료)'
        }
        await supabase.from('notifications').insert({
          user_email: session.user.email,
          type: settlementId ? 'success' : 'info',
          icon: settlementId ? '💰' : '📋',
          title: '후보자 상태 변경',
          message,
          link: settlementId ? '/settlements' : '/pipeline',
          is_read: false,
        })
        console.log('[pipeline/PATCH] 알림 생성 완료:', session.user.email)
      } catch (notifError) {
        console.error('[pipeline/PATCH] 알림 생성 실패:', notifError)
        // 알림 실패는 무시 (메인 기능에 영향 없음)
      }
    }

    return NextResponse.json({
      candidate: data,
      settlementId // 정산 등록 성공 시 ID 반환
    })
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
