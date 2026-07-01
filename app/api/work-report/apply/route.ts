import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { monthlyReportHtml, organization, organizationType } = body

    if (!monthlyReportHtml || !organization) {
      return NextResponse.json(
        { error: '월간 Report와 소속 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // work_reports 테이블에 저장
    const { data, error } = await supabase
      .from('work_reports')
      .insert({
        user_email: userEmail,
        organization,
        organization_type: organizationType,
        monthly_report_html: monthlyReportHtml,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error('이력서 반영 중 오류가 발생했습니다.')
    }

    return NextResponse.json({
      success: true,
      reportId: data.id,
      message: '월간 Report가 이력서에 반영되었습니다.',
    })

  } catch (error: any) {
    console.error('Work report apply error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply report' },
      { status: 500 }
    )
  }
}
