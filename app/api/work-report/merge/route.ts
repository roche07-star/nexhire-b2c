import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// POST: 월간 Report를 이력서에 머지
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { analysisId, monthlyReportHtml } = body

    if (!analysisId || !monthlyReportHtml) {
      return NextResponse.json(
        { error: '이력서 ID와 월간 Report가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 해당 이력서 분석 조회
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('analysis_result')
      .eq('id', analysisId)
      .eq('user_email', userEmail)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: '이력서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // analysis_result JSON 파싱
    let analysisResult = typeof analysis.analysis_result === 'string'
      ? JSON.parse(analysis.analysis_result)
      : analysis.analysis_result

    // 월간 Report를 경력 사항에 추가
    if (!analysisResult.work_experience) {
      analysisResult.work_experience = []
    }

    // HTML을 텍스트로 변환 (간단하게)
    const tempDiv = monthlyReportHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

    // 새로운 경력 항목 추가
    analysisResult.work_experience.push({
      title: '최근 업무 Report (자동 추가)',
      content: tempDiv,
      added_at: new Date().toISOString(),
    })

    // 업데이트
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        analysis_result: JSON.stringify(analysisResult),
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Analysis update error:', updateError)
      throw new Error('이력서 업데이트 실패')
    }

    return NextResponse.json({
      success: true,
      message: '월간 Report가 이력서에 머지되었습니다.',
    })

  } catch (error: any) {
    console.error('Work report merge error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to merge report' },
      { status: 500 }
    )
  }
}
