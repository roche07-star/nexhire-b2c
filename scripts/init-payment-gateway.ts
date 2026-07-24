/**
 * payment_gateway_settings 테이블 초기화
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// .env.local 파일 로드
const envPath = join(process.cwd(), '.env.local')
const envFile = readFileSync(envPath, 'utf-8')
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const [, key, value] = match
    process.env[key] = value
  }
})

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initPaymentGateway() {
  console.log('🔧 결제 게이트웨이 설정 테이블 초기화 중...\n')

  try {
    // 1. 테이블 존재 확인
    const { data: existingData, error: selectError } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = No rows found (정상)
      console.log('⚠️  테이블 조회 에러:', selectError.message)
      console.log('   마이그레이션 SQL 파일을 Supabase Dashboard에서 실행해주세요:')
      console.log('   supabase/migrations/20260724_create_payment_gateway_settings.sql')
      return
    }

    if (existingData) {
      console.log('✅ 테이블이 이미 존재합니다')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`모드:        ${existingData.mode}`)
      console.log(`게이트웨이:  ${existingData.mode === 'REAL' ? 'PortOne (NHN KCP)' : '토스페이먼츠 (테스트)'}`)
      console.log(`업데이트:    ${existingData.updated_at || 'N/A'}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return
    }

    // 2. 초기 데이터 삽입
    console.log('📝 초기 데이터 삽입 중...')
    const { error: insertError } = await supabase
      .from('payment_gateway_settings')
      .insert({
        id: 1,
        mode: 'TEST',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('❌ 삽입 실패:', insertError.message)
      console.log('\n💡 Supabase Dashboard에서 수동으로 마이그레이션 실행:')
      console.log('   1. https://supabase.com/dashboard 접속')
      console.log('   2. SQL Editor 선택')
      console.log('   3. supabase/migrations/20260724_create_payment_gateway_settings.sql 실행')
      return
    }

    console.log('\n✅ 초기화 완료!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('모드:        TEST')
    console.log('게이트웨이:  토스페이먼츠 (테스트)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 모드 변경:')
    console.log('   https://jobizic.vercel.app/admin/payment-gateway')

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
  }
}

initPaymentGateway()
