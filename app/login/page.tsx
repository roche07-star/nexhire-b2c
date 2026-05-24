import { signIn } from '@/auth'

export const metadata = { title: '로그인 — Nexhire' }

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="22" fill="#2a2a22"/>
            <rect x="3" y="3" width="94" height="94" rx="19" stroke="#e8ff47" strokeWidth="5"/>
            <path d="M24 75 L24 25 L35 25 L62 62 L62 25 L73 25 L73 75 L62 75 L35 38 L35 75 Z" fill="#e8e8de"/>
            <circle cx="73" cy="22" r="10" fill="#e8ff47"/>
          </svg>
        </div>
        <h1 className="login-title">Nexhire 로그인</h1>
        <p className="login-sub">소셜 계정으로 간편하게 시작하세요</p>

        <div className="login-buttons">
          <form action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}>
            <button className="btn-social btn-google" type="submit">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
          </form>

          <form action={async () => {
            'use server'
            await signIn('kakao', { redirectTo: '/' })
          }}>
            <button className="btn-social btn-kakao" type="submit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.68 5.19 4.2 6.6l-.9 3.3 3.84-2.52C10.02 18.42 11.01 18.6 12 18.6c5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
              </svg>
              카카오로 계속하기
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
