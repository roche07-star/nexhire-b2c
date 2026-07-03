'use client'

import { useState } from 'react'

interface StorePost {
  id: string
  title: string
  content: string
  author_name: string
  created_at: string
}

interface Props {
  initialPosts: StorePost[]
  isManager: boolean
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function StoreClient({ initialPosts, isManager }: Props) {
  const [posts, setPosts] = useState<StorePost[]>(initialPosts)
  const [selected, setSelected] = useState<StorePost | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return }
      setPosts([data.post, ...posts])
      setTitle('')
      setContent('')
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/store/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id))
        if (selected?.id === id) setSelected(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="store-page">
      <div className="store-container">
        <div className="store-header">
          <div>
            <h1 className="store-title">STORE</h1>
            <p className="store-sub">AI 커리어 부스터 팩</p>
          </div>
          {isManager && !showForm && (
            <button className="btn-primary store-write-btn" onClick={() => setShowForm(true)}>
              + 글쓰기
            </button>
          )}
        </div>

        {showForm && isManager && (
          <form className="store-form" onSubmit={handleSubmit}>
            <div className="store-form-header">
              <span className="store-form-title">새 게시글 작성</span>
              <button type="button" className="store-form-cancel" onClick={() => { setShowForm(false); setError('') }}>취소</button>
            </div>
            {error && <div className="store-form-error">{error}</div>}
            <input
              className="store-input"
              placeholder="제목"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={200}
            />
            <textarea
              className="store-textarea"
              placeholder="내용을 입력하세요..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={8}
            />
            <div className="store-form-actions">
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        )}

        {selected ? (
          <div className="store-detail">
            <button className="store-back-btn" onClick={() => setSelected(null)}>← 목록으로</button>
            <div className="store-detail-header">
              <h2 className="store-detail-title">{selected.title}</h2>
              <div className="store-detail-meta">
                <span className="store-detail-author">{selected.author_name}</span>
                <span className="store-detail-date">{formatDate(selected.created_at)}</span>
              </div>
              {isManager && (
                <button
                  className="store-delete-btn"
                  onClick={() => handleDelete(selected.id)}
                  disabled={deletingId === selected.id}
                >
                  {deletingId === selected.id ? '삭제 중...' : '삭제'}
                </button>
              )}
            </div>
            <div className="store-detail-content">{selected.content}</div>
          </div>
        ) : (
          <div className="store-board">
            {posts.length === 0 ? (
              <div className="store-empty">등록된 게시글이 없습니다.</div>
            ) : (
              <ul className="store-list">
                {posts.map((post, i) => (
                  <li key={post.id} className="store-row">
                    <span className="store-row-num">{posts.length - i}</span>
                    <button className="store-row-title" onClick={() => setSelected(post)}>
                      {post.title}
                    </button>
                    <span className="store-row-author">{post.author_name}</span>
                    <span className="store-row-date">{formatDate(post.created_at)}</span>
                    {isManager && (
                      <button
                        className="store-row-delete"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? '...' : '삭제'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
