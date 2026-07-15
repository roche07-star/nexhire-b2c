'use client'

import { useState } from 'react'
import * as PortOne from '@portone/browser-sdk/v2'

export default function VerificationTestPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerification = async () => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      // KG 이니시스 본인인증 요청 (기본 구성)
      const response = await PortOne.requestIdentityVerification({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_VERIFICATION_CHANNEL_KEY!,
        identityVerificationId: `verification_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      })

      console.log('본인인증 결과:', response)

      // 성공 처리
      if (response && 'code' in response) {
        // 실패 또는 취소
        throw new Error(response.message || '본인인증이 취소되었습니다')
      }

      setResult(response)

    } catch (err: any) {
      console.error('본인인증 에러:', err)
      setError(err.message || '본인인증 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fc 0%, #ffffff 100%)',
      padding: '80px 24px',
      fontFamily: 'Pretendard, sans-serif'
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        background: 'white',
        borderRadius: 20,
        padding: 40,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        {/* 테스트 모드 표시 */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(37, 99, 235, 0.1)',
          border: '2px solid rgba(37, 99, 235, 0.3)',
          borderRadius: 12,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#2563eb',
            marginBottom: 4
          }}>
            🧪 PG사 심사용 테스트 페이지
          </div>
          <div style={{
            fontSize: 12,
            color: '#64748b'
          }}>
            KG 이니시스 통합인증 서비스 (테스트 모드)
          </div>
        </div>

        {/* 제목 */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#1e293b',
          marginBottom: 12,
          letterSpacing: '-0.02em'
        }}>
          휴대폰 본인인증
        </h1>
        <p style={{
          fontSize: 16,
          color: '#64748b',
          marginBottom: 40,
          lineHeight: 1.6
        }}>
          KG 이니시스 통합인증 서비스를 통해<br />
          휴대폰 본인인증을 진행합니다.
        </p>

        {/* 인증 버튼 */}
        <button
          onClick={handleVerification}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: isProcessing
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: isProcessing ? '#94a3b8' : '#ffffff',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: 24,
            boxShadow: isProcessing ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
          }}
        >
          {isProcessing ? '본인인증 진행 중...' : '📱 휴대폰 본인인증 시작'}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            padding: 16,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            color: '#ef4444',
            fontSize: 14,
            marginBottom: 24
          }}>
            ❌ {error}
          </div>
        )}

        {/* 성공 결과 */}
        {result && (
          <div style={{
            padding: 20,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            marginBottom: 24
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#10b981',
              marginBottom: 12
            }}>
              ✅ 본인인증 성공!
            </div>
            <div style={{
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.6,
              fontFamily: 'monospace',
              background: 'white',
              padding: 12,
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {JSON.stringify(result, null, 2)}
            </div>
          </div>
        )}

        {/* 안내 사항 */}
        <div style={{
          background: '#f8f9fc',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 12
          }}>
            📋 테스트 안내
          </div>
          <ul style={{
            fontSize: 13,
            color: '#64748b',
            lineHeight: 1.8,
            paddingLeft: 20,
            margin: 0
          }}>
            <li>이 페이지는 PG사 심사를 위한 테스트 페이지입니다</li>
            <li>KG 이니시스 통합인증 서비스를 사용합니다</li>
            <li>테스트 모드로 동작하며 실제 인증은 진행되지 않습니다</li>
            <li>별도 모듈 설정 없이 기본 구성으로 동작합니다</li>
          </ul>
        </div>

        {/* 환경 정보 */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          fontSize: 12,
          color: '#94a3b8'
        }}>
          <div style={{ marginBottom: 4 }}>
            <strong>Store ID:</strong> {process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '미설정'}
          </div>
          <div>
            <strong>Channel Key:</strong> {process.env.NEXT_PUBLIC_PORTONE_VERIFICATION_CHANNEL_KEY || '미설정'}
          </div>
        </div>
      </div>
    </main>
  )
}
