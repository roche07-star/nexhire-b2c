import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth-helpers'

/**
 * 결제 내역 조회 (SUPER_ADMIN 전용)
 * GET /api/admin/settlements/payments?page=1&limit=50&plan=PRO&status=success&search=user@
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !isSuperAdmin(session)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const plan = searchParams.get('plan') // 'PRO', 'EXPERT', 'ALL'
  const status = searchParams.get('status') // 'success', 'failed', 'refunded', 'pending', 'ALL'
  const search = searchParams.get('search') // 이메일 검색

  try {
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .order('paid_at', { ascending: false })

    // 필터 적용
    if (plan && plan !== 'ALL') {
      query = query.eq('plan', plan)
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.ilike('user_email', `%${search}%`)
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      payments: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Payments fetch error:', error)
    return NextResponse.json({ error: '결제 내역 조회 실패' }, { status: 500 })
  }
}
