import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth-helpers'

/**
 * 관리자 공지사항 관리
 * GET  - 목록 조회
 * POST - 생성
 */

export async function GET() {
  try {
    const session = await auth()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Announcements query error:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ announcements })

  } catch (error: any) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { title, content, target_user_type, priority, expires_at } = await req.json()

    if (!title || !content || !target_user_type) {
      return NextResponse.json(
        { error: '제목, 내용, 대상은 필수입니다' },
        { status: 400 }
      )
    }

    const announcementData: any = {
      title,
      content,
      target_user_type,
      priority: priority || 'normal',
      created_by: session?.user?.email || '관리자',
      is_active: true,
      starts_at: new Date().toISOString()
    }

    if (expires_at) {
      // datetime-local input 값을 ISO string으로 변환
      announcementData.expires_at = new Date(expires_at).toISOString()
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select()
      .single()

    if (error) {
      console.error('Create announcement error:', error)
      return NextResponse.json({ error: '생성 실패' }, { status: 500 })
    }

    return NextResponse.json({ announcement: data })

  } catch (error: any) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update announcement error:', error)
      return NextResponse.json({ error: '수정 실패' }, { status: 500 })
    }

    return NextResponse.json({ announcement: data })

  } catch (error: any) {
    console.error('Update announcement error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete announcement error:', error)
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete announcement error:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류' },
      { status: 500 }
    )
  }
}
