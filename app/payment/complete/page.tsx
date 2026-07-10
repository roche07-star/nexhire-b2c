import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const params = await searchParams
  const orderId = params.orderId

  return (
    <main style={{
      background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Content */}
      <section style={{
        padding: '140px 24px 80px',
        maxWidth: 600,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 32px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40
        }}>
          ✓
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: 16,
          letterSpacing: '-0.02em'
        }}>
          결제가 완료되었습니다
        </h1>

        <p style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 48,
          lineHeight: 1.6
        }}>
          이용권이 활성화되었습니다.<br />
          지금 바로 서비스를 이용하실 수 있습니다.
        </p>

        {/* Order Info */}
        {orderId && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 8
            }}>
              주문번호
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'monospace'
            }}>
              {orderId}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <Link href="/analyze">
            <button style={{
              width: '100%',
              padding: '18px 32px',
              background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              서비스 이용하기 →
            </button>
          </Link>

          <Link href="/plans">
            <button style={{
              width: '100%',
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              플랜 확인하기
            </button>
          </Link>
        </div>

        {/* Info */}
        <div style={{
          marginTop: 48,
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.8
        }}>
          결제 영수증은 이메일로 발송됩니다.<br />
          문의사항은 고객센터를 이용해주세요.
        </div>
      </section>
    </main>
  )
}
