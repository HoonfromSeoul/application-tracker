import { useEffect, useState } from 'react'
import { AUTH_ENABLED } from './lib/supabase'
import { useAuth } from './lib/auth'
import { resetStorageState } from './lib/storage'
import App from './App'
import { SignIn, BannedScreen } from './components/SignIn'
import { Admin } from './components/Admin'

// Hash-based route helper. Keeps SPA on Vercel with no server rewrites needed.
function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, ''))
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#\/?/, ''))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

export function Root() {
  const { ready, session, profile, signOut } = useAuth()
  const route = useHashRoute()

  // No Supabase configured → unauthenticated personal mode (dev / localStorage).
  if (!AUTH_ENABLED) return <App />

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: 'var(--m-label-alternative)', fontSize: 14,
      }}>불러오는 중…</div>
    )
  }

  if (!session) return <SignIn />

  // Authenticated but profile row not yet ready (race with auto-create trigger):
  // the trigger fires inside the same transaction, so a tiny retry is enough.
  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: 'var(--m-label-alternative)', fontSize: 14,
      }}>계정 준비 중…</div>
    )
  }

  if (profile.status === 'banned') {
    return <BannedScreen onSignOut={async () => { await signOut(); resetStorageState() }} />
  }

  if (route === 'admin') {
    if (profile.role !== 'admin') {
      // Not an admin → silently send back to app.
      window.location.hash = ''
      return <App />
    }
    return <Admin onExit={() => { window.location.hash = '' }} />
  }

  return <App />
}
