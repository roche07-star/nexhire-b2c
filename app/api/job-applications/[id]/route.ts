import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// GET: 개별 지원 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { data: application, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { error: '지원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ application })

  } catch (error: any) {
    console.error('GET /api/job-applications/:id 오류:', error)
    return NextResponse.json(
      { error: error.message || '지원 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH: 지원 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // 업데이트 가능한 필드만 추출
    const allowedFields = [
      'company',
      'position',
      'status',
      'priority',
      'applied_at',
      'deadline',
      'schedule_at',
      'notes'
    ]

    const updates: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data: application, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .eq('user_email', session.user.email)
      .select()
      .single()

    if (error || !application) {
      console.error('지원 정보 수정 실패:', error)
      return NextResponse.json(
        { error: '지원 정보 수정 실패' },
        { status: 500 }
      )
    }

    console.log('✅ 지원 정보 수정:', { id, updates })

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error: any) {
    console.error('PATCH /api/job-applications/:id 오류:', error)
    return NextResponse.json(
      { error: error.message || '지원 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 지원 정보 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      console.error('지원 정보 삭제 실패:', error)
      throw new Error('지원 정보 삭제 실패')
    }

    console.log('✅ 지원 정보 삭제:', { id })

    return NextResponse.json({
      success: true,
      message: '지원 정보가 삭제되었습니다.'
    })

  } catch (error: any) {
    console.error('DELETE /api/job-applications/:id 오류:', error)
    return NextResponse.json(
      { error: error.message || '지원 정보 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
