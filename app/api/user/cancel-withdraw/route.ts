import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * 탈퇴 취소 API
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const email = session.user.email

  // 현재 사용자 정보 확인
  const { data: userData } = await supabase
    .from('users')
    .select('status')
    .eq('email', email)
    .single()

  if (!userData) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  if (userData.status !== 'withdrawing') {
    return NextResponse.json({ error: '탈퇴 신청 상태가 아닙니다' }, { status: 400 })
  }

  // status를 active로 복원, withdraw 관련 필드 초기화
  const { error } = await supabase.from('users').update({
    status: 'active',
    withdraw_requested_at: null,
    data_delete_at: null,
  }).eq('email', email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ✅ 동의 자동 복원 제거 (GDPR/PIPA 준수)
  // 사용자가 재로그인 시 동의 팝업을 통해 직접 재동의해야 함
  // 기존 코드 (제거됨):
  // await supabase.from('consents').update({
  //   is_agreed: true,
  //   withdrawn_at: null,
  // }).eq('user_email', email).eq('is_agreed', false)

  console.log(`[cancel-withdraw] User ${email} withdrawal cancelled (consents NOT auto-restored)`)

  return NextResponse.json({
    message: '탈퇴 신청이 취소되었습니다. 재로그인 후 개인정보 동의를 다시 진행해주세요.',
  })
}
