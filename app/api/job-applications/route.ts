import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// GET: 지원 정보 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('지원 정보 조회 실패:', error)
      throw new Error('지원 정보 조회 실패')
    }

    return NextResponse.json({ applications: applications || [] })

  } catch (error: any) {
    console.error('GET /api/job-applications 오류:', error)
    return NextResponse.json(
      { error: error.message || '지원 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 지원 정보 등록
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      company,
      position,
      status = '지원 완료',
      priority = 'medium',
      applied_at,
      deadline,
      schedule_at,
      notes,
      jd_analysis_id
    } = body

    if (!company || !position) {
      return NextResponse.json(
        { error: '회사명과 포지션은 필수입니다.' },
        { status: 400 }
      )
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        user_email: session.user.email,
        company,
        position,
        status,
        priority,
        applied_at: applied_at || new Date().toISOString(),
        deadline,
        schedule_at,
        notes,
        jd_analysis_id,
        headhunter_status: 'self'
      })
      .select()
      .single()

    if (error) {
      console.error('지원 정보 등록 실패:', error)
      throw new Error('지원 정보 등록 실패')
    }

    console.log('✅ 지원 정보 등록:', { id: application.id, company, position })

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error: any) {
    console.error('POST /api/job-applications 오류:', error)
    return NextResponse.json(
      { error: error.message || '지원 정보 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
