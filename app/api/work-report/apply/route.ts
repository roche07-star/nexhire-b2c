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
    const { monthOf } = body

    if (!monthOf) {
      return NextResponse.json(
        { error: '월 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 월간 리포트 applied_to_resume 플래그 업데이트
    const { error } = await supabase
      .from('monthly_reports')
      .update({ applied_to_resume: true })
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)

    if (error) {
      console.error('Apply to resume error:', error)
      throw new Error('이력서 반영 실패')
    }

    return NextResponse.json({
      success: true,
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
