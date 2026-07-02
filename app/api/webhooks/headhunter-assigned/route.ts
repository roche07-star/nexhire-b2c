import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // API Key 검증
    const apiKey = request.headers.get('x-eve-api-key')
    const expectedApiKey = process.env.EVE_TO_ADAM_API_KEY

    if (!expectedApiKey) {
      console.error('⚠️ EVE_TO_ADAM_API_KEY 환경변수 미설정')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (apiKey !== expectedApiKey) {
      console.error('❌ 웹훅 API Key 불일치')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      adam_application_id,
      headhunter_id,
      headhunter_name,
      eve_request_id
    } = body

    console.log('📥 웹훅 수신 (Eve → Adam):', {
      adam_application_id,
      headhunter_id,
      headhunter_name
    })

    if (!adam_application_id || !headhunter_id || !headhunter_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 1. 지원 정보 조회
    const { data: application, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', adam_application_id)
      .single()

    if (fetchError || !application) {
      console.error('지원 정보 조회 실패:', fetchError)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // 2. 상태 업데이트
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({
        headhunter_status: 'assigned',
        headhunter_id,
        headhunter_name,
        headhunter_assigned_at: new Date().toISOString(),
        eve_request_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', adam_application_id)

    if (updateError) {
      console.error('DB 업데이트 실패:', updateError)
      throw new Error('Failed to update application')
    }

    console.log('✅ 헤드헌터 할당 완료:', {
      adam_application_id,
      headhunter_name
    })

    // 3. TODO: 구직자에게 알림 전송 (이메일/브라우저)
    // - 이메일: Resend API 사용
    // - 브라우저: 다음 로그인 시 알림 표시

    return NextResponse.json({
      success: true,
      message: 'Headhunter assigned successfully',
      application: {
        id: adam_application_id,
        headhunter_status: 'assigned',
        headhunter_name
      }
    })

  } catch (error: any) {
    console.error('웹훅 처리 중 오류:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
