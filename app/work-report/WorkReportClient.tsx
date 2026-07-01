'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userEmail: string
  isPro: boolean
}

interface WeeklyReport {
  weekNumber: number
  content: string
  generatedHtml?: string
  createdAt: string
}

export default function WorkReportClient({ userEmail, isPro }: Props) {
  const router = useRouter()

  // FREE 플랜 업그레이드 안내
  if (!isPro) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        padding: '100px 20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '600px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#e8ff47',
            marginBottom: '16px',
          }}>
            업무 Report
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#ccc',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}>
            이 기능은 <strong style={{ color: '#e8ff47' }}>PRO 플랜</strong> 이상에서 사용할 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/plans')}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 600,
              background: '#e8ff47',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            플랜 업그레이드
          </button>
        </div>
      </div>
    )
  }

  // 회사명/학교명
  const [organization, setOrganization] = useState('')
  const [organizationType, setOrganizationType] = useState<'company' | 'school'>('company')

  // 주간보고 입력
  const [weeklyInput, setWeeklyInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 생성된 리포트
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyReportHtml, setMonthlyReportHtml] = useState('')

  // 이력서 반영 상태
  const [isApplying, setIsApplying] = useState(false)

  // AI 정리 - 주간 Report 생성
  const handleGenerateWeeklyReport = async () => {
    if (!weeklyInput.trim()) {
      alert('주간 업무 내용을 입력해주세요.')
      return
    }

    if (!organization.trim()) {
      alert('재직 중인 회사명 또는 학교명을 입력해주세요.')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/work-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly',
          content: weeklyInput,
          organization,
          organizationType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI 정리 실패')
      }

      const data = await response.json()

      // 주간 리포트 추가
      const newReport: WeeklyReport = {
        weekNumber: weeklyReports.length + 1,
        content: weeklyInput,
        generatedHtml: data.html,
        createdAt: new Date().toISOString(),
      }

      setWeeklyReports((prev) => [...prev, newReport])
      setWeeklyInput('') // 입력 초기화

      // 자동으로 월간 리포트 갱신
      await handleGenerateMonthlyReport([...weeklyReports, newReport])

    } catch (error: any) {
      console.error('주간 Report 생성 실패:', error)
      alert(error.message || '주간 Report 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 월간 Report 생성 (주간 리포트 자동 집계)
  const handleGenerateMonthlyReport = async (reports: WeeklyReport[]) => {
    if (reports.length === 0) {
      setMonthlyReportHtml('')
      return
    }

    try {
      const response = await fetch('/api/work-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monthly',
          weeklyReports: reports.map((r) => ({
            week: r.weekNumber,
            html: r.generatedHtml,
          })),
          organization,
          organizationType,
        }),
      })

      if (!response.ok) {
        throw new Error('월간 Report 생성 실패')
      }

      const data = await response.json()
      setMonthlyReportHtml(data.html)

    } catch (error: any) {
      console.error('월간 Report 생성 실패:', error)
    }
  }

  // 이력서에 반영
  const handleApplyToResume = async () => {
    if (!monthlyReportHtml) {
      alert('월간 Report가 생성되지 않았습니다.')
      return
    }

    const confirmed = confirm(
      '월간 Report를 이력서에 반영하시겠습니까?\n기존 이력서 내용이 업데이트됩니다.'
    )

    if (!confirmed) return

    setIsApplying(true)

    try {
      const response = await fetch('/api/work-report/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyReportHtml,
          organization,
          organizationType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '이력서 반영 실패')
      }

      alert('월간 Report가 이력서에 성공적으로 반영되었습니다!')

      // 이력서 페이지로 이동 (옵션)
      // router.push('/analyze')

    } catch (error: any) {
      console.error('이력서 반영 실패:', error)
      alert(error.message || '이력서 반영에 실패했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '100px 20px 40px',
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        {/* 헤더 */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#e8ff47',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          업무 Report
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#999',
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          주간 업무를 작성하면 AI가 정리하여 이력서에 반영합니다
        </p>

        {/* 회사명/학교명 입력 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '16px',
          }}>
            소속 정보
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}>
              <input
                type="radio"
                name="orgType"
                value="company"
                checked={organizationType === 'company'}
                onChange={(e) => setOrganizationType('company')}
              />
              <span style={{ color: '#fff' }}>재직 중</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <input
                type="radio"
                name="orgType"
                value="school"
                checked={organizationType === 'school'}
                onChange={(e) => setOrganizationType('school')}
              />
              <span style={{ color: '#fff' }}>재학 중</span>
            </label>
          </div>

          <input
            type="text"
            placeholder={organizationType === 'company' ? '회사명을 입력하세요' : '학교명을 입력하세요'}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
        </div>

        {/* 주간보고 입력 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '16px',
          }}>
            이번 주 업무 작성
          </h2>

          <textarea
            placeholder="이번 주에 수행한 업무를 자유롭게 작성해주세요.&#10;예) 신규 기능 개발, 버그 수정, 회의 참석, 문서 작성 등"
            value={weeklyInput}
            onChange={(e) => setWeeklyInput(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              resize: 'vertical',
              marginBottom: '16px',
            }}
          />

          <button
            onClick={handleGenerateWeeklyReport}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 600,
              background: isGenerating ? '#555' : '#e8ff47',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? 'AI 정리 중...' : 'AI 정리하기'}
          </button>
        </div>

        {/* 주간 Report 목록 */}
        {weeklyReports.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '16px',
            }}>
              주간 Report 목록 ({weeklyReports.length}건)
            </h2>

            {weeklyReports.map((report, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e8ff47',
                  marginBottom: '8px',
                }}>
                  Week {report.weekNumber}
                </div>
                <div
                  dangerouslySetInnerHTML={{ __html: report.generatedHtml || '' }}
                  style={{
                    fontSize: '14px',
                    color: '#ddd',
                    lineHeight: '1.6',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 월간 Report */}
        {monthlyReportHtml && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '16px',
            }}>
              월간 Report (전체 주간 리포트 자동 집계)
            </h2>

            <div
              dangerouslySetInnerHTML={{ __html: monthlyReportHtml }}
              style={{
                fontSize: '15px',
                color: '#ddd',
                lineHeight: '1.8',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '20px',
              }}
            />

            <button
              onClick={handleApplyToResume}
              disabled={isApplying}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 600,
                background: isApplying ? '#555' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isApplying ? 'not-allowed' : 'pointer',
                marginTop: '16px',
              }}
            >
              {isApplying ? '이력서 반영 중...' : '이력서에 반영하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
