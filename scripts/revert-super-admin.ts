/**
 * roche07zn@gmail.com을 원래 권한으로 복구
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

async function revertUser() {
  const email = 'roche07zn@gmail.com'

  console.log(`🔄 ${email}을 원래 권한으로 복구 중...\n`)

  // 1. 현재 상태 확인
  const { data: currentUser } = await supabase
    .from('users')
    .select('email, user_type, plan')
    .eq('email', email)
    .single()

  if (currentUser) {
    console.log('현재 상태:')
    console.log(`   user_type: ${currentUser.user_type}`)
    console.log(`   plan: ${currentUser.plan}`)
  }

  // 2. JOBSEEKER로 복구 (일반 사용자)
  const { error } = await supabase
    .from('users')
    .update({
      user_type: 'JOBSEEKER',
      plan: 'FREE',
    })
    .eq('email', email)

  if (error) {
    console.error('❌ 복구 실패:', error.message)
    process.exit(1)
  }

  console.log('\n✅ 원래 권한으로 복구 완료!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`이메일:      ${email}`)
  console.log(`권한:        JOBSEEKER (일반 사용자)`)
  console.log(`플랜:        FREE`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

revertUser()
