/**
 * 현재 결제 게이트웨이 모드 확인
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPaymentMode() {
  console.log('🔍 결제 게이트웨이 모드 확인 중...\n')

  const { data, error } = await supabase
    .from('payment_gateway_settings')
    .select('*')
    .single()

  if (error) {
    console.error('❌ 조회 실패:', error.message)
    return
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('현재 결제 게이트웨이 모드')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`모드:        ${data.mode}`)
  console.log(`게이트웨이:  ${data.mode === 'REAL' ? 'PortOne (NHN KCP 실결제)' : '토스페이먼츠 (테스트)'}`)
  console.log(`업데이트:    ${data.updated_at || 'N/A'}`)
  console.log(`업데이트자:  ${data.updated_by || 'N/A'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (data.mode === 'TEST') {
    console.log('\n⚠️  현재 TEST 모드입니다!')
    console.log('NHN KCP 심사를 위해서는 REAL 모드로 전환이 필요합니다.')
    console.log('\n전환 방법:')
    console.log('1. https://jobizic.vercel.app/admin/payment-gateway 접속')
    console.log('2. SUPER_ADMIN 계정으로 로그인')
    console.log('3. "실결제 모드로 전환" 버튼 클릭')
  } else {
    console.log('\n✅ REAL 모드 (NHN KCP 실결제) 활성화됨!')
    console.log('NHN KCP 심사 준비 완료!')
  }
}

checkPaymentMode()
