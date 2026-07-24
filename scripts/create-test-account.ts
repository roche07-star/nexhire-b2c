/**
 * NHN KCP 심사용 테스트 계정 생성 스크립트
 *
 * 사용법:
 * npx tsx scripts/create-test-account.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestAccount() {
  const testEmail = 'kcp-test@jobizic.com'
  const testPassword = 'KCP2026test!'

  console.log('🔧 NHN KCP 심사용 테스트 계정 생성 중...')
  console.log(`📧 이메일: ${testEmail}`)
  console.log(`🔑 비밀번호: ${testPassword}`)

  try {
    // 1. 기존 계정 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', testEmail)
      .single()

    if (existingUser) {
      console.log('⚠️  이미 존재하는 계정입니다.')
      console.log('✅ 테스트 계정 정보:')
      console.log(`   이메일: ${testEmail}`)
      console.log(`   비밀번호: ${testPassword}`)
      return
    }

    // 2. Supabase Auth 계정 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // 이메일 인증 자동 완료
      user_metadata: {
        name: 'KCP Test',
        full_name: 'KCP Test Account',
      }
    })

    if (authError) {
      console.error('❌ Auth 계정 생성 실패:', authError)
      return
    }

    console.log('✅ Auth 계정 생성 완료:', authData.user.id)

    // 3. users 테이블에 사용자 정보 추가
    const { error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        user_type: 'JOBSEEKER',
        plan: 'FREE',
        status: 'active',
        created_at: new Date().toISOString(),
      })

    if (userError) {
      console.error('❌ Users 테이블 추가 실패:', userError)
      return
    }

    console.log('✅ Users 테이블 추가 완료')
    console.log('')
    console.log('🎉 테스트 계정 생성 완료!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 NHN KCP 신청서에 기재할 정보:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`이메일(ID): ${testEmail}`)
    console.log(`비밀번호: ${testPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('💡 로그인 방법:')
    console.log('   1. https://jobizic.vercel.app/login 접속')
    console.log('   2. 위 이메일/비밀번호로 로그인')
    console.log('   3. 결제 테스트 진행')

  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

createTestAccount()
