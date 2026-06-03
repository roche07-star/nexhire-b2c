import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('jd_templates')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[jd-templates] GET error:', error)
      return NextResponse.json({ error: 'JD 템플릿을 불러올 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[jd-templates] GET:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { company, position, content } = await req.json()
    if (!company?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '회사명과 JD 내용을 입력해 주세요.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('jd_templates')
      .insert({
        user_email: session.user.email,
        company: company.trim(),
        position: position?.trim() || null,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('[jd-templates] POST error:', error)
      return NextResponse.json({ error: 'JD 템플릿을 저장할 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[jd-templates] POST:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('jd_templates')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      console.error('[jd-templates] DELETE error:', error)
      return NextResponse.json({ error: 'JD 템플릿을 삭제할 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[jd-templates] DELETE:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
