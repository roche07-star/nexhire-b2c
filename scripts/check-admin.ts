/**
 * roche07he@gmail.com SUPER_ADMIN 확인
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

async function checkAdmin() {
  const email = 'roche07he@gmail.com'

  console.log(`🔍 ${email} 계정 확인 중...\n`)

  const { data: user, error } = await supabase
    .from('users')
    .select('email, name, user_type, plan, status')
    .eq('email', email)
    .single()

  if (error) {
    console.log('❌ 계정을 찾을 수 없습니다.')
    console.log('\n💡 SUPER_ADMIN으로 설정하시겠습니까?')
    console.log('   npm run script:set-admin')
    return
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('계정 정보')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`이메일:      ${user.email}`)
  console.log(`이름:        ${user.name || 'N/A'}`)
  console.log(`권한:        ${user.user_type || 'null'}`)
  console.log(`플랜:        ${user.plan}`)
  console.log(`상태:        ${user.status}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (user.user_type === 'SUPER_ADMIN') {
    console.log('\n✅ 이미 SUPER_ADMIN입니다!')
    console.log('\n💡 Admin 페이지 접속:')
    console.log('   https://jobizic.vercel.app/admin/payment-gateway')
  } else {
    console.log(`\n⚠️  현재 권한: ${user.user_type || 'null'}`)
    console.log('SUPER_ADMIN으로 변경이 필요합니다.')
    console.log('\n변경 방법:')
    console.log('   npx tsx scripts/set-roche-admin.ts')
  }
}

checkAdmin()
