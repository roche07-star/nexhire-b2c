import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { getPaymentMode } from '@/lib/payment-gateway'
import { redirect } from 'next/navigation'

export default async function PaymentTestPage() {
  // 1. 세션 확인
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  // 2. 권한 확인
  const { data: user } = await supabase
    .from('users')
    .select('user_type, email')
    .eq('email', session.user.email)
    .single()

  // 3. 결제 모드 확인
  let mode = 'UNKNOWN'
  let error = null
  try {
    mode = await getPaymentMode()
  } catch (e: any) {
    error = e.message
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e8e8de',
      padding: '40px 20px',
      fontFamily: 'monospace'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#e8ff47', marginBottom: '32px' }}>결제 게이트웨이 테스트</h1>

        <div style={{
          background: '#1a1a14',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '16px'
        }}>
          <h2 style={{ color: '#e8ff47', marginBottom: '16px' }}>1. 세션 정보</h2>
          <pre style={{ fontSize: '12px', lineHeight: 1.6 }}>
            {JSON.stringify({
              email: session.user.email,
              name: session.user.name,
            }, null, 2)}
          </pre>
        </div>

        <div style={{
          background: '#1a1a14',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '16px'
        }}>
          <h2 style={{ color: '#e8ff47', marginBottom: '16px' }}>2. 사용자 권한</h2>
          <pre style={{ fontSize: '12px', lineHeight: 1.6 }}>
            {JSON.stringify({
              email: user?.email,
              user_type: user?.user_type,
              is_super_admin: user?.user_type === 'SUPER_ADMIN',
            }, null, 2)}
          </pre>
        </div>

        <div style={{
          background: '#1a1a14',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '16px'
        }}>
          <h2 style={{ color: '#e8ff47', marginBottom: '16px' }}>3. 결제 모드</h2>
          {error ? (
            <div style={{ color: '#ef4444' }}>
              <strong>에러:</strong> {error}
            </div>
          ) : (
            <pre style={{ fontSize: '12px', lineHeight: 1.6 }}>
              {JSON.stringify({
                mode,
                gateway: mode === 'REAL' ? 'PortOne (NHN KCP)' : '토스페이먼츠',
              }, null, 2)}
            </pre>
          )}
        </div>

        <a
          href="/admin/payment-gateway"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#e8ff47',
            color: '#1a1a14',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Admin 페이지로 이동
        </a>
      </div>
    </div>
  )
}
