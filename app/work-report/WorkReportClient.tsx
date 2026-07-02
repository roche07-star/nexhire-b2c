'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userEmail: string
  isPro: boolean
  isHeadhunter: boolean
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
  created_at: string
}

export default function WorkReportClient({ userEmail, isPro, isHeadhunter }: Props) {
  const router = useRouter()

  // FREE 플랜 업그레이드 안내
  if (!isPro) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        padding: '140px 20px 40px',
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
  const [isEditingOrg, setIsEditingOrg] = useState(false)

  const [weeklyInput, setWeeklyInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([])

  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true)
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false)

  // 선택된 월 (YYYY-MM 형식)
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  // 사용 가능한 월 목록 생성 (데이터가 있는 월 + 현재 월)
  const getAvailableMonths = (): string[] => {
    const months = new Set<string>()

    // 현재 월 추가
    months.add(selectedMonth)

    // 주간 Report가 있는 월 추가
    weeklyReports.forEach(report => {
      months.add(report.week_of.substring(0, 7))
    })

    // 월간 Report가 있는 월 추가
    monthlyReports.forEach(report => {
      months.add(report.month_of.substring(0, 7))
    })

    // 정렬 (최신순)
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }

  const availableMonths = getAvailableMonths()

  // 선택된 월의 데이터 필터링
  // 주간 보고는 해당 주의 목요일(week_of + 3일) 기준으로 월 분류
  const getMonthForWeek = (weekOf: string) => {
    const date = new Date(weekOf)
    date.setDate(date.getDate() + 3) // 목요일 기준
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const currentMonthOf = `${selectedMonth}-01`
  const filteredWeeklyReports = weeklyReports.filter(
    r => getMonthForWeek(r.week_of) === selectedMonth
  )
  const monthlyReport = monthlyReports.find(
    r => r.month_of.substring(0, 7) === selectedMonth
  ) || null

  // 초기 데이터 로드
  useEffect(() => {
    loadOrganization()
    loadWeeklyReports()
    loadMonthlyReports()
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
      setIsEditingOrg(false)
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
  const loadMonthlyReports = async () => {
    setIsLoadingMonthly(true)
    try {
      const response = await fetch('/api/work-report/monthly') // 전체 조회
      if (response.ok) {
        const data = await response.json()
        setMonthlyReports(data.reports || [])
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

    // 이번 주 월요일 계산 (로컬 시간 기준)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)

    // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (UTC 변환 없음)
    const weekOf = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

    console.log('📊 주간 Report 생성:', {
      today: now.toLocaleDateString('ko-KR'),
      dayOfWeek,
      diff,
      monday: monday.toLocaleDateString('ko-KR'),
      weekOf,
      content: weeklyInput.substring(0, 50)
    })

    setIsGenerating(true)

    try {
      const response = await fetch('/api/work-report/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: weeklyInput, weekOf }),
      })

      console.log('📊 API 응답:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('📊 API 에러:', errorData)
        throw new Error(errorData.error || 'AI 정리 실패')
      }

      const data = await response.json()
      setWeeklyReports((prev) => [data.report, ...prev])
      setWeeklyInput('')
      alert('주간 Report가 생성되었습니다!')

    } catch (error: any) {
      console.error('주간 Report 생성 실패:', error)
      alert(error.message || '생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 월간 리포트 생성
  const handleGenerateMonthlyReport = async () => {
    console.log('📊 월간 Report 생성 시작:', { currentMonthOf, weeklyCount: weeklyReports.length })
    setIsLoadingMonthly(true)

    try {
      const response = await fetch('/api/work-report/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthOf: currentMonthOf }),
      })

      console.log('📊 월간 API 응답:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error('📊 월간 API 에러:', error)
        throw new Error(error.error || '월간 Report 생성 실패')
      }

      const data = await response.json()
      setMonthlyReports(prev => {
        const filtered = prev.filter(r => r.month_of !== data.report.month_of)
        return [data.report, ...filtered].sort((a, b) => b.month_of.localeCompare(a.month_of))
      })
      alert('✅ 월간 Report가 생성되었습니다!')

    } catch (error: any) {
      console.error('월간 Report 생성 실패:', error)
      const errorMessage = error.message || '월간 Report 생성에 실패했습니다.'
      alert(`❌ ${errorMessage}`)
    } finally {
      setIsLoadingMonthly(false)
    }
  }

  // 주간 Report 삭제
  const handleDeleteWeeklyReport = async (id: string) => {
    const confirmed = confirm('이 주간 Report를 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/work-report/weekly?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('삭제 실패')

      setWeeklyReports((prev) => prev.filter((r) => r.id !== id))
      alert('✅ 주간 Report가 삭제되었습니다.')

    } catch (error: any) {
      console.error('주간 Report 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '120px 20px 60px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}>
            업무 Report
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#999',
            marginBottom: '8px',
          }}>
            주간 업무 기록 → AI 정리 → 월간 집계 → 이력서 반영
          </p>
          <p style={{
            fontSize: '13px',
            color: '#666',
            fontStyle: 'italic',
          }}>
            💡 10년차 헤드헌터가 구직자의 경험을 체계적으로 정리하도록 돕습니다
          </p>
        </div>

        {/* 소속 정보 (작고 간결하게) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
          border: '1px solid rgba(232, 255, 71, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span style={{ color: '#999', fontSize: '14px' }}>소속:</span>
            {!isEditingOrg && organizationSaved ? (
              <>
                <span style={{ color: '#e8ff47', fontSize: '15px', fontWeight: 600 }}>
                  {organization}
                </span>
                <span style={{ color: '#666', fontSize: '13px' }}>
                  ({organizationType === 'company' ? '재직' : '재학'})
                </span>
                <button
                  onClick={() => setIsEditingOrg(true)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ccc',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  수정
                </button>
              </>
            ) : (
              <>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value as 'company' | 'school')}
                  style={{
                    padding: '6px 10px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(232, 255, 71, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                  }}
                >
                  <option value="company">재직</option>
                  <option value="school">재학</option>
                </select>
                <input
                  type="text"
                  placeholder={organizationType === 'company' ? '회사명' : '학교명'}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(232, 255, 71, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    flex: 1,
                    minWidth: '150px',
                  }}
                />
                <button
                  onClick={saveOrganization}
                  style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #e8ff47 0%, #f0ff6b 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  저장
                </button>
                {organizationSaved && (
                  <button
                    onClick={() => {
                      loadOrganization()
                      setIsEditingOrg(false)
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      background: 'transparent',
                      color: '#999',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 주간 Report 목록 */}
        {weeklyReports.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            border: '1px solid rgba(232, 255, 71, 0.1)',
          }}>
            {/* 월별 탭 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}>
              {availableMonths.map(month => {
                const date = new Date(month + '-01')
                const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`
                const isSelected = month === selectedMonth

                return (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: isSelected
                        ? 'linear-gradient(135deg, #e8ff47 0%, #d4e82f 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#000' : '#fff',
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    📅 {label}
                  </button>
                )
              })}
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '20px',
            }}>
              📋 {selectedMonth.substring(0, 4)}년 {parseInt(selectedMonth.substring(5, 7))}월 주간 Report ({filteredWeeklyReports.length}건)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredWeeklyReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '18px',
                    border: '1px solid rgba(232, 255, 71, 0.15)',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#e8ff47',
                    }}>
                      {(() => {
                        const date = new Date(report.week_of + 'T00:00:00')
                        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 주간`
                      })()}
                    </div>
                    <button
                      onClick={() => handleDeleteWeeklyReport(report.id)}
                      style={{
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 0, 0, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)'
                      }}
                    >
                      ✕ 삭제
                    </button>
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: report.ai_generated_html }}
                    style={{
                      fontSize: '14px',
                      color: '#ddd',
                      lineHeight: '1.7',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* 월간 보고 생성/업데이트 버튼 */}
            {filteredWeeklyReports.length >= 2 && (
              <button
                onClick={handleGenerateMonthlyReport}
                disabled={isLoadingMonthly}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: isLoadingMonthly ? '#555' : monthlyReport
                    ? 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)'
                    : 'linear-gradient(135deg, #FF9800 0%, #FFA726 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isLoadingMonthly ? 'not-allowed' : 'pointer',
                  marginTop: '20px',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => !isLoadingMonthly && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isLoadingMonthly
                  ? '📊 월간 보고 처리 중...'
                  : monthlyReport
                    ? '🔄 월간 보고 업데이트 (주간보고 재정리)'
                    : '📊 월간 보고 생성 (주간보고 정리)'}
              </button>
            )}
          </div>
        )}

        {/* 월간 Report */}
        {monthlyReport && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            border: '2px solid rgba(232, 255, 71, 0.25)',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '20px',
            }}>
              ⭐ 월간 Report
            </h2>

            <div
              dangerouslySetInnerHTML={{ __html: monthlyReport.aggregated_html }}
              style={{
                fontSize: '15px',
                color: '#ddd',
                lineHeight: '1.8',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '18px',
              }}
            />

            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#4CAF50',
              lineHeight: '1.6',
            }}>
              <strong>💡 TIP:</strong> 월간 Report는 <strong>이력서 분석 시 자동으로 반영</strong>됩니다. 이력서를 생성/분석하면 해당 회사의 경력 사항에 업무 내역이 추가됩니다.
            </div>
          </div>
        )}

        {/* 새 주간 업무 작성 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(232, 255, 71, 0.1)',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '16px',
          }}>
            🆕 새 주간 업무 작성
          </h2>

          <textarea
            placeholder="이번 주에 수행한 업무를 자유롭게 작성해주세요.&#10;&#10;예)&#10;- 신규 기능 개발: 사용자 대시보드 UI 개선&#10;- 버그 수정: 결제 모듈 오류 3건 해결&#10;- 회의 참석: 주간 팀 미팅, 제품 기획 회의"
            value={weeklyInput}
            onChange={(e) => setWeeklyInput(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '18px',
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
              padding: '16px',
              fontSize: '17px',
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
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#e8ff47',
            lineHeight: '1.6',
            marginTop: '16px',
          }}>
            <strong>💡 TIP:</strong> 정량적 성과(숫자, 비율, 기간)를 포함하면 채용 담당자가 주목합니다.
          </div>
        </div>
      </div>
    </div>
  )
}
