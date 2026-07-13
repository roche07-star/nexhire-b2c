'use client'

import { useState, useEffect } from 'react'
import type { Coupon } from '@/lib/types/coupon'
import AnnouncementModal from '@/components/AnnouncementModal'

interface User {
  email: string
  name: string | null
  image: string | null
  plan: 'FREE' | 'PRO' | 'EXPERT'
  user_type: 'SUPER_ADMIN' | 'MANAGER' | 'HEADHUNTER' | 'JOBSEEKER' | null
  analyze_count: number
  jd_count: number
  rewrite_count: number
  interview_count: number
  monthly_reset_at: string | null
  created_at: string
  headhunter_sharing_enabled: boolean | null
  headhunter_sharing_consented_at: string | null
  downgrade_to: string | null
  plan_end_date: string | null
  downgrade_requested_at: string | null
  status: 'active' | 'withdrawing' | 'withdrawn'
  withdraw_requested_at: string | null
}

// ✅ 중앙 타입 사용

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE:   { analyze: 3,  jd: 3,  rewrite: 3,  interview: 0 },
  PRO:    { analyze: 30, jd: 30, rewrite: 10, interview: 10 },
  EXPERT: { analyze: 50, jd: 50, rewrite: 50, interview: 25 },
}

const FEATURE_LABELS: Record<string, string> = {
  storage: '이력서 추가 저장',
  resume: '이력서 분석',
  jd: 'JD 분석',
  rewrite: '이력서 생성',
  proposal: '클라이언트 제안서',
  interview: '면접 가이드',
  package: '🎁 올인원 패키지',
}

type AdminTab = 'users' | 'plan-changes' | 'support' | 'coupons' | 'payment-gateway' | 'telegram' | 'tokens' | 'audit-logs'

interface Stats {
  total: number
  free: number
  pro: number
  expert: number
  superAdmin: number
  manager: number
  jobseeker: number
  headhunter: number
  headhunterSharing: number
}

interface AdminClientProps {
  currentUserType?: 'SUPER_ADMIN' | 'MANAGER' | 'HEADHUNTER' | 'JOBSEEKER' | null
}

