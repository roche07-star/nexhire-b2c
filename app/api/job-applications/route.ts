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
      jd_analysis_id,
      headhunter_status = 'self',
      request_message
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
        headhunter_status,
        request_message
      })
      .select()
      .single()

    if (error) {
      console.error('지원 정보 등록 실패:', error)
      throw new Error('지원 정보 등록 실패')
    }

    console.log('✅ 지원 정보 등록:', { id: application.id, company, position, status })

    // 구직 요청인 경우 Eve 관리자 페이지로 전송
    if (status === '구직요청' && headhunter_status === 'requested') {
      try {
        // 사용자 정보 조회
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, phone')
          .eq('email', session.user.email)
          .single()

        // 최신 이력서 분석 결과 조회
        const { data: analysisData } = await supabase
          .from('analyses')
          .select('id, result')
          .eq('user_email', session.user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        console.log('[job-applications] Eve 구직 요청 전송 시작:', {
          name: userData?.name,
          position
        })

        // Eve 관리자 구직자 관리로 전송
        const eveResponse = await fetch(`${process.env.EVE_API_URL}/api/admin/job-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.ADAM_TO_EVE_API_KEY || ''
          },
          body: JSON.stringify({
            name: userData?.name || '이름 미입력',
            email: userData?.email || session.user.email,
            phone: userData?.phone || null,
            position,
            message: request_message || '',
            adam_user_email: session.user.email,
            adam_application_id: application.id,
            adam_analysis_id: analysisData?.id || null,
            adam_analysis_data: analysisData?.result || null
          })
        })

        if (eveResponse.ok) {
          console.log('[job-applications] ✅ Eve 구직 요청 전송 완료')
        } else {
          const errorText = await eveResponse.text()
          console.error('[job-applications] Eve 구직 요청 전송 실패:', eveResponse.status, errorText)
        }
      } catch (eveError) {
        console.error('[job-applications] Eve 구직 요청 전송 실패 (non-fatal):', eveError)
        // Eve 전송 실패는 치명적이지 않으므로 계속 진행
      }
    }

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
