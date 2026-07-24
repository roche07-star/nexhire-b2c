/**
 * roche07zn@gmail.com을 SUPER_ADMIN으로 설정
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

async function setSuperAdmin() {
  const email = 'roche07zn@gmail.com'

  console.log(`🔧 ${email}을 SUPER_ADMIN으로 설정 중...\n`)

  // 1. 기존 사용자 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('email, user_type')
    .eq('email', email)
    .single()

  if (existingUser) {
    console.log('✅ 기존 사용자 발견')
    console.log(`   현재 user_type: ${existingUser.user_type || 'null'}`)
  } else {
    console.log('⚠️  사용자가 없습니다. 생성합니다...')
  }

  // 2. SUPER_ADMIN으로 업데이트 또는 생성
  const { error } = await supabase
    .from('users')
    .upsert({
      email: email,
      name: '박영철 (ROCHE)',
      user_type: 'SUPER_ADMIN',
      plan: 'EXPERT',
      status: 'active',
    }, { onConflict: 'email' })

  if (error) {
    console.error('❌ 업데이트 실패:', error.message)
    process.exit(1)
  }

  console.log('\n✅ SUPER_ADMIN 설정 완료!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`이메일:      ${email}`)
  console.log(`권한:        SUPER_ADMIN`)
  console.log(`플랜:        EXPERT`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 접속 방법:')
  console.log('   1. https://jobizic.vercel.app/login 로그인')
  console.log('   2. https://jobizic.vercel.app/admin/payment-gateway 접속')
}

setSuperAdmin()
