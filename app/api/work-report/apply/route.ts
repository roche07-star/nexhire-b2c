import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// POST: 월간 리포트를 가장 최근 이력서에 반영
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { monthOf } = body

    console.log('📊 이력서 반영 시작:', { monthOf, userEmail: session.user.email })

    if (!monthOf) {
      return NextResponse.json(
        { error: '월 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 1. 월간 리포트 조회
    const { data: monthlyReport, error: monthlyError } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    if (monthlyError || !monthlyReport) {
      return NextResponse.json(
        { error: '월간 리포트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. 가장 최근 이력서 조회
    const { data: latestResume, error: resumeError } = await supabase
      .from('analyses')
      .select('id, candidate_name, position, result')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (resumeError || !latestResume) {
      return NextResponse.json(
        { error: '이력서를 찾을 수 없습니다. 먼저 이력서를 분석해주세요.' },
        { status: 404 }
      )
    }

    console.log('📊 최근 이력서:', { id: latestResume.id, name: latestResume.candidate_name })

    // 3. 이력서에 월간 리포트 추가
    let analysisResult = typeof latestResume.result === 'string'
      ? JSON.parse(latestResume.result)
      : latestResume.result

    if (!analysisResult.work_experience) {
      analysisResult.work_experience = []
    }

    // 조직 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('organization, organization_type')
      .eq('email', userEmail)
      .single()

    const organization = userData?.organization || '소속 정보 없음'
    const monthDate = new Date(monthOf)
    const monthLabel = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`

    // HTML을 텍스트로 변환
    const htmlContent = monthlyReport.aggregated_html || ''
    const textContent = htmlContent.replace(/<[^>]*>/g, '\n').replace(/\s+/g, ' ').trim()

    // 새로운 경력 항목 추가
    analysisResult.work_experience.push({
      company: organization,
      title: `${monthLabel} 업무 Report`,
      content: textContent,
      html: htmlContent,
      added_at: new Date().toISOString(),
      from_monthly_report: true,
      month_of: monthOf,
    })

    // 4. 이력서 업데이트
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        result: analysisResult,  // JSONB 컬럼이므로 직접 할당 (JSON.stringify 불필요)
      })
      .eq('id', latestResume.id)

    if (updateError) {
      console.error('Resume update error:', updateError)
      throw new Error('이력서 업데이트 실패')
    }

    // 5. 월간 리포트 applied_to_resume 플래그 업데이트
    const { error: applyError } = await supabase
      .from('monthly_reports')
      .update({ applied_to_resume: true })
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)

    if (applyError) {
      console.error('Apply flag update error:', applyError)
    }

    console.log('✅ 이력서 반영 완료:', { resumeId: latestResume.id, resumeName: latestResume.candidate_name })

    return NextResponse.json({
      success: true,
      message: `월간 Report가 "${latestResume.candidate_name}" 이력서에 반영되었습니다.`,
      resumeName: latestResume.candidate_name,
    })

  } catch (error: any) {
    console.error('Work report apply error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply report' },
      { status: 500 }
    )
  }
}
