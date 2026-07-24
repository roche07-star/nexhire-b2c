/**
 * 결제 게이트웨이를 TEST 모드로 변경
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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setTestMode() {
  console.log('🔄 TEST 모드로 변경 중...\n')

  const { error } = await supabase
    .from('payment_gateway_settings')
    .update({
      mode: 'TEST',
      updated_by: 'system',
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    console.error('❌ 변경 실패:', error.message)
    process.exit(1)
  }

  console.log('✅ TEST 모드로 변경 완료!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('모드:        TEST')
  console.log('게이트웨이:  토스페이먼츠 (테스트)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 NHN KCP 심사 통과 후:')
  console.log('   1. PortOne에서 실연동 채널 추가')
  console.log('   2. 채널 키를 환경변수에 설정')
  console.log('   3. REAL 모드로 전환')
}

setTestMode()
