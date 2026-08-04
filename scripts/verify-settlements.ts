/**
 * 정산 처리 검증 스크립트
 *
 * 검증 항목:
 * 1. 결제 완료 후 payments 테이블 저장 확인
 * 2. 플랜 구독 시 subscriptions 생성 확인
 * 3. STORE 구매 시 쿠폰 발급 확인
 * 4. 정산 요약 계산 정확도 확인
 */

import { createClient } from '@supabase/supabase-js'

// 환경 변수 확인
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('   SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_KEY)
  console.error('')
  console.error('💡 수동으로 실행하세요:')
  console.error('   1. 관리자 페이지 접속: https://jobizic.vercel.app/admin/settlements')
  console.error('   2. 결제 내역 탭에서 최근 결제 확인')
  console.error('   3. 정산 요약 탭에서 매출/MRR 확인')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function verifySettlements() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 정산 처리 검증 시작')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. 최근 결제 내역 조회
  console.log('1️⃣ 최근 결제 내역 확인...')
  const { data: recentPayments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .order('paid_at', { ascending: false })
    .limit(5)

  if (paymentsError) {
    console.error('❌ 결제 내역 조회 실패:', paymentsError)
    return
  }

  console.log(`✅ 최근 결제 ${recentPayments?.length || 0}건 조회 완료`)
  recentPayments?.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.user_email} - ${p.plan} - ${p.amount.toLocaleString()}원 - ${p.status}`)
    console.log(`      결제일: ${p.paid_at}`)
    console.log(`      거래ID: ${p.transaction_id}`)
    console.log(`      구독ID: ${p.subscription_id || '없음 (STORE 구매)'}`)
    console.log('')
  })

  // 2. 플랜 구독 확인
  console.log('2️⃣ 활성 구독 확인...')
  const { data: activeSubscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .limit(5)

  if (subsError) {
    console.error('❌ 구독 조회 실패:', subsError)
  } else {
    console.log(`✅ 활성 구독 ${activeSubscriptions?.length || 0}건 조회 완료`)
    activeSubscriptions?.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.user_email} - ${s.plan} - ${s.amount.toLocaleString()}원/월`)
      console.log(`      시작일: ${s.started_at}`)
      console.log(`      만료일: ${s.expires_at}`)
      console.log('')
    })
  }

  // 3. STORE 구매 쿠폰 확인
  console.log('3️⃣ STORE 구매 쿠폰 확인...')
  const { data: storeCoupons, error: couponsError } = await supabase
    .from('coupons')
    .select('*')
    .eq('issued_by', 'STORE')
    .order('claimed_at', { ascending: false })
    .limit(5)

  if (couponsError) {
    console.error('❌ 쿠폰 조회 실패:', couponsError)
  } else {
    console.log(`✅ STORE 쿠폰 ${storeCoupons?.length || 0}건 조회 완료`)
    storeCoupons?.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.claimed_by} - ${c.feature} - ${c.credits}회`)
      console.log(`      발급일: ${c.claimed_at}`)
      console.log(`      만료일: ${c.expires_at}`)
      console.log(`      사용: ${c.used || 0}/${c.credits}`)
      console.log('')
    })
  }

  // 4. 정산 요약 계산
  console.log('4️⃣ 이번 달 정산 요약 계산...')
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'success')
    .gte('paid_at', startOfMonth)
    .lte('paid_at', `${endOfMonth}T23:59:59`)

  const grossRevenue = (monthlyPayments || []).reduce((sum, p) => sum + p.amount, 0)
  const mrr = (activeSubscriptions || []).reduce((sum, s) => sum + s.amount, 0)
  const activeUsers = activeSubscriptions?.length || 0
  const arpu = activeUsers > 0 ? Math.round(mrr / activeUsers) : 0

  console.log(`✅ ${startOfMonth} ~ ${endOfMonth} 정산 요약:`)
  console.log(`   총 매출: ${grossRevenue.toLocaleString()}원`)
  console.log(`   MRR: ${mrr.toLocaleString()}원`)
  console.log(`   활성 사용자: ${activeUsers}명`)
  console.log(`   ARPU: ${arpu.toLocaleString()}원`)
  console.log('')

  // 5. 데이터 정합성 체크
  console.log('5️⃣ 데이터 정합성 체크...')

  // 5-1. subscription_id가 있는 payments는 실제 subscription이 존재하는지
  const { data: paymentsWithSubs } = await supabase
    .from('payments')
    .select('subscription_id')
    .not('subscription_id', 'is', null)
    .limit(10)

  if (paymentsWithSubs && paymentsWithSubs.length > 0) {
    const subsIds = paymentsWithSubs.map(p => p.subscription_id)
    const { data: existingSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .in('id', subsIds)

    const existingIds = new Set(existingSubs?.map(s => s.id))
    const orphanedPayments = paymentsWithSubs.filter(p => !existingIds.has(p.subscription_id))

    if (orphanedPayments.length > 0) {
      console.log(`⚠️  고아 결제 발견: ${orphanedPayments.length}건`)
      console.log('   (subscription_id는 있지만 실제 구독이 없음)')
    } else {
      console.log('✅ 결제-구독 관계 정상')
    }
  }

  // 5-2. STORE 구매는 subscription_id가 null이어야 함
  const { data: storePayments } = await supabase
    .from('payments')
    .select('subscription_id, plan')
    .eq('plan', 'STORE')
    .not('subscription_id', 'is', null)
    .limit(5)

  if (storePayments && storePayments.length > 0) {
    console.log(`⚠️  잘못된 STORE 결제: ${storePayments.length}건`)
    console.log('   (STORE 구매인데 subscription_id가 있음)')
  } else {
    console.log('✅ STORE 결제 데이터 정상')
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ 정산 처리 검증 완료')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

verifySettlements()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 검증 실패:', err)
    process.exit(1)
  })
