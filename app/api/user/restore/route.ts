import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 재가입자 데이터 복원 API
 *
 * - withdrawn 상태 확인
 * - data_delete_at 체크 (6개월 경과 여부)
 * - 기존 데이터 복원
 * - FREE 플랜으로 시작, 사용량 0 리셋
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const email = session.user.email

  // 현재 사용자 정보 확인
  const { data: userData } = await supabase
    .from('users')
    .select('status, data_delete_at, plan')
    .eq('email', email)
    .single()

  if (!userData) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  // withdrawn 상태가 아니면 복원 불가
  if (userData.status !== 'withdrawn') {
    return NextResponse.json({ error: '복원 가능한 상태가 아닙니다' }, { status: 400 })
  }

  // data_delete_at 체크
  if (userData.data_delete_at) {
    const deleteAt = new Date(userData.data_delete_at)
    if (new Date() >= deleteAt) {
      return NextResponse.json({ error: '데이터 보존 기간이 만료되었습니다' }, { status: 410 })
    }
  }

  // 복원 가능한 데이터 확인
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id')
    .eq('user_email', email)

  const { data: jdAnalyses } = await supabase
    .from('jd_analyses')
    .select('id')
    .eq('user_email', email)

  const { data: interviewGuides } = await supabase
    .from('interview_guides')
    .select('id')
    .eq('user_email', email)

  const { data: coupons } = await supabase
    .from('coupons')
    .select('id')
    .eq('claimed_by', email)
    .is('deleted_at', null)

  // 데이터 복원: status 변경 + FREE 플랜 + 사용량 리셋 + 복원 시각 기록
  const now = new Date().toISOString()
  const { error } = await supabase.from('users').update({
    status: 'active',
    plan: 'FREE',
    analyze_count: 0,
    jd_count: 0,
    rewrite_count: 0,
    interview_count: 0,
    monthly_reset_at: now,
    withdraw_requested_at: null,
    data_delete_at: null,
    last_restored_at: now,  // 복원 시각 기록
  }).eq('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: '데이터가 복원되었습니다.',
    restored: {
      analyses: analyses?.length ?? 0,
      jdAnalyses: jdAnalyses?.length ?? 0,
      interviewGuides: interviewGuides?.length ?? 0,
      coupons: coupons?.length ?? 0,
    },
    plan: 'FREE',
  })
}

/**
 * 복원 가능한 데이터 확인 API
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const email = session.user.email

  const { data: userData } = await supabase
    .from('users')
    .select('status, data_delete_at')
    .eq('email', email)
    .single()

  if (!userData || userData.status !== 'withdrawn') {
    return NextResponse.json({ restorable: false })
  }

  // data_delete_at 체크
  if (userData.data_delete_at && new Date() >= new Date(userData.data_delete_at)) {
    return NextResponse.json({ restorable: false, reason: 'expired' })
  }

  // 복원 가능한 데이터 개수 확인
  const { count: analysesCount } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)

  const { count: jdCount } = await supabase
    .from('jd_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)

  const { count: interviewCount } = await supabase
    .from('interview_guides')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)

  const { count: couponCount } = await supabase
    .from('coupons')
    .select('id', { count: 'exact', head: true })
    .eq('claimed_by', email)
    .is('deleted_at', null)

  return NextResponse.json({
    restorable: true,
    data_delete_at: userData.data_delete_at,
    data: {
      analyses: analysesCount ?? 0,
      jdAnalyses: jdCount ?? 0,
      interviewGuides: interviewCount ?? 0,
      coupons: couponCount ?? 0,
    },
  })
}
