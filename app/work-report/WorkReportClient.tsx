'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userEmail: string
  isPro: boolean
}

interface WeeklyReport {
  id: string
  week_of: string
  original_content: string
  ai_generated_html: string
  created_at: string
}

interface MonthlyReport {
  id: string
  month_of: string
  aggregated_html: string
  applied_to_resume: boolean
  created_at: string
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
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '60px 40px',
          textAlign: 'center',
          border: '1px solid rgba(232, 255, 71, 0.2)',
        }}>
          <div style={{ fontSize: '72px', marginBottom: '24px' }}>🔒</div>
          <h1 style={{
            fontSize: '36px',
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
            lineHeight: '1.8',
          }}>
            이 기능은 <strong style={{ color: '#e8ff47' }}>PRO 플랜</strong> 이상에서 사용할 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/plans')}
            style={{
              padding: '18px 36px',
              fontSize: '18px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            플랜 업그레이드
          </button>
        </div>
      </div>
    )
  }

  // 상태 관리
  const [organization, setOrganization] = useState('')
  const [organizationType, setOrganizationType] = useState<'company' | 'school'>('company')
  const [organizationSaved, setOrganizationSaved] = useState(false)

  const [weeklyInput, setWeeklyInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)

  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true)
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // 현재 월 계산
  const currentMonthOf = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // 초기 데이터 로드
  useEffect(() => {
    loadOrganization()
    loadWeeklyReports()
    loadMonthlyReport()
  }, [])

  // 조직 정보 로드
  const loadOrganization = async () => {
    try {
      const response = await fetch('/api/work-report/organization')
      if (response.ok) {
        const data = await response.json()
        if (data.organization) {
          setOrganization(data.organization)
          setOrganizationType(data.organizationType)
          setOrganizationSaved(true)
        }
      }
    } catch (error) {
      console.error('조직 정보 로드 실패:', error)
    }
  }

  // 조직 정보 저장
  const saveOrganization = async () => {
    if (!organization.trim()) {
      alert('회사명 또는 학교명을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/work-report/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization, organizationType }),
      })

      if (!response.ok) throw new Error('저장 실패')

      setOrganizationSaved(true)
      alert('소속 정보가 저장되었습니다.')
    } catch (error) {
      console.error('조직 정보 저장 실패:', error)
      alert('저장에 실패했습니다.')
    }
  }

  // 주간 리포트 로드
  const loadWeeklyReports = async () => {
    setIsLoadingWeekly(true)
    try {
      const response = await fetch('/api/work-report/weekly')
      if (response.ok) {
        const data = await response.json()
        setWeeklyReports(data.reports || [])
      }
    } catch (error) {
      console.error('주간 리포트 로드 실패:', error)
    } finally {
      setIsLoadingWeekly(false)
    }
  }

  // 월간 리포트 로드
  const loadMonthlyReport = async () => {
    setIsLoadingMonthly(true)
    try {
      const response = await fetch(`/api/work-report/monthly?monthOf=${currentMonthOf}`)
      if (response.ok) {
        const data = await response.json()
        setMonthlyReport(data.report)
      }
    } catch (error) {
      console.error('월간 리포트 로드 실패:', error)
    } finally {
      setIsLoadingMonthly(false)
    }
  }

  // 주간 리포트 생성
  const handleCreateWeeklyReport = async () => {
    if (!weeklyInput.trim()) {
      alert('주간 업무 내용을 입력해주세요.')
      return
    }

    if (!organizationSaved) {
      alert('먼저 소속 정보를 저장해주세요.')
      return
    }

    // 이번 주 월요일 계산
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now.setDate(now.getDate() + diff))
    const weekOf = monday.toISOString().split('T')[0]

    setIsGenerating(true)

    try {
      const response = await fetch('/api/work-report/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: weeklyInput, weekOf }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI 정리 실패')
      }

      const data = await response.json()
      setWeeklyReports((prev) => [data.report, ...prev])
      setWeeklyInput('')
      alert('주간 Report가 생성되었습니다!')

      // 월간 리포트 자동 갱신
      await handleGenerateMonthlyReport()

    } catch (error: any) {
      console.error('주간 Report 생성 실패:', error)
      alert(error.message || '생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 월간 리포트 생성
  const handleGenerateMonthlyReport = async () => {
    setIsLoadingMonthly(true)

    try {
      const response = await fetch('/api/work-report/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthOf: currentMonthOf }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '월간 Report 생성 실패')
      }

      const data = await response.json()
      setMonthlyReport(data.report)

    } catch (error: any) {
      console.error('월간 Report 생성 실패:', error)
    } finally {
      setIsLoadingMonthly(false)
    }
  }

  // 이력서 반영
  const handleApplyToResume = async () => {
    if (!monthlyReport) {
      alert('월간 Report가 없습니다.')
      return
    }

    const confirmed = confirm(
      '월간 Report를 이력서에 반영하시겠습니까?\n\n이력서 경력 사항이 업데이트됩니다.'
    )

    if (!confirmed) return

    setIsApplying(true)

    try {
      const response = await fetch('/api/work-report/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthOf: currentMonthOf }),
      })

      if (!response.ok) throw new Error('이력서 반영 실패')

      setMonthlyReport((prev) => prev ? { ...prev, applied_to_resume: true } : null)
      alert('✅ 월간 Report가 이력서에 반영되었습니다!')

    } catch (error: any) {
      console.error('이력서 반영 실패:', error)
      alert('반영에 실패했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '100px 20px 60px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}>
            업무 Report
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#999',
            marginBottom: '12px',
          }}>
            주간 업무 기록 → AI 정리 → 월간 집계 → 이력서 반영
          </p>
          <p style={{
            fontSize: '14px',
            color: '#666',
            fontStyle: 'italic',
          }}>
            💡 10년차 헤드헌터가 구직자의 경험을 체계적으로 정리하도록 돕습니다
          </p>
        </div>

        {/* Step 1: 소속 정보 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(232, 255, 71, 0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: organizationSaved ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' : 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: '#000',
            }}>
              {organizationSaved ? '✓' : '1'}
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#fff',
            }}>
              소속 정보 {organizationSaved && <span style={{ color: '#4CAF50' }}>✓ 저장됨</span>}
            </h2>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '16px',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="orgType"
                  value="company"
                  checked={organizationType === 'company'}
                  onChange={() => setOrganizationType('company')}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ color: '#fff', fontSize: '16px' }}>재직 중</span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="orgType"
                  value="school"
                  checked={organizationType === 'school'}
                  onChange={() => setOrganizationType('school')}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ color: '#fff', fontSize: '16px' }}>재학 중</span>
              </label>
            </div>

            <input
              type="text"
              placeholder={organizationType === 'company' ? '회사명을 입력하세요 (예: 삼성전자)' : '학교명을 입력하세요 (예: 서울대학교)'}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '2px solid rgba(232, 255, 71, 0.2)',
                borderRadius: '12px',
                color: '#fff',
                marginBottom: '16px',
              }}
            />

            <button
              onClick={saveOrganization}
              style={{
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 600,
                background: organizationSaved ? 'rgba(76, 175, 80, 0.2)' : 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
                color: organizationSaved ? '#4CAF50' : '#000',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              {organizationSaved ? '✓ 저장됨' : '저장하기'}
            </button>
          </div>

          <div style={{
            background: 'rgba(232, 255, 71, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            color: '#e8ff47',
            lineHeight: '1.6',
          }}>
            <strong>💡 헤드헌터 TIP:</strong> 정확한 회사명/학교명이 이력서 신뢰도를 높입니다.
          </div>
        </div>

        {/* Step 2: 주간 업무 작성 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(232, 255, 71, 0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: '#000',
            }}>
              2
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#fff',
            }}>
              이번 주 업무 작성
            </h2>
          </div>

          <textarea
            placeholder="이번 주에 수행한 업무를 자유롭게 작성해주세요.&#10;&#10;예)&#10;- 신규 기능 개발: 사용자 대시보드 UI 개선&#10;- 버그 수정: 결제 모듈 오류 3건 해결&#10;- 회의 참석: 주간 팀 미팅, 제품 기획 회의&#10;- 문서 작성: API 문서 업데이트"
            value={weeklyInput}
            onChange={(e) => setWeeklyInput(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '15px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '2px solid rgba(232, 255, 71, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              resize: 'vertical',
              marginBottom: '16px',
              lineHeight: '1.8',
            }}
          />

          <button
            onClick={handleCreateWeeklyReport}
            disabled={isGenerating || !organizationSaved}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '18px',
              fontWeight: 600,
              background: isGenerating || !organizationSaved ? '#555' : 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
              color: isGenerating || !organizationSaved ? '#999' : '#000',
              border: 'none',
              borderRadius: '12px',
              cursor: isGenerating || !organizationSaved ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => !isGenerating && organizationSaved && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isGenerating ? '🤖 AI 정리 중...' : '✨ AI 정리하기'}
          </button>

          <div style={{
            background: 'rgba(232, 255, 71, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            color: '#e8ff47',
            lineHeight: '1.6',
            marginTop: '16px',
          }}>
            <strong>💡 헤드헌터 TIP:</strong> 정량적 성과(숫자, 비율, 기간)를 포함하면 채용 담당자가 주목합니다.
          </div>
        </div>

        {/* Step 3: 주간 Report 목록 */}
        {weeklyReports.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            border: '1px solid rgba(232, 255, 71, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                color: '#fff',
              }}>
                ✓
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#fff',
              }}>
                이번 달 주간 Report ({weeklyReports.length}건)
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {weeklyReports.map((report, index) => (
                <div
                  key={report.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(232, 255, 71, 0.15)',
                  }}
                >
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#e8ff47',
                    marginBottom: '12px',
                  }}>
                    Week {weeklyReports.length - index} • {report.week_of}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: report.ai_generated_html }}
                    style={{
                      fontSize: '15px',
                      color: '#ddd',
                      lineHeight: '1.8',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: 월간 Report */}
        {monthlyReport && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            border: '2px solid rgba(232, 255, 71, 0.3)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF9800 0%, #FFA726 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                color: '#fff',
              }}>
                ★
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#fff',
              }}>
                월간 Report (주간 리포트 자동 집계)
              </h2>
            </div>

            <div
              dangerouslySetInnerHTML={{ __html: monthlyReport.aggregated_html }}
              style={{
                fontSize: '16px',
                color: '#ddd',
                lineHeight: '1.9',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
              }}
            />

            <button
              onClick={handleApplyToResume}
              disabled={isApplying || monthlyReport.applied_to_resume}
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '18px',
                fontWeight: 600,
                background: monthlyReport.applied_to_resume ? 'rgba(76, 175, 80, 0.2)' : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: monthlyReport.applied_to_resume ? '#4CAF50' : '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: monthlyReport.applied_to_resume ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !monthlyReport.applied_to_resume && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isApplying ? '📝 이력서 반영 중...' : monthlyReport.applied_to_resume ? '✓ 이력서에 반영됨' : '📝 이력서에 반영하기'}
            </button>

            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              color: '#4CAF50',
              lineHeight: '1.6',
              marginTop: '16px',
            }}>
              <strong>💡 헤드헌터 TIP:</strong> 월간 Report는 이력서 "경력 사항"에 바로 사용할 수 있도록 전문적으로 정리되었습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
