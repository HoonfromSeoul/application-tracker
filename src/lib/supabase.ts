import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Auth mode is opt-in: set the two env vars to enable Google sign-in + per-user
// Supabase storage. Without them, the app falls back to the LocalStorage
// adapter (dev / personal preview) and the SignIn page is bypassed.
export const AUTH_ENABLED = Boolean(url && anon)

export const supabase: SupabaseClient | null = AUTH_ENABLED
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
