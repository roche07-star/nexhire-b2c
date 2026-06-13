import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // 사용자 플랜 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // PRO 플랜 이상만 접근 가능
    if (userData.plan !== 'PRO' && userData.plan !== 'EXPERT') {
      return NextResponse.json(
        { error: 'PRO 플랜 이상만 이용 가능합니다.' },
        { status: 403 }
      )
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { analysisId, stage } = body

    if (!analysisId || !stage) {
      return NextResponse.json(
        { error: 'analysisId and stage are required' },
        { status: 400 }
      )
    }

    // 유효한 단계인지 확인
    const validStages = ['pending', 'screening', 'interview', 'final', 'completed']
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      )
    }

    // 본인 데이터인지 확인
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('user_email, pipeline_stage')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    if (analysis.user_email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const oldStage = analysis.pipeline_stage || 'pending'

    // 파이프라인 단계 업데이트
    const { error: updateError } = await supabase
      .from('analyses')
      .update({ pipeline_stage: stage })
      .eq('id', analysisId)
      .eq('user_email', email) // 이중 체크

    if (updateError) {
      console.error('Pipeline update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pipeline stage' },
        { status: 500 }
      )
    }

    // 히스토리 기록
    const { error: historyError } = await supabase
      .from('pipeline_history')
      .insert({
        analysis_id: analysisId,
        user_email: email,
        from_stage: oldStage,
        to_stage: stage,
      })

    if (historyError) {
      console.error('Pipeline history error:', historyError)
      // 히스토리 저장 실패는 치명적이지 않음 (로그만 남김)
    }

    return NextResponse.json({
      success: true,
      analysisId,
      oldStage,
      newStage: stage,
    })
  } catch (error) {
    console.error('Pipeline update error:', error)
    return NextResponse.json(
      { error: 'Failed to update pipeline stage' },
      { status: 500 }
    )
  }
}
