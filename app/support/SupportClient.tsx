'use client'

import { useState, useEffect } from 'react'
import SupportModal from '@/components/SupportModal'
import ChatbotModal from '@/components/ChatbotModal'

interface SupportMessage {
  id: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved'
  created_at: string
  admin_reply: string | null
  replied_at: string | null
}

const STATUS_LABEL = {
  new: '답변 대기',
  in_progress: '처리중',
  resolved: '답변 완료',
}

const STATUS_COLOR = {
  new: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#10b981',
}

export default function SupportClient() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      if (res.ok) {
        setMessages(data.messages || [])
      }
    } finally {
      setLoading(false)
    }
  }

  function handleModalClose() {
    setShowModal(false)
    fetchMessages() // 새로고침
  }

  return (
    <main style={{
      minHeight: '80vh',
      padding: '60px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 12,
          }}>
            고객센터
          </h1>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 24,
          }}>
            문의하신 내용은 순차적으로 답변드립니다
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowChatbot(true)}
              style={{
                padding: '14px 28px',
                background: '#ffffff',
                color: '#667eea',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              💬 AI 상담
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              ✉️ 문의하기
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#18181b',
            marginBottom: 20,
          }}>
            내 문의 내역
          </h2>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#71717a' }}>
              불러오는 중...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, color: '#71717a' }}>
                아직 문의 내역이 없습니다
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      background: expandedId === msg.id ? '#f9fafb' : '#ffffff',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (expandedId !== msg.id) {
                        e.currentTarget.style.background = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (expandedId !== msg.id) {
                        e.currentTarget.style.background = '#ffffff'
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#18181b',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {msg.subject}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: '#71717a',
                        }}>
                          {new Date(msg.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: `${STATUS_COLOR[msg.status]}15`,
                        color: STATUS_COLOR[msg.status],
                        whiteSpace: 'nowrap',
                      }}>
                        {STATUS_LABEL[msg.status]}
                      </span>
                    </div>
                  </div>

                  {/* 확장 영역 */}
                  {expandedId === msg.id && (
                    <div style={{
                      padding: '20px',
                      background: '#fafafa',
                      borderTop: '1px solid #e5e7eb',
                    }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#71717a',
                          marginBottom: 8,
                        }}>
                          문의 내용
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: '#18181b',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {msg.message}
                        </div>
                      </div>

                      {msg.admin_reply && (
                        <div style={{
                          marginTop: 16,
                          padding: '16px',
                          background: '#ffffff',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                        }}>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#10b981',
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            <span>✓</span>
                            <span>관리자 답변</span>
                            {msg.replied_at && (
                              <span style={{ color: '#71717a', fontWeight: 400 }}>
                                · {new Date(msg.replied_at).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 14,
                            color: '#18181b',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {msg.admin_reply}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SupportModal open={showModal} onClose={handleModalClose} />
      <ChatbotModal
        open={showChatbot}
        onClose={() => setShowChatbot(false)}
        onRequestSupport={() => setShowModal(true)}
      />
    </main>
  )
}
