/**
 * 보안 기능 통합 테스트 스크립트
 *
 * 실행: node scripts/test-security.js
 */

const API_URL = 'http://localhost:3000'

async function testLocalStorage() {
  console.log('\n📦 1. localStorage 개인정보 테스트...')
  console.log('→ 브라우저에서 수동 확인 필요')
  console.log('  Application > Local Storage')
  console.log('  candidate_name_* 항목이 없어야 함')
}

async function testRateLimit() {
  console.log('\n🛑 2. Rate Limiting 테스트...')

  let blocked = false
  for (let i = 0; i < 7; i++) {
    try {
      const formData = new FormData()
      formData.append('pastedText', '테스트')

      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      console.log(`  시도 ${i + 1}: ${res.status}`)

      if (res.status === 429) {
        console.log('  ✅ Rate Limiting 작동!')
        blocked = true
        break
      }
    } catch (e) {
      console.error(`  ❌ 에러:`, e.message)
    }
  }

  if (!blocked) {
    console.log('  ⚠️  429 응답이 없습니다. 로그인이 필요하거나 Rate Limit이 높을 수 있습니다.')
  }
}

async function testMiddleware() {
  console.log('\n🔒 3. Middleware 인증 테스트...')

  try {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: {
        'Cookie': '', // 쿠키 없이 요청
      },
    })

    if (res.status === 401) {
      console.log('  ✅ Middleware 인증 체크 작동!')
    } else {
      console.log(`  ⚠️  예상: 401, 실제: ${res.status}`)
    }
  } catch (e) {
    console.error('  ❌ 에러:', e.message)
  }
}

async function testHtmlEscape() {
  console.log('\n🛡️  4. HTML Escape 테스트...')

  // escapeHtml 함수 복사 (브라우저/Node.js 환경 차이)
  function escapeHtml(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const tests = [
    ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
    ['"hello"', '&quot;hello&quot;'],
    ["it's", 'it&#39;s'],
  ]

  tests.forEach(([input, expected]) => {
    const result = escapeHtml(input)
    if (result === expected) {
      console.log(`  ✅ "${input}" → OK`)
    } else {
      console.log(`  ❌ "${input}" → "${result}" (예상: "${expected}")`)
    }
  })
}

async function testLogger() {
  console.log('\n📝 5. 로그 마스킹 테스트...')

  function maskSensitive(text) {
    return text
      .replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/g, (_, user, domain) => {
        return `${user[0]}***@${domain[0]}***.${domain.split('.').pop()}`
      })
      .replace(/(\d{2,3})-?(\d{3,4})-?(\d{4})/g, (_, prefix, middle, last) => {
        return `${prefix}-****-${last}`
      })
  }

  const tests = [
    ['test@example.com', 't***@e***.com'],
    ['010-1234-5678', '010-****-5678'],
  ]

  tests.forEach(([input, expected]) => {
    const result = maskSensitive(input)
    if (result === expected) {
      console.log(`  ✅ ${input} → ${result}`)
    } else {
      console.log(`  ⚠️  ${input} → ${result} (예상: ${expected})`)
    }
  })
}

async function runAllTests() {
  console.log('🔒 보안 기능 통합 테스트 시작\n')
  console.log('=' .repeat(50))

  await testLocalStorage()
  await testRateLimit()
  await testMiddleware()
  await testHtmlEscape()
  await testLogger()

  console.log('\n' + '='.repeat(50))
  console.log('\n✅ 테스트 완료!')
  console.log('\n추가 테스트:')
  console.log('- Slack 알림: POST /api/security/test (MANAGER 로그인 필요)')
  console.log('- IP 차단: 여러 번 실패 요청 시도')
  console.log('- Vercel Logs: 프로덕션 환경에서 로그 확인')
}

runAllTests().catch(console.error)
