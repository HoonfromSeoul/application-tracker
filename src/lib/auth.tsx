import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AUTH_ENABLED, supabase } from './supabase'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  status: 'approved' | 'banned'
  created_at: string
}

interface AuthCtx {
  ready: boolean        // true once initial session check completed
  session: Session | null
  profile: Profile | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(!AUTH_ENABLED)

  const loadProfile = async (uid: string) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, status, created_at')
      .eq('id', uid)
      .maybeSingle()
    if (error) {
      console.error('profile load failed', error)
      setProfile(null)
      return
    }
    setProfile((data ?? null) as Profile | null)
  }

  useEffect(() => {
    if (!supabase) { setReady(true); return }
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (sess?.user) void loadProfile(sess.user.id)
      else setProfile(null)
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  const value: AuthCtx = {
    ready,
    session,
    profile,
    async signInWithGoogle() {
      if (!supabase) throw new Error('Supabase not configured')
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      })
    },
    async signOut() {
      if (!supabase) return
      await supabase.auth.signOut()
      setProfile(null)
    },
    async reloadProfile() {
      if (session?.user) await loadProfile(session.user.id)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
