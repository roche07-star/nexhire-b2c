import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 문의 등록 API
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { subject, message } = await req.json()

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      user_email: session.user.email,
      user_name: session.user.name || null,
      subject: subject.trim(),
      message: message.trim(),
      status: 'new',
    })
    .select()
    .single()

  if (error) {
    console.error('Support message creation error:', error)
    return NextResponse.json({ error: '문의 등록에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id })
}

/**
 * 내 문의 목록 조회 API
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('support_messages')
    .select('id, subject, message, status, created_at, admin_reply, replied_at')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Support messages fetch error:', error)
    return NextResponse.json({ error: '문의 목록을 불러올 수 없습니다' }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}
