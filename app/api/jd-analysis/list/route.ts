import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 헤드헌터만 접근 가능
    const userType = (session.user as any).type?.toLowerCase()
    if (userType !== 'headhunter') {
      return NextResponse.json({ error: '헤드헌터만 이용 가능한 기능입니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('jd_analyses')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    // 만료된 항목 필터링
    const now = new Date()
    const analyses = (data || []).filter((item: any) => {
      if (!item.expires_at) return true
      return new Date(item.expires_at) > now
    })

    return NextResponse.json({ analyses })
  } catch (e: any) {
    console.error('[jd-analysis/list] Error:', e)
    return NextResponse.json({ error: e.message || '조회 실패' }, { status: 500 })
  }
}
