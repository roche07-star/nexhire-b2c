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
      .from('coupons')
      .select('id, code, feature, used_at, expires_at, claimed_at, credits, used, issued_by, created_at')
      .eq('claimed_by', session.user.email)
      .is('deleted_at', null)
      .order('claimed_at', { ascending: false })

    const now = new Date()
    const coupons = (data ?? []).map(c => {
      const remaining = (c.credits || 1) - (c.used || 0)
      return {
        ...c,
        status: remaining <= 0 ? 'used'
          : c.expires_at && new Date(c.expires_at) < now ? 'expired'
          : 'active',
      }
    })

    return NextResponse.json({ coupons })
  } catch (e) {
    console.error('[coupons/mine]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
