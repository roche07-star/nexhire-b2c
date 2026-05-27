import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data } = await supabase
      .from('interview_guides')
      .select('id, result, created_at, expires_at')
      .eq('user_email', session.user.email)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ guides: data ?? [] })
  } catch (e) {
    console.error('[analyze/interview/list]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
