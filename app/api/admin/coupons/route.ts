import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isAdmin, isSuperAdmin } from '@/lib/auth-helpers'

const FEATURE_PREFIX: Record<string, string> = {
  resume: 'RS',
  direction: 'DR',
  jd: 'JD',
  rewrite: 'RW',
}

function genCode(feature: string): string {
  const p = FEATURE_PREFIX[feature] ?? 'XX'
  const r = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `NH-${p}-${r}`
}

export async function GET() {
  try {
    const session = await auth()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    return NextResponse.json({ coupons: data ?? [] })
  } catch (e) {
    console.error('[admin/coupons GET]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Super Admin 권한이 필요합니다.' }, { status: 403 })
    }

    const { feature, quantity, price, issued_to, expires_days } = await req.json()

    if (!feature || !FEATURE_PREFIX[feature]) {
      return NextResponse.json({ error: '유효하지 않은 기능입니다.' }, { status: 400 })
    }
    const qty = Math.min(Math.max(1, parseInt(quantity) || 1), 100)

    const expiresAt = expires_days
      ? new Date(Date.now() + parseInt(expires_days) * 86400 * 1000).toISOString()
      : null

    const rows = Array.from({ length: qty }, () => ({
      code: genCode(feature),
      feature,
      price: parseInt(price) || 0,
      issued_to: issued_to?.trim() || null,
      expires_at: expiresAt,
    }))

    const { data, error } = await supabase.from('coupons').insert(rows).select('code')
    if (error) throw error

    return NextResponse.json({ codes: data?.map((r) => r.code) ?? [] })
  } catch (e) {
    console.error('[admin/coupons POST]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
