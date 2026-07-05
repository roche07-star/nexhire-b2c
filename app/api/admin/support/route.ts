import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 전체 문의 목록 조회 (관리자 전용)
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Support messages fetch error:', error)
    return NextResponse.json({ error: '목록을 불러올 수 없습니다' }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}

/**
 * 답변 등록 (관리자 전용)
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { messageId, reply, status } = await req.json()

  if (!messageId || !reply?.trim()) {
    return NextResponse.json({ error: 'messageId와 reply 필수' }, { status: 400 })
  }

  const { error } = await supabase
    .from('support_messages')
    .update({
      admin_reply: reply.trim(),
      replied_at: new Date().toISOString(),
      replied_by: session.user.email,
      status: status || 'resolved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (error) {
    console.error('Support reply error:', error)
    return NextResponse.json({ error: '답변 등록에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
