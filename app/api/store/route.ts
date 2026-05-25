import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data } = await supabase
      .from('store_posts')
      .select('id, title, content, author_name, created_at')
      .order('created_at', { ascending: false })

    return NextResponse.json({ posts: data ?? [] })
  } catch (e) {
    console.error('[store GET]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    if ((session.user as { role?: string }).role !== 'MANAGER') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { title, content } = await req.json()
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '제목과 내용을 입력해 주세요.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('store_posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_email: session.user.email,
        author_name: session.user.name ?? session.user.email,
      })
      .select('id, title, content, author_name, created_at')
      .single()

    if (error) throw error
    return NextResponse.json({ post: data })
  } catch (e) {
    console.error('[store POST]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
