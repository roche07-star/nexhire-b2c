import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const plan = searchParams.get('plan') || ''
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const offset = (page - 1) * limit

  // 기본 쿼리
  let query = supabase
    .from('users')
    .select('email, name, image, plan, user_type, analyze_count, jd_count, rewrite_count, interview_count, monthly_reset_at, created_at, headhunter_sharing_enabled, headhunter_sharing_consented_at, downgrade_to, plan_end_date, downgrade_requested_at', { count: 'exact' })

  // 검색 (이메일 또는 이름)
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  // 플랜 필터
  if (plan && plan !== 'ALL') {
    query = query.eq('plan', plan)
  }

  // 정렬
  const ascending = sortOrder === 'asc'
  query = query.order(sortBy as any, { ascending })

  // 페이지네이션
  query = query.range(offset, offset + limit - 1)

  const { data: users, error, count } = await query

  if (error) {
    console.error('Admin users query error:', error)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }

  return NextResponse.json({
    users: users ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