export default function AdminClient({ currentUserType }: AdminClientProps) {
  const isSuperAdmin = currentUserType === 'SUPER_ADMIN'

  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [showOnlyHeadhunterSharing, setShowOnlyHeadhunterSharing] = useState(false)

  // Phase 1: 검색, 필터, 정렬, 페이지네이션
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [usersLoading, setUsersLoading] = useState(false)

  // coupon state
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [genFeature, setGenFeature] = useState('resume')
  const [genQty, setGenQty] = useState('1')
  const [genPrice, setGenPrice] = useState('0')
  const [genIssuedTo, setGenIssuedTo] = useState('')
  const [genExpires, setGenExpires] = useState('')
  const [genResult, setGenResult] = useState<string[] | null>(null)
  const [genLoading, setGenLoading] = useState(false)

  // 유저 상세 모달
  const [detailEmail, setDetailEmail] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // audit logs state
  const [auditLogs, setAuditLogs] = useState<any[] | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditEmailFilter, setAuditEmailFilter] = useState('')

  // support state
  const [supportMessages, setSupportMessages] = useState<any[] | null>(null)
  const [supportLoading, setSupportLoading] = useState(false)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [supportSubTab, setSupportSubTab] = useState<'messages' | 'announcements'>('messages')

  // announcements state
  const [announcements, setAnnouncements] = useState<any[] | null>(null)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target_user_type: 'HEADHUNTER',
    priority: 'normal',
    expires_at: ''
  })
  const [announcementModalTab, setAnnouncementModalTab] = useState<'edit' | 'preview'>('edit')

  // 결제 게이트웨이 설정 state
  const [paymentMode, setPaymentMode] = useState<'TEST' | 'REAL'>('TEST')
  const [paymentGatewayLoading, setPaymentGatewayLoading] = useState(false)

  // 텔레그램 설정 state
  const [telegramStatus, setTelegramStatus] = useState<any>(null)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramResult, setTelegramResult] = useState<any>(null)
  const [telegramError, setTelegramError] = useState('')

  // Phase 1: 유저 목록 로드
  async function loadUsers() {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        plan: planFilter,
        sortBy,
        sortOrder,
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setUsersLoading(false)
    }
  }

  // Phase 1: 통계 로드
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (err) {
      console.error('Load stats error:', err)
    }
  }

  // Phase 1: 초기 로드 및 필터 변경 시 재로드
  useEffect(() => {
    loadUsers()
  }, [page, search, planFilter, sortBy, sortOrder])

  useEffect(() => {
    loadStats()
    loadPaymentGatewayMode()
    if (tab === 'telegram') {
      loadTelegramStatus()
    }
  }, [tab])

  async function openUserDetail(email: string) {
    setDetailEmail(email)
    setDetailData(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/user-detail?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setDetailData(data)
    } finally {
      setDetailLoading(false)
    }
  }

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(null), 3000)
  }

  async function changePlan(email: string, plan: 'FREE' | 'PRO' | 'EXPERT') {
    setLoading(email + plan)
    const res = await fetch('/api/admin/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, plan, analyze_count: 0, jd_count: 0, rewrite_count: 0, interview_count: 0 }
        : u
      ))
      showMsg(`${email} → ${plan} 변경 완료 (사용량 초기화됨)`)
    }
    setLoading(null)
  }

  async function cancelDowngrade(email: string) {
    if (!confirm('플랜 변경 예약을 취소하시겠습니까?')) {
      return
    }

    setLoading(email + 'cancel')
    try {
      const res = await fetch('/api/admin/cancel-downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.email === email
          ? { ...u, downgrade_to: null, downgrade_requested_at: null }
          : u
        ))
        showMsg(`${email} 플랜 변경 예약 취소됨`)
      } else {
        const data = await res.json()
        alert(data.error ?? '취소 실패')
      }
    } finally {
      setLoading(null)
    }
  }

  async function deleteUser(email: string, name: string | null) {
    // 확인 다이얼로그
    const userName = name || email
    const confirmMsg = `정말로 "${userName}"를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!\n\n삭제될 데이터:\n- 유저 정보\n- 이력서 분석 결과\n- JD 분석 결과\n- 면접 가이드\n- 쿠폰\n\n삭제하려면 "삭제"를 입력하세요.`

    const userInput = prompt(confirmMsg)

    if (userInput !== '삭제') {
      if (userInput !== null) {
        alert('삭제가 취소되었습니다.')
      }
      return
    }

    setLoading(email + 'delete')

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        // 목록에서 제거
        setUsers((prev) => prev.filter((u) => u.email !== email))
        showMsg(`${email} 삭제 완료 (모든 관련 데이터 삭제됨)`)
      } else {
        alert(`삭제 실패: ${data.error}`)
      }
    } catch (error) {
      console.error('Delete user error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }

  async function resetCount(email: string) {
    setLoading(email + 'reset')
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, analyze_count: 0, jd_count: 0, rewrite_count: 0, interview_count: 0 }
        : u
      ))
      showMsg(`${email} 사용량 초기화 완료`)
    }
    setLoading(null)
  }

  async function changeUserType(email: string, userType: 'SUPER_ADMIN' | 'MANAGER' | 'HEADHUNTER' | 'JOBSEEKER') {
    setLoading(email + userType)
    const res = await fetch('/api/admin/user-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userType }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, user_type: userType }
        : u
      ))
      showMsg(`${email} → ${userType === 'JOBSEEKER' ? '개인' : '헤드헌터'} 변경 완료`)
    } else {
      const data = await res.json()
      alert(data.error || '변경 실패')
    }
    setLoading(null)
  }

  async function toggleHeadhunterSharing(email: string, currentValue: boolean) {
    const newValue = !currentValue

    if (!newValue && !confirm(`${email}의 헤드헌터 공유를 중단하시겠습니까?\n\nEve에 공유된 정보가 삭제됩니다.`)) {
      return
    }

    setLoading(email + 'headhunter')
    const res = await fetch('/api/admin/headhunter-sharing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, enabled: newValue }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.email === email
        ? { ...u, headhunter_sharing_enabled: newValue, headhunter_sharing_consented_at: newValue ? new Date().toISOString() : null }
        : u
      ))
      showMsg(`${email} 헤드헌터 공유 ${newValue ? '활성화' : '비활성화'} 완료`)
    } else {
      const data = await res.json()
      alert(data.error || '변경 실패')
    }
    setLoading(null)
  }

  async function loadAuditLogs() {
    setAuditLoading(true)
    try {
      const url = auditEmailFilter
        ? `/api/admin/audit-logs?email=${encodeURIComponent(auditEmailFilter)}`
        : '/api/admin/audit-logs'
      const res = await fetch(url)
      const data = await res.json()
      setAuditLogs(data.logs || [])
    } catch (e) {
      console.error('Load audit logs error:', e)
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }

  async function loadCoupons() {
    if (coupons !== null) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      setCoupons(data.coupons ?? [])
    } finally {
      setCouponLoading(false)
    }
  }

  async function generateCoupons(e: React.FormEvent) {
    e.preventDefault()
    setGenLoading(true)
    setGenResult(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: genFeature,
          quantity: genQty,
          price: genPrice,
          issued_to: genIssuedTo || null,
          expires_days: genExpires || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setGenResult(data.codes)
        setCoupons(null)
        await loadCoupons()
        showMsg(`쿠폰 ${data.codes.length}개 생성 완료`)
      } else {
        showMsg(data.error ?? '오류 발생')
      }
    } finally {
      setGenLoading(false)
    }
  }

  async function loadSupportMessages() {
    setSupportLoading(true)
    try {
      const res = await fetch('/api/admin/support')
      const data = await res.json()
      if (res.ok) {
        setSupportMessages(data.messages || [])
      }
    } finally {
      setSupportLoading(false)
    }
  }

  // 공지사항 로드
  async function loadAnnouncements() {
    setAnnouncementsLoading(true)
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      if (res.ok) {
        setAnnouncements(data.announcements || [])
      }
    } finally {
      setAnnouncementsLoading(false)
    }
  }

  // 결제 게이트웨이 모드 불러오기
  async function loadPaymentGatewayMode() {
    if (!isSuperAdmin) return

    try {
      const res = await fetch('/api/admin/payment-gateway')
      const data = await res.json()
      if (res.ok) {
        setPaymentMode(data.mode)
      }
    } catch (err) {
      console.error('Failed to load payment gateway mode:', err)
    }
  }

  // 결제 게이트웨이 모드 변경
  async function changePaymentGatewayMode(newMode: 'TEST' | 'REAL') {
    if (!isSuperAdmin) return

    const confirmMsg = newMode === 'REAL'
      ? '⚠️ 실결제 모드(PortOne)로 전환하시겠습니까?\n실제 결제가 진행됩니다!'
      : '테스트 모드(토스페이먼츠)로 전환하시겠습니까?'

    if (!confirm(confirmMsg)) return

    setPaymentGatewayLoading(true)
    try {
      const res = await fetch('/api/admin/payment-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      })
      const data = await res.json()

      if (res.ok) {
        setPaymentMode(newMode)
        setMsg(data.message || '결제 게이트웨이 모드가 변경되었습니다.')
        setTimeout(() => setMsg(null), 3000)
      } else {
        alert(data.error || '모드 변경 실패')
      }
    } catch (err) {
      console.error('Failed to change payment gateway mode:', err)
      alert('모드 변경 중 오류가 발생했습니다.')
    } finally {
      setPaymentGatewayLoading(false)
    }
  }

  // 텔레그램 상태 로드
  async function loadTelegramStatus() {
    if (!isSuperAdmin) return

    setTelegramLoading(true)
    try {
      const res = await fetch('/api/admin/telegram/setup')
      const data = await res.json()

      if (res.ok) {
        setTelegramStatus(data)
        setTelegramError('')
      } else {
        setTelegramStatus({ configured: false, message: data.error })
      }
    } catch (err) {
      console.error('Failed to load telegram status:', err)
      setTelegramStatus({ configured: false, message: '상태 확인 실패' })
    } finally {
      setTelegramLoading(false)
    }
  }

  // 텔레그램 Webhook 설정
  async function setupTelegramWebhook() {
    if (!isSuperAdmin) return

    setTelegramLoading(true)
    setTelegramError('')
    setTelegramResult(null)

    try {
      const res = await fetch('/api/admin/telegram/setup', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        let errorMsg = data.error || '설정에 실패했습니다.'
        if (data.details) {
          errorMsg += `\n\n상세: ${data.details}`
        }
        setTelegramError(errorMsg)
        return
      }

      setTelegramResult(data)
      setTelegramError('')

      // 성공 후 상태 자동 갱신
      setTimeout(() => loadTelegramStatus(), 1000)
    } catch (err: any) {
      setTelegramError(`오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setTelegramLoading(false)
    }
  }

  // 공지사항 생성/수정
  async function handleSaveAnnouncement() {
    try {
      const method = editingAnnouncement ? 'PATCH' : 'POST'
      const body = editingAnnouncement
        ? { id: editingAnnouncement.id, ...announcementForm }
        : announcementForm

      const res = await fetch('/api/admin/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowAnnouncementModal(false)
        setEditingAnnouncement(null)
        setAnnouncementForm({
          title: '',
          content: '',
          target_user_type: 'HEADHUNTER',
          priority: 'normal',
          expires_at: ''
        })
        loadAnnouncements()
        setMsg(editingAnnouncement ? '공지사항이 수정되었습니다' : '공지사항이 생성되었습니다')
        setTimeout(() => setMsg(null), 3000)
      } else {
        const data = await res.json()
        alert(data.error || '저장 실패')
      }
    } catch (error) {
      console.error('Save announcement error:', error)
      alert('저장 중 오류가 발생했습니다')
    }
  }

  // 공지사항 삭제
  async function handleDeleteAnnouncement(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadAnnouncements()
        setMsg('공지사항이 삭제되었습니다')
        setTimeout(() => setMsg(null), 3000)
      } else {
        const data = await res.json()
        alert(data.error || '삭제 실패')
      }
    } catch (error) {
      console.error('Delete announcement error:', error)
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  // 공지사항 활성화/비활성화 토글
  async function handleToggleActive(id: string, is_active: boolean) {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !is_active })
      })

      if (res.ok) {
        loadAnnouncements()
      }
    } catch (error) {
      console.error('Toggle active error:', error)
    }
  }

  async function handleSupportReply(messageId: string) {
    if (!replyText.trim()) return

    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reply: replyText, status: 'resolved' }),
      })

      if (res.ok) {
        showMsg('답변이 등록되었습니다')
        setReplyingId(null)
        setReplyText('')
        await loadSupportMessages()
      } else {
        const data = await res.json()
        alert(data.error ?? '답변 등록 실패')
      }
    } catch (err) {
      console.error(err)
      alert('오류 발생')
    }
  }

  function onTabChange(t: AdminTab) {
    setTab(t)
    if (t === 'coupons') loadCoupons()
    if (t === 'audit-logs') loadAuditLogs()
    if (t === 'support') {
      loadSupportMessages()
      loadAnnouncements()
    }
  }

  function couponStatus(c: Coupon) {
    if (c.used_at) return { label: '사용 완료', cls: 'used' }
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: '만료', cls: 'expired' }
    if (c.claimed_by) return { label: '등록됨', cls: 'claimed' }
    return { label: '미사용', cls: 'unused' }
  }

  function nextResetDate(u: User) {
    if (!u.monthly_reset_at) return '—'
    const d = new Date(u.monthly_reset_at)
    d.setMonth(d.getMonth() + 1)
    return d.toLocaleDateString('ko-KR')
  }

  function usageCell(count: number, plan: string, feature: 'analyze' | 'jd' | 'rewrite' | 'interview') {
    const limit = PLAN_LIMITS[plan]?.[feature] ?? 0
    if (limit === 0) return <span className="admin-count muted">—</span>
    const remaining = Math.max(0, limit - count)
    const pct = Math.min(100, Math.round((count / limit) * 100))
    const cls = pct >= 100 ? 'full' : pct >= 70 ? 'warn' : ''
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span className={`admin-count ${cls}`}>
          {count}<span className="admin-count-limit">/{limit}</span>
        </span>
        <span style={{ fontSize: '11px', color: remaining === 0 ? '#ff4444' : '#999' }}>
          {remaining}회 남음
        </span>
      </div>
    )
  }

  const filteredUsers = showOnlyHeadhunterSharing
    ? users.filter((u) => u.headhunter_sharing_enabled === true && u.user_type !== 'SUPER_ADMIN')
    : users.filter((u) => u.user_type !== 'SUPER_ADMIN')

  // 통계는 stats API에서 가져온 데이터 사용
  const totalAnalyze = users.reduce((s, u) => s + (u.analyze_count ?? 0), 0)
  const totalJd = users.reduce((s, u) => s + (u.jd_count ?? 0), 0)
  const totalRewrite = users.reduce((s, u) => s + (u.rewrite_count ?? 0), 0)
  const totalInterview = users.reduce((s, u) => s + (u.interview_count ?? 0), 0)

  return (
    <>
      {/* 공지사항 모달 */}
      <AnnouncementModal />

      <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="section-label">MANAGER</div>
          <h1 className="admin-title">Super Admin</h1>
        </div>

        {msg && <div className="admin-toast">{msg}</div>}

        {/* 탭 - 데스크톱 */}
        <div className="admin-tab-bar desktop-only">
          <button className={`admin-tab-btn${tab === 'users' ? ' active' : ''}`} onClick={() => onTabChange('users')}>유저 관리</button>
          <button className={`admin-tab-btn${tab === 'plan-changes' ? ' active' : ''}`} onClick={() => onTabChange('plan-changes')}>
            📅 플랜 변경 예정 {users.filter(u => u.downgrade_to || u.status === 'withdrawing').length > 0 && `(${users.filter(u => u.downgrade_to || u.status === 'withdrawing').length})`}
          </button>
          <button className={`admin-tab-btn${tab === 'support' ? ' active' : ''}`} onClick={() => onTabChange('support')}>💬 고객센터</button>
          <button className={`admin-tab-btn${tab === 'coupons' ? ' active' : ''}`} onClick={() => onTabChange('coupons')}>쿠폰 관리</button>
          {isSuperAdmin && (
            <>
              <button className={`admin-tab-btn${tab === 'payment-gateway' ? ' active' : ''}`} onClick={() => onTabChange('payment-gateway')}>💳 결제 설정</button>
              <button className={`admin-tab-btn${tab === 'telegram' ? ' active' : ''}`} onClick={() => onTabChange('telegram')}>🤖 텔레그램</button>
              <button className={`admin-tab-btn${tab === 'tokens' ? ' active' : ''}`} onClick={() => onTabChange('tokens')}>🔍 토큰 관리</button>
              <button className={`admin-tab-btn${tab === 'audit-logs' ? ' active' : ''}`} onClick={() => onTabChange('audit-logs')}>📋 접근 로그</button>
            </>
          )}
        </div>

        {/* 탭 - 모바일 */}
        <div className="mobile-only" style={{ marginBottom: 24 }}>
          <select
            value={tab}
            onChange={(e) => onTabChange(e.target.value as AdminTab)}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 600,
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="users">📊 유저 관리</option>
            <option value="plan-changes">
              📅 플랜 변경 예정{users.filter(u => u.downgrade_to || u.status === 'withdrawing').length > 0 ? ` (${users.filter(u => u.downgrade_to || u.status === 'withdrawing').length})` : ''}
            </option>
            <option value="support">💬 고객센터</option>
            <option value="coupons">🎫 쿠폰 관리</option>
            {isSuperAdmin && (
              <>
                <option value="tokens">🔍 토큰 관리</option>
                <option value="audit-logs">📋 접근 로그</option>
              </>
            )}
          </select>
        </div>

        {tab === 'users' && (
          <>
            {/* Phase 1: 검색 & 필터 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 이메일 또는 이름 검색"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  style={{
                    flex: 1,
                    minWidth: 250,
                    padding: '10px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {['ALL', 'FREE', 'PRO', 'EXPERT'].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPlanFilter(p)
                        setPage(1)
                      }}
                      style={{
                        padding: '10px 20px',
                        border: planFilter === p ? '2px solid #18181b' : '2px solid #e5e7eb',
                        borderRadius: 8,
                        background: planFilter === p ? '#18181b' : '#ffffff',
                        color: planFilter === p ? '#ffffff' : '#18181b',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {p === 'ALL' ? '전체' : p}
                    </button>
                  ))}
                </div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-')
                    setSortBy(by)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  style={{
                    padding: '10px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="created_at-desc">최신 가입순</option>
                  <option value="created_at-asc">오래된 가입순</option>
                  <option value="email-asc">이메일 A-Z</option>
                  <option value="email-desc">이메일 Z-A</option>
                </select>
              </div>
              {search && (
                <div style={{ fontSize: 14, color: '#71717a' }}>
                  "{search}" 검색 결과: {total}명
                </div>
              )}
            </div>

            {/* 비즈니스 KPI */}
            {isSuperAdmin && stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                {/* MRR */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  borderRadius: 16,
                  padding: 24,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>💰 MRR (월 반복 매출)</div>
                  <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
                    {(stats.expert * 27930 + stats.pro * 10430).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    EXPERT {stats.expert}명 × 27,930원 = {(stats.expert * 27930).toLocaleString()}원<br />
                    PRO {stats.pro}명 × 10,430원 = {(stats.pro * 10430).toLocaleString()}원
                  </div>
                </div>

                {/* 전환율 */}
                <div style={{
                  background: stats.total > 0 && ((stats.pro + stats.expert) / stats.total) >= 0.5
                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                    : stats.total > 0 && ((stats.pro + stats.expert) / stats.total) >= 0.3
                    ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                  borderRadius: 16,
                  padding: 24,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>📊 유료 전환율</div>
                  <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
                    {stats.total > 0 ? Math.round(((stats.pro + stats.expert) / stats.total) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    유료 {stats.pro + stats.expert}명 / 전체 {stats.total}명<br />
                    목표: 50% {stats.total > 0 && ((stats.pro + stats.expert) / stats.total) >= 0.5 ? '✅' : '🎯'}
                  </div>
                </div>

                {/* 사용자 현황 */}
                <div style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                  borderRadius: 16,
                  padding: 24,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>👥 사용자 현황</div>
                  <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
                    {stats.total}명
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Super Admin {stats.superAdmin}명 / Manager {stats.manager}명<br />
                    개인 {stats.jobseeker}명 ({stats.total > 0 ? Math.round((stats.jobseeker / stats.total) * 100) : 0}%)<br />
                    헤드헌터 {stats.headhunter}명 ({stats.total > 0 ? Math.round((stats.headhunter / stats.total) * 100) : 0}%)
                  </div>
                </div>

                {/* 이탈 위험 */}
                <div style={{
                  background: stats.headhunterSharing === 0
                    ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                    : 'linear-gradient(135deg, #71717a 0%, #a1a1aa 100%)',
                  borderRadius: 16,
                  padding: 24,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>🎯 주요 지표</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                    헤드헌터 공유: {stats.headhunterSharing}명
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {stats.headhunterSharing === 0 ? '⚠️ 헤드헌터 공유 활성화 필요' : '✅ 정상 운영 중'}<br />
                    FREE 플랜: {stats.free}명 ({stats.total > 0 ? Math.round((stats.free / stats.total) * 100) : 0}%)
                  </div>
                </div>
              </div>
            )}

            {/* 유저 목록 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={showOnlyHeadhunterSharing}
                  onChange={(e) => setShowOnlyHeadhunterSharing(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                🤝 헤드헌터 공유 동의한 후보자만 보기 ({filteredUsers.length}명)
              </label>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>유저</th>
                    <th>플랜</th>
                    <th>유형</th>
                    <th>사용량 (분석/JD/생성/면접)</th>
                    <th>다음 초기화</th>
                    <th>가입일</th>
                    <th>헤드헌터 공유</th>
                    <th>초기화</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.email}>
                      <td>
                        <div className="admin-user-cell">
                          {u.image && <img src={u.image} alt="" className="admin-avatar" />}
                          <div>
                            <div className="admin-user-name">{u.name ?? '—'}</div>
                            <div className="admin-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.user_type === 'SUPER_ADMIN' ? (
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>-</span>
                        ) : isSuperAdmin ? (
                          <select
                            value={u.plan}
                            onChange={(e) => changePlan(u.email, e.target.value as 'FREE' | 'PRO' | 'EXPERT')}
                            disabled={loading === u.email + u.plan}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #e5e7eb',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: u.plan === 'EXPERT' ? '#1e40af' : u.plan === 'PRO' ? '#7c3aed' : '#71717a',
                              color: '#ffffff',
                            }}
                          >
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
                            <option value="EXPERT">EXPERT</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            background: u.plan === 'EXPERT' ? '#1e40af' : u.plan === 'PRO' ? '#7c3aed' : '#71717a',
                            color: '#ffffff',
                            display: 'inline-block',
                          }}>
                            {u.plan}
                          </span>
                        )}
                      </td>
                      <td>
                        {isSuperAdmin ? (
                          <select
                            value={u.user_type ?? ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                changeUserType(u.email, e.target.value as any)
                              }
                            }}
                            disabled={loading === u.email + u.user_type}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #e5e7eb',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              background:
                                u.user_type === 'SUPER_ADMIN' ? '#dc2626' :
                                u.user_type === 'MANAGER' ? '#ea580c' :
                                u.user_type === 'HEADHUNTER' ? '#1e40af' :
                                u.user_type === 'JOBSEEKER' ? '#7c3aed' : '#d4d4d8',
                              color: u.user_type ? '#ffffff' : '#71717a',
                            }}
                          >
                            <option value="">미선택</option>
                            <option value="JOBSEEKER">🎯 개인</option>
                            <option value="HEADHUNTER">💼 헤드헌터</option>
                            <option value="MANAGER">👔 Manager</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            background:
                              u.user_type === 'SUPER_ADMIN' ? '#dc2626' :
                              u.user_type === 'MANAGER' ? '#ea580c' :
                              u.user_type === 'HEADHUNTER' ? '#1e40af' :
                              u.user_type === 'JOBSEEKER' ? '#7c3aed' : '#d4d4d8',
                            color: u.user_type ? '#ffffff' : '#71717a',
                            display: 'inline-block',
                          }}>
                            {u.user_type === 'SUPER_ADMIN' ? '🔑 Super Admin' :
                             u.user_type === 'MANAGER' ? '👔 Manager' :
                             u.user_type === 'HEADHUNTER' ? '💼 헤드헌터' :
                             u.user_type === 'JOBSEEKER' ? '🎯 개인' : '미선택'}
                          </span>
                        )}
                      </td>
                      <td>
                        {u.user_type === 'SUPER_ADMIN' ? (
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>-</span>
                        ) : (() => {
                          const limits = PLAN_LIMITS[u.plan]
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: 2,
                              fontSize: 12
                            }}>
                              <div>📝 {u.analyze_count ?? 0}/{limits.analyze}</div>
                              <div>📋 {u.jd_count ?? 0}/{limits.jd}</div>
                              <div>✏️ {u.rewrite_count ?? 0}/{limits.rewrite}</div>
                              <div>🎤 {u.interview_count ?? 0}/{limits.interview}</div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="admin-date">
                        {u.user_type === 'SUPER_ADMIN' ? '-' : nextResetDate(u)}
                      </td>
                      <td className="admin-date">
                        {u.user_type === 'SUPER_ADMIN' ? '-' : new Date(u.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td>
                        {u.user_type === 'SUPER_ADMIN' ? (
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>-</span>
                        ) : u.user_type === 'JOBSEEKER' ? (
                          <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: 54,
                            height: 28,
                            cursor: loading === u.email + 'headhunter' ? 'not-allowed' : 'pointer'
                          }}>
                            <input
                              type="checkbox"
                              checked={u.headhunter_sharing_enabled ?? false}
                              onChange={() => toggleHeadhunterSharing(u.email, u.headhunter_sharing_enabled ?? false)}
                              disabled={loading === u.email + 'headhunter'}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: loading === u.email + 'headhunter' ? 'not-allowed' : 'pointer',
                              inset: 0,
                              background: u.headhunter_sharing_enabled ? '#18181b' : '#d4d4d8',
                              transition: 'background 0.3s',
                              borderRadius: 28
                            }}>
                              <span style={{
                                position: 'absolute',
                                height: 22,
                                width: 22,
                                left: u.headhunter_sharing_enabled ? 29 : 3,
                                bottom: 3,
                                background: '#ffffff',
                                transition: 'left 0.3s',
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }} />
                            </span>
                          </label>
                        ) : (
                          <span style={{ fontSize: 13, color: '#999' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="admin-btn reset"
                          disabled={
                            (u.analyze_count === 0 && u.jd_count === 0 && u.rewrite_count === 0 && u.interview_count === 0)
                            || loading === u.email + 'reset'
                          }
                          onClick={() => resetCount(u.email)}
                        >초기화</button>
                      </td>
                      <td>
                        {isSuperAdmin ? (
                          <button
                            className="admin-btn"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: '#fff',
                              fontWeight: '600',
                            }}
                            disabled={loading === u.email + 'delete'}
                            onClick={() => deleteUser(u.email, u.name)}
                          >
                            {loading === u.email + 'delete' ? '삭제 중...' : '🗑️ 삭제'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !usersLoading && (
                    <tr><td colSpan={9} className="admin-empty">{showOnlyHeadhunterSharing ? '헤드헌터 공유 동의한 유저가 없습니다.' : search ? '검색 결과가 없습니다.' : '가입한 유저가 없습니다.'}</td></tr>
                  )}
                  {usersLoading && (
                    <tr><td colSpan={9} className="admin-empty">로딩 중...</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phase 1: 페이지네이션 */}
            {!usersLoading && totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 24,
                padding: '20px 0',
              }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    background: page === 1 ? '#f9fafb' : '#ffffff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  ← 이전
                </button>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page + i - 2
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={{
                          width: 36,
                          height: 36,
                          border: '2px solid #e5e7eb',
                          borderRadius: 8,
                          background: page === pageNum ? '#18181b' : '#ffffff',
                          color: page === pageNum ? '#ffffff' : '#18181b',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <>
                      <span style={{ padding: '8px', color: '#71717a' }}>...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        style={{
                          width: 36,
                          height: 36,
                          border: '2px solid #e5e7eb',
                          borderRadius: 8,
                          background: '#ffffff',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    background: page === totalPages ? '#f9fafb' : '#ffffff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  다음 →
                </button>
                <div style={{ fontSize: 13, color: '#71717a', marginLeft: 12 }}>
                  전체 {total}명 중 {((page - 1) * 20) + 1}-{Math.min(page * 20, total)}명 표시
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'plan-changes' && (
          <>
            <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-label">플랜 변경 예정</div>
                <div className="admin-stat-value">{users.filter(u => u.downgrade_to || u.status === 'withdrawing').length}명</div>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>현재 플랜</th>
                    <th>→</th>
                    <th>변경될 플랜</th>
                    <th>플랜 종료일</th>
                    <th>예약 일시</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.downgrade_to || u.status === 'withdrawing').map((user) => {
                    const isWithdrawing = user.status === 'withdrawing'
                    return (
                      <tr key={user.email}>
                        <td style={{ fontSize: 12 }}>{user.email}</td>
                        <td>{user.name || '-'}</td>
                        <td>
                          <span className={`admin-badge admin-badge-${user.plan.toLowerCase()}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#f59e0b' }}>→</td>
                        <td>
                          {isWithdrawing ? (
                            <span className="admin-badge" style={{ background: '#ef4444', color: '#fff' }}>
                              탈퇴 예정
                            </span>
                          ) : (
                            <span className={`admin-badge admin-badge-${user.downgrade_to?.toLowerCase()}`}>
                              {user.downgrade_to}
                            </span>
                          )}
                        </td>
                        <td>{user.plan_end_date ? new Date(user.plan_end_date).toLocaleDateString('ko-KR') : '-'}</td>
                        <td style={{ fontSize: 12 }}>
                          {isWithdrawing
                            ? (user.withdraw_requested_at ? new Date(user.withdraw_requested_at).toLocaleString('ko-KR') : '-')
                            : (user.downgrade_requested_at ? new Date(user.downgrade_requested_at).toLocaleString('ko-KR') : '-')
                          }
                        </td>
                        <td>
                          <button
                            className="admin-btn admin-btn-sm"
                            style={{ background: '#f59e0b' }}
                            onClick={() => cancelDowngrade(user.email)}
                            disabled={loading === user.email + 'cancel'}
                          >
                            {loading === user.email + 'cancel' ? '...' : '예약 취소'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {users.filter(u => u.downgrade_to || u.status === 'withdrawing').length === 0 && (
                    <tr><td colSpan={8} className="admin-empty">플랜 변경 예정인 유저가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'support' && (
          <>
            {/* 서브 탭 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => setSupportSubTab('messages')}
                style={{
                  padding: '12px 24px',
                  background: supportSubTab === 'messages' ? 'linear-gradient(135deg, #22d3ee, #a78bfa)' : '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                💬 문의 관리
              </button>
              <button
                onClick={() => setSupportSubTab('announcements')}
                style={{
                  padding: '12px 24px',
                  background: supportSubTab === 'announcements' ? 'linear-gradient(135deg, #22d3ee, #a78bfa)' : '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                📢 공지사항 관리
              </button>
            </div>

            {supportSubTab === 'messages' && (
              <>
                <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-label">전체 문의</div>
                <div className="admin-stat-value">{supportMessages?.length || 0}건</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">답변 대기</div>
                <div className="admin-stat-value" style={{ color: '#f59e0b' }}>
                  {supportMessages?.filter(m => m.status === 'new').length || 0}건
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">답변 완료</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>
                  {supportMessages?.filter(m => m.status === 'resolved').length || 0}건
                </div>
              </div>
            </div>

            <div className="admin-table-wrap">
              {supportLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#71717a' }}>
                  불러오는 중...
                </div>
              ) : !supportMessages || supportMessages.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#71717a' }}>
                  문의 내역이 없습니다
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>제목</th>
                      <th>문의자</th>
                      <th>문의일</th>
                      <th>답변</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportMessages.map((msg) => (
                      <tr key={msg.id}>
                        <td>
                          <span
                            className="admin-badge"
                            style={{
                              background: msg.status === 'new' ? '#fef3c7' : msg.status === 'resolved' ? '#d1fae5' : '#dbeafe',
                              color: msg.status === 'new' ? '#f59e0b' : msg.status === 'resolved' ? '#10b981' : '#3b82f6',
                            }}
                          >
                            {msg.status === 'new' ? '답변 대기' : msg.status === 'resolved' ? '답변 완료' : '처리중'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            {msg.subject}
                          </div>
                          <div style={{ fontSize: 12, color: '#71717a', whiteSpace: 'pre-wrap', maxWidth: 400 }}>
                            {msg.message.length > 100 ? msg.message.substring(0, 100) + '...' : msg.message}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>{msg.user_email}</div>
                          {msg.user_name && <div style={{ fontSize: 11, color: '#71717a' }}>{msg.user_name}</div>}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td>
                          {msg.admin_reply ? (
                            <div>
                              <div style={{ fontSize: 12, color: '#10b981', marginBottom: 4 }}>✓ 답변 완료</div>
                              <div style={{ fontSize: 11, color: '#71717a' }}>
                                {new Date(msg.replied_at).toLocaleDateString('ko-KR')}
                              </div>
                              <details style={{ marginTop: 8 }}>
                                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#3b82f6' }}>
                                  답변 보기
                                </summary>
                                <div style={{ marginTop: 8, fontSize: 12, padding: '8px', background: '#f9fafb', borderRadius: 4, whiteSpace: 'pre-wrap', color: '#18181b' }}>
                                  {msg.admin_reply}
                                </div>
                              </details>
                            </div>
                          ) : (
                            replyingId === msg.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="답변을 입력하세요"
                                  rows={4}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontFamily: 'inherit',
                                  }}
                                />
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    className="admin-btn admin-btn-sm"
                                    onClick={() => handleSupportReply(msg.id)}
                                    disabled={!replyText.trim()}
                                  >
                                    등록
                                  </button>
                                  <button
                                    className="admin-btn admin-btn-sm"
                                    style={{ background: '#6b7280' }}
                                    onClick={() => {
                                      setReplyingId(null)
                                      setReplyText('')
                                    }}
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="admin-btn admin-btn-sm"
                                onClick={() => {
                                  setReplyingId(msg.id)
                                  setReplyText('')
                                }}
                              >
                                답변하기
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
              </>
            )}

            {/* 공지사항 관리 */}
            {supportSubTab === 'announcements' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div className="admin-stats" style={{ flex: 1, marginBottom: 0 }}>
                    <div className="admin-stat-card">
                      <div className="admin-stat-label">전체 공지</div>
                      <div className="admin-stat-value">{announcements?.length || 0}개</div>
                    </div>
                    <div className="admin-stat-card">
                      <div className="admin-stat-label">활성 공지</div>
                      <div className="admin-stat-value" style={{ color: '#10b981' }}>
                        {announcements?.filter(a => a.is_active).length || 0}개
                      </div>
                    </div>
                    <div className="admin-stat-card">
                      <div className="admin-stat-label">긴급 공지</div>
                      <div className="admin-stat-value" style={{ color: '#f59e0b' }}>
                        {announcements?.filter(a => a.priority === 'urgent' && a.is_active).length || 0}개
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAnnouncement(null)
                      setAnnouncementForm({
                        title: '',
                        content: '',
                        target_user_type: 'HEADHUNTER',
                        priority: 'normal',
                        expires_at: ''
                      })
                      setAnnouncementModalTab('edit')
                      setShowAnnouncementModal(true)
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + 공지사항 작성
                  </button>
                </div>

                <div className="admin-table-wrap">
                  {announcementsLoading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: '#71717a' }}>
                      불러오는 중...
                    </div>
                  ) : !announcements || announcements.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: '#71717a' }}>
                      공지사항이 없습니다
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>상태</th>
                          <th>우선순위</th>
                          <th>제목</th>
                          <th>대상</th>
                          <th>작성자</th>
                          <th>작성일</th>
                          <th>만료일</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.map((announcement) => (
                          <tr key={announcement.id}>
                            <td>
                              <button
                                onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                                className="admin-badge"
                                style={{
                                  background: announcement.is_active ? '#d1fae5' : '#fee2e2',
                                  color: announcement.is_active ? '#10b981' : '#ef4444',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {announcement.is_active ? '활성' : '비활성'}
                              </button>
                            </td>
                            <td>
                              <span
                                className="admin-badge"
                                style={{
                                  background: announcement.priority === 'urgent' ? '#fef3c7' : '#dbeafe',
                                  color: announcement.priority === 'urgent' ? '#f59e0b' : '#3b82f6'
                                }}
                              >
                                {announcement.priority === 'urgent' ? '🔥 긴급' : '일반'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {announcement.title}
                              </div>
                            </td>
                            <td>
                              <span className="admin-badge">
                                {announcement.target_user_type === 'HEADHUNTER' ? '헤드헌터' :
                                 announcement.target_user_type === 'JOBSEEKER' ? '구직자' : '전체'}
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>{announcement.created_by}</td>
                            <td style={{ fontSize: 12 }}>
                              {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                            </td>
                            <td style={{ fontSize: 12 }}>
                              {announcement.expires_at
                                ? new Date(announcement.expires_at).toLocaleDateString('ko-KR')
                                : '-'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => {
                                    setEditingAnnouncement(announcement)
                                    setAnnouncementForm({
                                      title: announcement.title,
                                      content: announcement.content,
                                      target_user_type: announcement.target_user_type,
                                      priority: announcement.priority,
                                      expires_at: announcement.expires_at || ''
                                    })
                                    setAnnouncementModalTab('edit')
                                    setShowAnnouncementModal(true)
                                  }}
                                  className="admin-btn-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                  className="admin-btn-sm"
                                  style={{ background: '#ef4444' }}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* 결제 게이트웨이 설정 */}
        {tab === 'payment-gateway' && isSuperAdmin && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>💳 결제 게이트웨이 설정</h2>
              <p style={{ color: '#666', marginBottom: 24 }}>
                테스트 모드와 실결제 모드를 전환할 수 있습니다.
              </p>

              <div style={{
                background: paymentMode === 'REAL' ? '#fef2f2' : '#f0f9ff',
                border: `2px solid ${paymentMode === 'REAL' ? '#fecaca' : '#bfdbfe'}`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 24
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                  {paymentMode === 'REAL' ? '🔴 실결제 모드 (PortOne)' : '🟢 테스트 모드 (토스페이먼츠)'}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  {paymentMode === 'REAL'
                    ? '실제 결제가 진행됩니다. 고객에게 요금이 청구됩니다.'
                    : '테스트 결제만 가능합니다. 실제 요금이 청구되지 않습니다.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => changePaymentGatewayMode('TEST')}
                  disabled={paymentMode === 'TEST' || paymentGatewayLoading}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    border: paymentMode === 'TEST' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    background: paymentMode === 'TEST' ? '#eff6ff' : '#fff',
                    color: paymentMode === 'TEST' ? '#3b82f6' : '#666',
                    cursor: paymentMode === 'TEST' || paymentGatewayLoading ? 'not-allowed' : 'pointer',
                    opacity: paymentMode === 'TEST' || paymentGatewayLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  🧪 테스트 모드
                  <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4 }}>토스페이먼츠</div>
                </button>

                <button
                  onClick={() => changePaymentGatewayMode('REAL')}
                  disabled={paymentMode === 'REAL' || paymentGatewayLoading}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    border: paymentMode === 'REAL' ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    background: paymentMode === 'REAL' ? '#fef2f2' : '#fff',
                    color: paymentMode === 'REAL' ? '#ef4444' : '#666',
                    cursor: paymentMode === 'REAL' || paymentGatewayLoading ? 'not-allowed' : 'pointer',
                    opacity: paymentMode === 'REAL' || paymentGatewayLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  💰 실결제 모드
                  <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4 }}>PortOne</div>
                </button>
              </div>

              {paymentGatewayLoading && (
                <div style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
                  모드 변경 중...
                </div>
              )}
            </div>

            {/* 안내 사항 */}
            <div style={{
              background: '#fffbeb',
              border: '2px solid #fef3c7',
              borderRadius: 12,
              padding: 20
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#92400e' }}>
                ⚠️ 주의사항
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#78350f', lineHeight: 1.8 }}>
                <li>실결제 모드로 전환 시 즉시 고객에게 실제 요금이 청구됩니다.</li>
                <li>테스트가 완료된 후에만 실결제 모드로 전환하세요.</li>
                <li>모드 변경은 즉시 반영되며, 모든 결제 페이지에 적용됩니다.</li>
                <li>변경 이력은 접근 로그에 기록됩니다.</li>
              </ul>
            </div>
          </div>
        )}

        {tab === 'telegram' && isSuperAdmin && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* 현재 상태 */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🤖 텔레그램 봇 관리</h2>
                  <p style={{ color: '#666', marginBottom: 0 }}>결제 완료 시 관리자에게 알림을 전송합니다</p>
                </div>
                <button
                  onClick={loadTelegramStatus}
                  disabled={telegramLoading}
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    cursor: telegramLoading ? 'not-allowed' : 'pointer',
                    opacity: telegramLoading ? 0.6 : 1
                  }}
                >
                  {telegramLoading ? '확인 중...' : '🔄 상태 새로고침'}
                </button>
              </div>

              {telegramLoading && !telegramStatus ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#666' }}>상태 확인 중...</div>
                </div>
              ) : telegramStatus ? (
                <div style={{
                  padding: 20,
                  borderRadius: 12,
                  backgroundColor: telegramStatus.configured ? '#f0fdf4' : '#fef9c3',
                  border: `2px solid ${telegramStatus.configured ? '#86efac' : '#fde047'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{telegramStatus.configured ? '✅' : '⚙️'}</span>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                      {telegramStatus.configured ? '✨ 설정 완료 - 사용 준비됨!' : '설정이 필요합니다'}
                    </h3>
                  </div>
                  {telegramStatus.botInfo && (
                    <div style={{ fontSize: 14, marginTop: 16 }}>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div>
                          <span style={{ color: '#666' }}>봇 이름:</span>{' '}
                          <strong>{telegramStatus.botInfo.first_name}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Username:</span>{' '}
                          <strong>@{telegramStatus.botInfo.username}</strong>
                        </div>
                        {telegramStatus.webhookUrl && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Webhook URL</div>
                            <code style={{
                              fontSize: 11,
                              padding: '8px 12px',
                              background: '#f3f4f6',
                              borderRadius: 6,
                              display: 'block',
                              wordBreak: 'break-all',
                            }}>
                              {telegramStatus.webhookUrl}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!telegramStatus.configured && telegramStatus.message && (
                    <p style={{ margin: '12px 0 0 0', fontSize: 14, color: '#666' }}>
                      {telegramStatus.message}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Webhook 설정 */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                {telegramStatus?.configured ? '🔄 Webhook 재설정' : '⚙️ Webhook 설정'}
              </h3>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                {telegramStatus?.configured
                  ? '설정을 변경하거나 문제가 있을 때 다시 설정할 수 있습니다.'
                  : '텔레그램 봇과 서버를 연결합니다. 버튼을 클릭하면 자동으로 설정됩니다.'}
              </p>

              <button
                onClick={setupTelegramWebhook}
                disabled={telegramLoading}
                style={{
                  padding: '14px 28px',
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: 'none',
                  background: telegramStatus?.configured
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  cursor: telegramLoading ? 'not-allowed' : 'pointer',
                  opacity: telegramLoading ? 0.6 : 1,
                }}
              >
                {telegramLoading ? '설정 중...' : telegramStatus?.configured ? '🔄 다시 설정하기' : '🚀 지금 설정하기'}
              </button>

              {!telegramStatus?.configured && (
                <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                  💡 환경 변수(TELEGRAM_BOT_TOKEN 등)가 설정되어 있어야 합니다
                </p>
              )}
            </div>

            {/* 성공 결과 */}
            {telegramResult && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.1))',
                border: '2px solid rgba(34, 197, 94, 0.4)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>🎉</span>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#16a34a' }}>
                    설정이 완료되었습니다!
                  </h3>
                </div>

                <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: '#fff',
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 20 }}>{telegramResult.webhook ? '✅' : '❌'}</span>
                    <span style={{ fontWeight: 500 }}>Webhook:</span>
                    <span style={{ color: telegramResult.webhook ? '#16a34a' : '#dc2626' }}>
                      {telegramResult.webhook ? '설정 완료' : '설정 실패'}
                    </span>
                  </div>
                </div>

                {telegramResult.warning && (
                  <div style={{
                    padding: 12,
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde047',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                  }}>
                    ⚠️ {telegramResult.warning}
                  </div>
                )}
              </div>
            )}

            {/* 에러 */}
            {telegramError && (
              <div style={{
                background: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>⚠️</span>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#dc2626' }}>
                    오류가 발생했습니다
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {telegramError}
                </p>
              </div>
            )}

            {/* 환경 변수 체크리스트 */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📋 환경 변수 체크리스트</h3>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                Vercel에 다음 환경 변수가 설정되어 있어야 합니다:
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { key: 'TELEGRAM_BOT_TOKEN', desc: '봇 토큰 (@BotFather에서 발급)' },
                  { key: 'TELEGRAM_SECRET_TOKEN', desc: 'Webhook 보안 토큰 (자동 생성)' },
                  { key: 'TELEGRAM_ADMIN_CHAT_ID', desc: '관리자 텔레그램 채팅 ID' }
                ].map((env) => (
                  <div key={env.key} style={{
                    padding: 14,
                    background: '#f9fafb',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <code style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', flex: '0 0 auto' }}>
                      {env.key}
                    </code>
                    <span style={{ fontSize: 13, color: '#666' }}>{env.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 16,
                padding: 14,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
              }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                  💡 <strong>참고:</strong> 환경 변수 변경 후에는 반드시 Vercel을 재배포해야 적용됩니다.
                </p>
              </div>

              <div style={{
                marginTop: 16,
                padding: 14,
                backgroundColor: '#fef9c3',
                border: '1px solid #fde047',
                borderRadius: 8,
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>
                  📱 TELEGRAM_ADMIN_CHAT_ID 확인 방법:
                </p>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
                  <li>봇과 대화 시작 (/start 명령어)</li>
                  <li>Webhook 로그에서 chat_id 확인</li>
                  <li>또는 @userinfobot 사용</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {tab === 'coupons' && (
          <div className="coupon-admin-wrap">
            {/* 발급 폼 */}
            {isSuperAdmin && (
              <div className="coupon-gen-card">
                <div className="coupon-gen-title">쿠폰 발급</div>
                <form className="coupon-gen-form" onSubmit={generateCoupons}>
                <div className="coupon-gen-row">
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">기능</label>
                    <select className="coupon-gen-select" value={genFeature} onChange={e => setGenFeature(e.target.value)}>
                      {Object.entries(FEATURE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">수량 (최대 100)</label>
                    <input className="coupon-gen-input" type="number" min={1} max={100} value={genQty} onChange={e => setGenQty(e.target.value)} />
                  </div>
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">단가 (₩, 기록용)</label>
                    <input className="coupon-gen-input" type="number" min={0} value={genPrice} onChange={e => setGenPrice(e.target.value)} />
                  </div>
                </div>
                <div className="coupon-gen-row">
                  <div className="coupon-gen-field" style={{ flex: 2 }}>
                    <label className="coupon-gen-label">특정 이메일 지정 (선택)</label>
                    <input className="coupon-gen-input" type="email" placeholder="비워두면 누구나 등록 가능" value={genIssuedTo} onChange={e => setGenIssuedTo(e.target.value)} />
                  </div>
                  <div className="coupon-gen-field">
                    <label className="coupon-gen-label">유효기간 (일, 선택)</label>
                    <input className="coupon-gen-input" type="number" min={1} placeholder="무제한" value={genExpires} onChange={e => setGenExpires(e.target.value)} />
                  </div>
                </div>
                <button className="btn-primary coupon-gen-btn" type="submit" disabled={genLoading}>
                  {genLoading ? '생성 중...' : '쿠폰 생성'}
                </button>
              </form>

              {genResult && (
                <div className="coupon-result-wrap">
                  <div className="coupon-result-label">생성된 코드 ({genResult.length}개)</div>
                  <div className="coupon-codes-list">
                    {genResult.map(code => (
                      <div key={code} className="coupon-code-chip">{code}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 목록 */}
            <div className="admin-table-wrap">
              {couponLoading ? (
                <div className="admin-empty">불러오는 중...</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>코드</th>
                      <th>기능</th>
                      <th>단가</th>
                      <th>지정 이메일</th>
                      <th>등록자</th>
                      <th>등록일</th>
                      <th>사용일</th>
                      <th>유효기간</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(coupons ?? []).map((c) => {
                      const st = couponStatus(c)
                      return (
                        <tr key={c.id}>
                          <td><code className="coupon-code-text">{c.code}</code></td>
                          <td>{FEATURE_LABELS[c.feature] ?? c.feature}</td>
                          <td>{c.price > 0 ? `₩${c.price.toLocaleString()}` : '—'}</td>
                          <td className="admin-user-email">{c.issued_to ?? '—'}</td>
                          <td className="admin-user-email">
                            {c.claimed_by
                              ? <button className="admin-detail-link" onClick={() => openUserDetail(c.claimed_by!)}>{c.claimed_by}</button>
                              : '—'}
                          </td>
                          <td className="admin-date">{c.claimed_at ? new Date(c.claimed_at).toLocaleDateString('ko-KR') : '—'}</td>
                          <td className="admin-date">{c.used_at ? new Date(c.used_at).toLocaleDateString('ko-KR') : '—'}</td>
                          <td className="admin-date">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('ko-KR') : '무제한'}</td>
                          <td><span className={`coupon-status-badge ${st.cls}`}>{st.label}</span></td>
                        </tr>
                      )
                    })}
                    {(coupons ?? []).length === 0 && (
                      <tr><td colSpan={9} className="admin-empty">발급된 쿠폰이 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 유저 상세 모달 */}
      {detailEmail && (
        <div className="withdraw-overlay" onClick={() => setDetailEmail(null)}>
          <div className="admin-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-detail-header">
              <span className="admin-detail-email">{detailEmail}</span>
              <button className="withdraw-close" onClick={() => setDetailEmail(null)}>×</button>
            </div>

            {detailLoading ? (
              <div className="admin-detail-loading">불러오는 중...</div>
            ) : detailData && (() => {
              const u = detailData.user as Record<string, unknown> | null
              const analyses = detailData.analyses as Array<Record<string, unknown>>
              const jdAnalyses = detailData.jdAnalyses as Array<Record<string, unknown>>
              const couponsUsed = detailData.coupons as Array<Record<string, unknown>>
              return (
                <>
                  {u && (() => {
                    const plan = String(u.plan) as 'FREE' | 'PRO' | 'EXPERT'
                    const limits = PLAN_LIMITS[plan]
                    const extraCredits = (u.extra_credits as Record<string, number> | null) || {}

                    return (
                      <div className="admin-detail-section">
                        <div className="admin-detail-label">플랜, 사용량</div>
                        <div className="admin-detail-row">
                          <span className={`plan-badge ${plan.toLowerCase()}`}>{plan}</span>
                          <span>이력서 분석 {String(u.analyze_count)}/{limits.analyze + (extraCredits.resume || 0)}</span>
                          <span>JD 분석 {String(u.jd_count)}/{limits.jd + (extraCredits.jd || 0)}</span>
                          <span>이력서 생성 {String(u.rewrite_count)}/{limits.rewrite + (extraCredits.rewrite || 0)}</span>
                          <span>면접 가이드 {String(u.interview_count)}/{limits.interview + (extraCredits.interview || 0)}</span>
                        </div>
                      </div>
                    )
                  })()}

                  {couponsUsed.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">등록한 쿠폰</div>
                      {couponsUsed.map((c, i) => {
                        const credits = Number(c.credits) || 0
                        const used = Number(c.used) || 0
                        const remaining = credits - used
                        return (
                          <div key={i} className="admin-detail-row">
                            <code>{String(c.code)}</code>
                            <span>{FEATURE_LABELS[String(c.feature)] ?? String(c.feature)}</span>
                            <span>
                              {remaining > 0 ? `남은 횟수: ${remaining}회` : '사용 완료'}
                              {c.used_at && ` (${new Date(String(c.used_at)).toLocaleDateString('ko-KR')})`}
                            </span>
                            <span className="admin-date">등록: {new Date(String(c.claimed_at)).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {analyses.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">이력서 분석 내역 (최근 5건)</div>
                      {analyses.map((a, i) => {
                        const r = a.result as Record<string, unknown>
                        return (
                          <div key={i} className="admin-detail-row">
                            <span>{String(r?.job_title ?? '—')}</span>
                            <span className="admin-date">{new Date(String(a.created_at)).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {jdAnalyses.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-label">JD 분석 내역 (최근 5건)</div>
                      {jdAnalyses.map((a, i) => {
                        const r = a.result as Record<string, unknown>
                        return (
                          <div key={i} className="admin-detail-row">
                            <span>{String(r?.company ?? '—')}</span>
                            <span>{String(r?.position ?? '')}</span>
                            <span className="admin-date">{new Date(String(a.created_at)).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* 🔍 토큰 관리 탭 */}
      {tab === 'tokens' && (
        <div className="admin-content">
          <h2 className="admin-subtitle">토큰 사용량 관리</h2>

          {/* 사용자별 토큰 사용량 (추정치) */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>👥 사용자별 토큰 사용량 (추정치)</h3>
            <div style={{ marginBottom: '12px', fontSize: '13px', color: '#999' }}>
              * 평균 토큰 사용량 기준 추정치입니다. 실제 사용량은 Anthropic Console에서 확인하세요.
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>유저</th>
                    <th>플랜</th>
                    <th>이력서 분석</th>
                    <th>JD 분석</th>
                    <th>이력서 생성</th>
                    <th>면접 가이드</th>
                    <th>총 추정 토큰</th>
                    <th>예상 비용</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .map((u) => {
                      // 평균 토큰 사용량 (tokens per request)
                      const AVG_ANALYZE = 6700      // 이력서 분석 (검증 포함)
                      const AVG_JD = 3000            // JD 분석
                      const AVG_REWRITE = 8000       // 이력서 생성
                      const AVG_INTERVIEW = 26000    // 면접 가이드

                      // 총 토큰 계산
                      const totalTokens =
                        (u.analyze_count ?? 0) * AVG_ANALYZE +
                        (u.jd_count ?? 0) * AVG_JD +
                        (u.rewrite_count ?? 0) * AVG_REWRITE +
                        (u.interview_count ?? 0) * AVG_INTERVIEW

                      // 비용 계산 (입력: $1/1M, 출력: $5/1M, 평균 비율 80:20)
                      const inputTokens = totalTokens * 0.8
                      const outputTokens = totalTokens * 0.2
                      const cost = (inputTokens / 1000000) * 1 + (outputTokens / 1000000) * 5

                      return { ...u, totalTokens, cost }
                    })
                    .sort((a, b) => b.totalTokens - a.totalTokens)  // 토큰 많은 순
                    .slice(0, 20)  // 상위 20명만
                    .map((u) => (
                      <tr key={u.email}>
                        <td>
                          <div className="admin-user-cell">
                            {u.image && <img src={u.image} alt="" className="admin-avatar" />}
                            <div>
                              <div className="admin-user-name">{u.name ?? '—'}</div>
                              <div className="admin-user-email" style={{ fontSize: '11px' }}>
                                {u.email.length > 25 ? u.email.slice(0, 25) + '...' : u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-plan-badge ${
                            u.plan === 'EXPERT' ? 'expert' :
                            u.plan === 'PRO' ? 'pro' : 'free'
                          }`}>
                            {u.plan}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>
                            {u.analyze_count ?? 0}회
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {((u.analyze_count ?? 0) * 6700).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>
                            {u.jd_count ?? 0}회
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {((u.jd_count ?? 0) * 3000).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>
                            {u.rewrite_count ?? 0}회
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {((u.rewrite_count ?? 0) * 8000).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>
                            {u.interview_count ?? 0}회
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {((u.interview_count ?? 0) * 26000).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: u.totalTokens > 100000 ? '#ef4444' :
                                   u.totalTokens > 50000 ? '#f59e0b' : '#10b981'
                          }}>
                            {u.totalTokens.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            tokens
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: u.cost > 1 ? '#ef4444' :
                                   u.cost > 0.5 ? '#f59e0b' : '#10b981'
                          }}>
                            ${u.cost.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            추정
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9fafb', fontWeight: '700' }}>
                    <td colSpan={2}>총합 (전체 사용자)</td>
                    <td style={{ textAlign: 'center' }}>{totalAnalyze}회</td>
                    <td style={{ textAlign: 'center' }}>{totalJd}회</td>
                    <td style={{ textAlign: 'center' }}>{totalRewrite}회</td>
                    <td style={{ textAlign: 'center' }}>{totalInterview}회</td>
                    <td style={{ textAlign: 'right' }}>
                      {(
                        totalAnalyze * 6700 +
                        totalJd * 3000 +
                        totalRewrite * 8000 +
                        totalInterview * 26000
                      ).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      ${(
                        (totalAnalyze * 6700 + totalJd * 3000 + totalRewrite * 8000 + totalInterview * 26000) * 0.8 / 1000000 * 1 +
                        (totalAnalyze * 6700 + totalJd * 3000 + totalRewrite * 8000 + totalInterview * 26000) * 0.2 / 1000000 * 5
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 평균 토큰 참고표 */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: '#f3f4f6',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.8'
            }}>
              <strong>📊 평균 토큰 사용량 (참고):</strong>
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div>• 이력서 분석: <strong>6,700 tokens</strong> (검증 포함)</div>
                <div>• JD 분석: <strong>3,000 tokens</strong></div>
                <div>• 이력서 생성: <strong>8,000 tokens</strong> (평균)</div>
                <div>• 면접 가이드: <strong>26,000 tokens</strong></div>
              </div>
              <div style={{ marginTop: '8px', color: '#666' }}>
                * 비용 계산: 입력 $1/1M tokens, 출력 $5/1M tokens (비율 80:20 가정)
              </div>
            </div>
          </div>

          {/* 환경 설정 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>⚙️ 환경 설정</h3>
            <div className="admin-stats">
              <div className="admin-stat-card" style={{ minWidth: '300px' }}>
                <div className="admin-stat-label">검증 단계 (ENABLE_VALIDATION)</div>
                <div className="admin-stat-value" style={{ fontSize: '24px' }}>
                  활성화
                  <span style={{ fontSize: '14px', color: '#999', marginLeft: '8px' }}>
                    (환경 변수)
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  ✅ 품질 우선 모드 (기본값)
                  <br />
                  비활성화 시: 월 $2.25 절약, 품질 약간 하락
                </div>
              </div>

              <div className="admin-stat-card" style={{ minWidth: '300px' }}>
                <div className="admin-stat-label">Circuit Breaker</div>
                <div className="admin-stat-value" style={{ fontSize: '24px', color: '#10b981' }}>
                  ✅ 작동 중
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  연속 3회 실패 시 5분 차단
                  <br />
                  무한루프 방지 완료
                </div>
              </div>

              <div className="admin-stat-card" style={{ minWidth: '300px' }}>
                <div className="admin-stat-label">제안서 자동 생성</div>
                <div className="admin-stat-value" style={{ fontSize: '24px', color: '#ef4444' }}>
                  🚫 비활성화
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  수동 생성만 가능
                  <br />
                  무한루프 완전 차단
                </div>
              </div>
            </div>
          </div>

          {/* 외부 링크 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>🔗 외부 모니터링</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="https://console.anthropic.com/workbench/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-download-btn"
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔥 Anthropic Console
                <span style={{ fontSize: '12px', opacity: 0.9 }}>→ 실시간 토큰 사용량</span>
              </a>

              <a
                href="https://vercel.com/roche07s-projects/nexhire-b2c/logs"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-download-btn"
                style={{
                  background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📊 Vercel Logs
                <span style={{ fontSize: '12px', opacity: 0.9 }}>→ API 호출 로그</span>
              </a>
            </div>
          </div>

          {/* 토큰 사용량 가이드 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📖 로그 확인 방법</h3>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '20px',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.8',
              color: '#e5e5e5'
            }}>
              <div style={{ color: '#10b981', marginBottom: '12px' }}>
                <strong>Vercel Logs에서 검색:</strong>
              </div>
              <div style={{ color: '#999', marginBottom: '8px' }}>
                1. Vercel → Functions → Logs
              </div>
              <div style={{ color: '#999', marginBottom: '8px' }}>
                2. Filter: <code style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#fbbf24' }}>[analyze]</code> 또는 <code style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#fbbf24' }}>[rewrite]</code>
              </div>
              <div style={{ color: '#999', marginBottom: '16px' }}>
                3. 토큰 사용량 확인
              </div>

              <div style={{ color: '#8b5cf6', marginBottom: '8px' }}>
                <strong>예시 로그:</strong>
              </div>
              <div style={{ background: '#0a0a0a', padding: '12px', borderRadius: '6px', border: '1px solid #222' }}>
                <div style={{ color: '#10b981' }}>[analyze] 기본 분석 토큰: {'{'} input: 2000, output: 500, total: 2500 {'}'}</div>
                <div style={{ color: '#fbbf24' }}>[analyze] 검증 단계 토큰: {'{'} input: 1500, output: 300, total: 1800 {'}'}</div>
                <div style={{ color: '#06b6d4' }}>[analyze] 커리어 경로 토큰: {'{'} input: 2000, output: 400, total: 2400 {'}'}</div>
                <div style={{ color: '#999', marginTop: '8px' }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                <div style={{ color: '#fff' }}>총 사용: 6,700 tokens</div>
              </div>
            </div>
          </div>

          {/* 환경 변수 설정 가이드 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>⚙️ 환경 변수 설정 (Vercel)</h3>
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                💡 토큰 절약 모드 활성화 방법:
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#78350f' }}>
                <li>Vercel → Settings → Environment Variables</li>
                <li>변수 추가: <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>ENABLE_VALIDATION</code> = <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>false</code></li>
                <li>Redeploy 필요 (Settings → Deployments → Redeploy)</li>
              </ol>
              <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '6px', color: '#78350f' }}>
                <strong>⚠️ 주의:</strong> 검증 비활성화 시 품질이 약간 하락할 수 있습니다.
                <br />
                <strong>절감액:</strong> 월 $2.25 (이력서 분석 토큰 26% 감소)
              </div>
            </div>
          </div>

          {/* 현재 상태 요약 */}
          <div className="admin-section">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📊 현재 상태 요약</h3>
            <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-label">무한루프 방지</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>✅ 완료</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Circuit Breaker</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>✅ 작동 중</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">토큰 로깅</div>
                <div className="admin-stat-value" style={{ color: '#10b981' }}>✅ 활성화</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">제안서 자동생성</div>
                <div className="admin-stat-value" style={{ color: '#ef4444' }}>🚫 차단됨</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 접근 로그 탭 */}
      {tab === 'audit-logs' && (
        <div className="admin-content">
          <h2 className="admin-subtitle">헤드헌터 후보자 접근 로그</h2>

          {/* 필터 */}
          <div className="admin-section">
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="후보자 이메일로 필터링..."
                value={auditEmailFilter}
                onChange={(e) => setAuditEmailFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  width: '300px'
                }}
              />
              <button
                onClick={loadAuditLogs}
                style={{
                  padding: '8px 16px',
                  background: '#18181b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                조회
              </button>
              {auditEmailFilter && (
                <button
                  onClick={() => {
                    setAuditEmailFilter('')
                    setAuditLogs(null)
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#18181b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 로그 테이블 */}
          {auditLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>로딩 중...</div>
          ) : auditLogs === null ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              조회 버튼을 눌러 접근 로그를 확인하세요
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              접근 로그가 없습니다
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>접근 시간</th>
                    <th>헤드헌터</th>
                    <th>후보자</th>
                    <th>액션</th>
                    <th>IP 주소</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString('ko-KR')}</td>
                      <td>{log.actor_email}</td>
                      <td>{log.target_email}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: log.details?.access_type === 'view' ? '#dbeafe' :
                                    log.details?.access_type === 'export' ? '#fef3c7' :
                                    log.details?.access_type === 'contact' ? '#dcfce7' : '#e5e7eb',
                          color: log.details?.access_type === 'view' ? '#1e40af' :
                                 log.details?.access_type === 'export' ? '#92400e' :
                                 log.details?.access_type === 'contact' ? '#166534' : '#374151',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {log.details?.access_type === 'view' ? '조회' :
                           log.details?.access_type === 'export' ? '내보내기' :
                           log.details?.access_type === 'contact' ? '연락' :
                           log.details?.access_type === 'share' ? '공유' :
                           log.details?.access_type || '알 수 없음'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#6b7280' }}>
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <strong>📊 통계:</strong> 총 {auditLogs.length}건의 접근 로그
                {auditEmailFilter && ` (${auditEmailFilter} 필터링)`}
              </div>
            </div>
          )}

          {/* 안내 */}
          <div className="admin-section" style={{ marginTop: '24px' }}>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#1e40af' }}>
                📋 접근 로그 정보
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e3a8a' }}>
                <li>헤드헌터가 Eve 플랫폼에서 후보자 정보를 조회할 때 자동 기록됩니다</li>
                <li>개인정보보호법 제26조에 따른 수탁자 모니터링 의무를 준수합니다</li>
                <li>로그는 영구 보관되며 삭제되지 않습니다</li>
                <li>부적절한 접근 적발 시 해당 헤드헌터 계정을 즉시 정지할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 작성/수정 모달 */}
      {showAnnouncementModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowAnnouncementModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 600,
              width: '100%',
              padding: 32,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: '#1a1a1a' }}>
              {editingAnnouncement ? '공지사항 수정' : '공지사항 작성'}
            </h3>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
              <button
                onClick={() => setAnnouncementModalTab('edit')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: announcementModalTab === 'edit' ? '#22d3ee' : '#6b7280',
                  border: 'none',
                  borderBottom: announcementModalTab === 'edit' ? '2px solid #22d3ee' : 'none',
                  marginBottom: -2,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ✏️ 작성
              </button>
              <button
                onClick={() => setAnnouncementModalTab('preview')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: announcementModalTab === 'preview' ? '#22d3ee' : '#6b7280',
                  border: 'none',
                  borderBottom: announcementModalTab === 'preview' ? '2px solid #22d3ee' : 'none',
                  marginBottom: -2,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                👁️ 미리보기
              </button>
            </div>

            {announcementModalTab === 'edit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                  제목 *
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="공지사항 제목"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                  내용 * (HTML 사용 가능)
                </label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="공지사항 내용 (HTML 태그 사용 가능)"
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                    대상 *
                  </label>
                  <select
                    value={announcementForm.target_user_type}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, target_user_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <option value="HEADHUNTER">헤드헌터</option>
                    <option value="JOBSEEKER">구직자</option>
                    <option value="ALL">전체</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                    우선순위 *
                  </label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <option value="normal">일반</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                  만료일 (선택)
                </label>
                <input
                  type="datetime-local"
                  value={announcementForm.expires_at}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                />
              </div>
            </div>
            )}

            {announcementModalTab === 'preview' && (
              <div style={{
                border: '2px solid #22d3ee',
                borderRadius: 12,
                padding: 24,
                background: '#f9fafb',
                minHeight: 400
              }}>
                <div style={{ textAlign: 'center', marginBottom: 16, color: '#6b7280', fontSize: 13 }}>
                  사용자에게 표시될 모습
                </div>

                {/* 실제 모달 미리보기 */}
                <div style={{
                  background: '#ffffff',
                  border: announcementForm.priority === 'urgent'
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(34, 211, 238, 0.2)',
                  borderRadius: 20,
                  padding: 32,
                  maxWidth: 420,
                  margin: '0 auto',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
                }}>
                  {/* Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    background: announcementForm.priority === 'urgent'
                      ? 'linear-gradient(135deg, #fbbf24, #ef4444)'
                      : 'linear-gradient(135deg, #22d3ee, #a78bfa)',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: 20,
                    color: '#ffffff'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>JZ</span>
                    {announcementForm.priority === 'urgent' ? '긴급' : '공지사항'}
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: 800,
                    lineHeight: 1.3,
                    marginBottom: 12,
                    color: '#1a1a1a'
                  }}>
                    {announcementForm.title || '제목을 입력하세요'}
                  </h2>

                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 13,
                    color: '#6b7280',
                    marginBottom: 24
                  }}>
                    <span>👤 관리자</span>
                    <span>•</span>
                    <span>🕐 방금 전</span>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: '#374151',
                      marginBottom: 24,
                      maxHeight: 300,
                      overflowY: 'auto'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: announcementForm.content || '<p style="color: #9ca3af;">내용을 입력하세요</p>'
                    }}
                  />

                  {/* Actions Preview */}
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    paddingTop: 20,
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      오늘 하루 보지 않기
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
                      color: 'white',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      확인
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveAnnouncement}
                  disabled={!announcementForm.title || !announcementForm.content}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: announcementForm.title && announcementForm.content
                      ? 'linear-gradient(135deg, #22d3ee, #a78bfa)'
                      : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: announcementForm.title && announcementForm.content ? 'pointer' : 'not-allowed'
                  }}
                >
                  {editingAnnouncement ? '수정' : '작성'}
                </button>
              </div>
          </div>
        </div>
      )}
    </main>
    </>
  )
}
