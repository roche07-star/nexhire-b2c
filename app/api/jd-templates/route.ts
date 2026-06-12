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

    const trimmedCompany = company.trim()
    const trimmedPosition = position?.trim() || null

    // 중복 체크: 동일 사용자의 동일 회사+포지션 조합 확인
    console.log('[jd-templates] Checking duplicates:', {
      user_email: session.user.email,
      company: trimmedCompany,
      position: trimmedPosition
    })

    const { data: existingTemplate, error: dupCheckError } = await supabase
      .from('jd_templates')
      .select('id, company, position')
      .eq('user_email', session.user.email)
      .eq('company', trimmedCompany)

    if (dupCheckError) {
      console.error('[jd-templates] Duplicate check error:', dupCheckError)
    }

    // 회사명과 포지션이 모두 같으면 중복으로 판단
    const duplicate = existingTemplate?.find(t =>
      t.company === trimmedCompany &&
      (t.position || null) === trimmedPosition
    )

    console.log('[jd-templates] Duplicate check result:', duplicate ? 'FOUND' : 'NOT FOUND', duplicate)

    if (duplicate) {
      console.log('[jd-templates] ❌ Duplicate JD template found:', duplicate)
      return NextResponse.json(
        {
          error: `❌ 동일한 JD가 이미 저장되어 있습니다.\n\n회사: ${trimmedCompany}\n포지션: ${trimmedPosition || '(없음)'}\n\n💡 기존 JD를 삭제하거나, 다른 이름으로 저장해주세요.`,
          existingId: duplicate.id
        },
        { status: 409 } // 409 Conflict
      )
    }

    const { data, error } = await supabase
      .from('jd_templates')
      .insert({
        user_email: session.user.email,
        company: trimmedCompany,
        position: trimmedPosition,
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
