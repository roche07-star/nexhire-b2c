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
    const {
      analysisId,
      stage,
      autoSettlement = false, // 정산 자동 등록 여부
      settlementData = null // 정산 정보 (수동 등록 시)
    } = body

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

    // 본인 데이터인지 확인 (정산 등록에 필요한 정보 포함)
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('user_email, pipeline_stage, result')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    if (analysis.user_email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const oldStage = analysis.pipeline_stage || 'pending'
    const result = analysis.result as any

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

    let settlementId = null

    // 합격(completed) 처리 시 정산 등록
    if (stage === 'completed' && (autoSettlement || settlementData)) {
      try {
        // 정산 데이터 준비
        const settlement = settlementData || {
          candidate_name: result?.candidate_name || '미정',
          start_date: new Date().toISOString().slice(0, 10), // 기본값: 오늘
          salary: 0, // 급여는 수동 입력 필요
          commission_rate: 17,
          incentive_rate: 70,
          my_role: 'PM',
          my_ratio: 50,
        }

        // JD 분석 정보 가져오기 (회사명, 포지션)
        const { data: jdAnalyses } = await supabase
          .from('jd_analyses')
          .select('result')
          .eq('analysis_id', analysisId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (jdAnalyses && jdAnalyses.length > 0) {
          const jdResult = jdAnalyses[0].result as any
          settlement.company = settlement.company || jdResult?.company
          settlement.position = settlement.position || jdResult?.position
        }

        // 정산 등록
        const { data: settlementRecord, error: settlementError } = await supabase
          .from('settlements')
          .insert({
            ...settlement,
            headhunter_email: email,
            memo: settlement.memo || `파이프라인 합격 자동 등록 (분석 ID: ${analysisId})`,
          })
          .select()
          .single()

        if (settlementError) {
          console.error('Settlement insert error:', settlementError)
          // 정산 등록 실패해도 파이프라인 업데이트는 성공으로 처리
        } else {
          settlementId = settlementRecord.id
        }
      } catch (e) {
        console.error('Settlement creation error:', e)
        // 정산 등록 실패해도 파이프라인 업데이트는 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      analysisId,
      oldStage,
      newStage: stage,
      settlementId, // 정산 등록 성공 시 ID 반환
    })
  } catch (error) {
    console.error('Pipeline update error:', error)
    return NextResponse.json(
      { error: 'Failed to update pipeline stage' },
      { status: 500 }
    )
  }
}
