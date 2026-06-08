import { useState } from 'react'
import { useAuth } from '../lib/auth'

// Inline Google "G" mark. Official multi-color glyph.
function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export function SignIn() {
  const { signInWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const click = async () => {
    setBusy(true); setErr(null)
    try { await signInWithGoogle() }
    catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--m-bg-normal)',
    }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <h1 style={{
          margin: '0 0 6px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em',
          color: 'var(--m-label-normal)',
        }}>
          지원 트래커
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: 'var(--m-label-alternative)' }}>
          채용 지원 진행 상황을 한 곳에서 관리
        </p>

        <button
          onClick={click}
          disabled={busy}
          className="ktrack-btn-ghost"
          style={{
            width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px 16px', border: '0.5px solid var(--m-line-normal)',
            background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
            borderRadius: 'var(--m-radius-8)', fontSize: 14, fontWeight: 700,
            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          <GoogleMark />
          {busy ? '이동 중…' : 'Google로 계속하기'}
        </button>

        {err && (
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--m-red-40)' }}>
            로그인 실패: {err}
          </p>
        )}

        <p style={{ marginTop: 32, fontSize: 11, lineHeight: '17px', color: 'var(--m-label-assistive)' }}>
          가입은 Google 계정으로만 진행됩니다. 데이터는 본인 계정에만 저장되며 다른 사용자는 볼 수 없습니다.
        </p>
      </div>
    </div>
  )
}

export function BannedScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--m-bg-normal)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--m-label-normal)' }}>
          접근이 제한된 계정입니다
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--m-label-alternative)', lineHeight: '22px' }}>
          이 계정은 관리자가 차단했습니다. 문의가 필요하면 서비스 운영자에게 연락해주세요.
        </p>
        <button onClick={onSignOut} className="ktrack-btn-ghost"
          style={{
            padding: '9px 16px', border: '0.5px solid var(--m-line-normal)',
            background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
            borderRadius: 'var(--m-radius-8)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>로그아웃</button>
      </div>
    </div>
  )
}
