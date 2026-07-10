'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'normal' | 'urgent'
  created_by: string
  created_at: string
}

export default function AnnouncementModal() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUnreadAnnouncements()
  }, [])

  async function fetchUnreadAnnouncements() {
    try {
      const res = await fetch('/api/announcements/unread')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkRead(announcementId: string, dismissUntil?: string) {
    try {
      await fetch('/api/announcements/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId, dismissUntil })
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  function handleDismissToday() {
    const current = announcements[currentIndex]
    if (!current) return

    // 내일 00:00까지
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    handleMarkRead(current.id, tomorrow.toISOString())
    handleNext()
  }

  function handleConfirm() {
    const current = announcements[currentIndex]
    if (!current) return

    handleMarkRead(current.id)
    handleNext()
  }

  function handleNext() {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 모든 공지 확인 완료
      setAnnouncements([])
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }

  if (isLoading || announcements.length === 0) {
    return null
  }

  const current = announcements[currentIndex]
  const isUrgent = current.priority === 'urgent'
  const showPagination = announcements.length > 1

  return (
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
        padding: 20,
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleConfirm()
        }
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          border: isUrgent
            ? '1px solid rgba(251, 191, 36, 0.3)'
            : '1px solid rgba(34, 211, 238, 0.2)',
          borderRadius: 20,
          maxWidth: 420,
          width: '100%',
          padding: 32,
          position: 'relative',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isUrgent
            ? '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(251, 191, 36, 0.15) inset'
            : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(34, 211, 238, 0.1) inset'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: isUrgent
              ? 'linear-gradient(135deg, #fbbf24, #ef4444)'
              : 'linear-gradient(135deg, #22d3ee, #a78bfa)',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 20,
            color: '#ffffff'
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em' }}>
            JZ
          </span>
          {isUrgent ? '긴급' : '공지사항'}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 12,
            color: '#1a1a1a'
          }}
        >
          {current.title}
        </h2>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 24
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            👤 {current.created_by}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🕐 {formatDate(current.created_at)}
          </span>
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
          dangerouslySetInnerHTML={{ __html: current.content }}
        />

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            paddingTop: 20,
            borderTop: '1px solid #e5e7eb'
          }}
        >
          <button
            onClick={handleDismissToday}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            오늘 하루 보지 않기
          </button>

          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(34, 211, 238, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(34, 211, 238, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(34, 211, 238, 0.3)'
            }}
          >
            {showPagination && currentIndex < announcements.length - 1 ? '다음' : '확인'}
          </button>
        </div>

        {/* Pagination */}
        {showPagination && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginTop: 24
            }}
          >
            {announcements.map((_, index) => (
              <div
                key={index}
                style={{
                  width: index === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: index === currentIndex ? 4 : '50%',
                  background: index === currentIndex
                    ? 'linear-gradient(135deg, #22d3ee, #a78bfa)'
                    : '#e5e7eb',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
