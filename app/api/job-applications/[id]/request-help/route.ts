import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { message } = body

    console.log('🆘 구직 요청:', { id, userEmail: session.user.email, message })

    // 1. 지원 정보 조회
    const { data: application, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !application) {
      console.error('지원 정보 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '지원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. 이미 요청 중이거나 할당된 경우 체크
    if (application.headhunter_status !== 'self') {
      return NextResponse.json(
        { error: '이미 헤드헌터 요청이 진행 중입니다.' },
        { status: 400 }
      )
    }

    // 3. 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name, plan')
      .eq('email', session.user.email)
      .single()

    // 4. 요청 제한 체크 (플랜별)
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { count: requestCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', session.user.email)
      .gte('headhunter_requested_at', `${thisMonth}-01`)
      .neq('headhunter_status', 'self')

    const plan = userData?.plan || 'FREE'
    const limits = {
      FREE: 1,
      PRO: 3,
      EXPERT: 999
    }

    if ((requestCount || 0) >= limits[plan as keyof typeof limits]) {
      return NextResponse.json(
        {
          error: `이번 달 헤드헌터 요청 횟수를 모두 사용했습니다. (${plan} 플랜: ${limits[plan as keyof typeof limits]}회/월)`,
          limit: limits[plan as keyof typeof limits],
          used: requestCount
        },
        { status: 429 }
      )
    }

    // 5. Adam DB 업데이트
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({
        headhunter_status: 'requested',
        request_message: message,
        headhunter_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Adam DB 업데이트 실패:', updateError)
      throw new Error('헤드헌터 요청 중 오류가 발생했습니다.')
    }

    // 6. Eve API 호출 (Adam → Eve 연동)
    const eveApiUrl = process.env.EVE_API_URL
    const adamToEveApiKey = process.env.ADAM_TO_EVE_API_KEY

    if (eveApiUrl && adamToEveApiKey) {
      try {
        const eveResponse = await fetch(`${eveApiUrl}/api/job-seeker-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-adam-api-key': adamToEveApiKey
          },
          body: JSON.stringify({
            adam_user_email: session.user.email,
            adam_user_name: userData?.full_name || session.user.name || '이름 없음',
            adam_application_id: id,
            company: application.company,
            position: application.position,
            status: application.status,
            request_message: message
          })
        })

        if (!eveResponse.ok) {
          console.error('Eve API 호출 실패:', await eveResponse.text())
          // Eve API 실패해도 Adam DB는 업데이트 완료 상태 유지 (나중에 재시도 가능)
        } else {
          const eveData = await eveResponse.json()
          console.log('✅ Eve API 호출 성공:', eveData)

          // Eve request_id 저장
          if (eveData.id) {
            await supabase
              .from('job_applications')
              .update({ eve_request_id: eveData.id })
              .eq('id', id)
          }
        }
      } catch (eveError) {
        console.error('Eve API 호출 중 오류:', eveError)
        // 실패해도 계속 진행 (Adam DB는 업데이트 완료)
      }
    } else {
      console.warn('⚠️ Eve API 설정 없음 - 연동 스킵')
    }

    console.log('✅ 구직 요청 완료:', { id, userEmail: session.user.email })

    return NextResponse.json({
      success: true,
      message: '헤드헌터 요청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.',
      application: {
        id,
        headhunter_status: 'requested',
        headhunter_requested_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('구직 요청 중 오류:', error)
    return NextResponse.json(
      { error: error.message || '헤드헌터 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
