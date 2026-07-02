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
    const { application_id, title, schedule_at, type } = body

    if (!title || !schedule_at || !type) {
      return NextResponse.json(
        { error: '제목, 일정, 유형을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 지원 정보 확인 (본인 것인지)
    if (application_id) {
      const { data: app } = await supabase
        .from('job_applications')
        .select('id')
        .eq('id', application_id)
        .eq('user_email', session.user.email)
        .single()

      if (!app) {
        return NextResponse.json(
          { error: '지원 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    }

    // 일정 추가
    const { data: schedule, error } = await supabase
      .from('job_schedules')
      .insert({
        user_email: session.user.email,
        application_id: application_id || null,
        title,
        schedule_at,
        type,
        is_completed: false
      })
      .select()
      .single()

    if (error) {
      console.error('일정 추가 실패:', error)
      return NextResponse.json(
        { error: '일정 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule })

  } catch (error: any) {
    console.error('일정 추가 오류:', error)
    return NextResponse.json(
      { error: error.message || '일정 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
