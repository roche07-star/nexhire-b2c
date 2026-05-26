import { signIn } from '@/auth'

export const metadata = { title: '로그인 — Nexhire' }

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-brand">
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="22" fill="#2a2a22"/>
            <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
            <path d="M24 75 L24 25 L35 25 L62 62 L62 25 L73 25 L73 75 L62 75 L35 38 L35 75 Z" fill="#e8e8de"/>
            <circle cx="73" cy="22" r="10" fill="#e8ff47"/>
          </svg>
          <span className="login-brand-name">Nexhire</span>
        </div>

        <div className="login-headline">
          <h1 className="login-title">커리어를 설계하세요</h1>
          <p className="login-sub">이력서 분석부터 JD 매칭까지, AI가 도와드립니다</p>
        </div>

        <div className="login-divider" />

        <div className="login-buttons">
          <form action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/api/after-login' })
          }}>
            <button className="btn-social btn-google" type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
          </form>
        </div>

        <p className="login-terms">
          로그인 시 <a href="/terms">이용약관</a> 및 <a href="/privacy">개인정보처리방침</a>에 동의합니다.
        </p>
      </div>
    </main>
  )
}
