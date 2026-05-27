import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { email } = await req.json()
    if (email !== session.user.email) {
      return NextResponse.json({ error: '이메일이 일치하지 않습니다.' }, { status: 400 })
    }

    const userEmail = session.user.email

    await supabase.from('jd_analyses').delete().eq('user_email', userEmail)
    await supabase.from('analyses').delete().eq('user_email', userEmail)
    await supabase.from('coupons').delete().eq('user_email', userEmail)
    // users 행 유지(어뷰징 방지), 플랜만 FREE로 리셋
    await supabase.from('users').update({ plan: 'FREE' }).eq('email', userEmail)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[user/delete]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
