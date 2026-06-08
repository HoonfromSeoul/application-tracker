import type { AppData, Card, Preset, KeywordTerm } from '../types'
import seed from '../../data.seed.json'
import { AUTH_ENABLED, supabase } from './supabase'

// ─── Adapter contract ────────────────────────────────────────────────────
// Implementations: dev file API, browser localStorage, Supabase (per-user).
export interface StorageAdapter {
  load: () => Promise<AppData>
  save: (data: AppData) => Promise<void>
  readonly id: string
}

// ─── File API adapter — talks to the Vite dev middleware (/api/data) ────
const FileApiAdapter: StorageAdapter = {
  id: 'file-api',
  async load() {
    const res = await fetch('/api/data', { cache: 'no-store' })
    if (!res.ok) throw new Error(`Load failed: ${res.status}`)
    return res.json()
  },
  async save(data) {
    const res = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`Save failed: ${res.status}`)
  },
}

// ─── LocalStorage adapter — for static deployments without auth ─────────
const LS_KEY = 'ktrack-data-v2'
const LocalStorageAdapter: StorageAdapter = {
  id: 'local-storage',
  async load() {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) return JSON.parse(raw) as AppData
    } catch (err) {
      console.warn('LocalStorage read failed; falling back to seed', err)
    }
    return seed as AppData
  },
  async save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  },
}

// ─── Supabase adapter — per-user rows, RLS-isolated ─────────────────────
// load: SELECT my cards + presets.
// save: diff vs last-known snapshot → batched upsert + targeted delete.

type CardRow = {
  id: string; client_id: string | null; company: string; position: string; url: string
  stage: string; tier: string; salary: string; remote: string; region: string
  applied: string; interview: string; interview_url: string; next_action: string; note: string
}
type PresetRow = {
  id: string; client_id: string | null; name: string; keywords: KeywordTerm[]
  keyword_join: 'AND' | 'OR'; location: string; experience: string; work_type: string
  date_posted: string; full_time: boolean; latest_sort: boolean; under10: boolean
}

// Map between row and Card. We use Supabase's uuid id as the "real" id and
// keep the original random "c…" client_id only for migration display.
const rowToCard = (r: CardRow): Card => ({
  id: r.id,
  company: r.company, position: r.position, url: r.url,
  stage: r.stage as Card['stage'], tier: r.tier as Card['tier'],
  salary: r.salary, remote: r.remote as Card['remote'], region: r.region as Card['region'],
  applied: r.applied, interview: r.interview, interviewUrl: r.interview_url,
  nextAction: r.next_action, note: r.note,
})
const cardToRow = (c: Card, userId: string): Omit<CardRow, 'client_id'> & { user_id: string; client_id?: string | null } => ({
  id: isUuid(c.id) ? c.id : crypto.randomUUID(),
  user_id: userId,
  client_id: isUuid(c.id) ? null : c.id,
  company: c.company, position: c.position, url: c.url,
  stage: c.stage, tier: c.tier,
  salary: c.salary, remote: c.remote, region: c.region,
  applied: c.applied, interview: c.interview, interview_url: c.interviewUrl,
  next_action: c.nextAction, note: c.note,
})

const rowToPreset = (r: PresetRow): Preset => ({
  id: r.id, name: r.name, keywords: r.keywords ?? [], keywordJoin: r.keyword_join,
  location: r.location as Preset['location'],
  experience: r.experience as Preset['experience'],
  workType: r.work_type as Preset['workType'],
  datePosted: r.date_posted as Preset['datePosted'],
  fullTime: r.full_time, latestSort: r.latest_sort, under10: r.under10,
})
const presetToRow = (p: Preset, userId: string) => ({
  id: isUuid(p.id) ? p.id : crypto.randomUUID(),
  user_id: userId,
  client_id: isUuid(p.id) ? null : p.id,
  name: p.name, keywords: p.keywords ?? [], keyword_join: p.keywordJoin,
  location: p.location, experience: p.experience, work_type: p.workType,
  date_posted: p.datePosted, full_time: p.fullTime, latest_sort: p.latestSort, under10: p.under10,
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(s: string) { return UUID_RE.test(s) }

let lastCardIds: Set<string> = new Set()
let lastPresetIds: Set<string> = new Set()

const SupabaseAdapter: StorageAdapter = {
  id: 'supabase',
  async load() {
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data: sess } = await supabase.auth.getSession()
    if (!sess.session) throw new Error('Not signed in')
    const [cardsRes, presetsRes] = await Promise.all([
      supabase.from('cards').select('*').order('created_at', { ascending: true }),
      supabase.from('presets').select('*').order('created_at', { ascending: true }),
    ])
    if (cardsRes.error) throw cardsRes.error
    if (presetsRes.error) throw presetsRes.error
    const cards = (cardsRes.data as CardRow[]).map(rowToCard)
    const presets = (presetsRes.data as PresetRow[]).map(rowToPreset)
    lastCardIds = new Set(cards.map(c => c.id))
    lastPresetIds = new Set(presets.map(p => p.id))
    return { version: 2, cards, presets }
  },

  async save(data) {
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data: sess } = await supabase.auth.getSession()
    const uid = sess.session?.user?.id
    if (!uid) throw new Error('Not signed in')

    // ── cards diff ──
    const cardRows = data.cards.map(c => cardToRow(c, uid))
    // Update each Card's id in place so subsequent saves recognize them as UUIDs.
    data.cards.forEach((c, i) => { if (c.id !== cardRows[i].id) c.id = cardRows[i].id })
    const nextCardIds = new Set(cardRows.map(r => r.id))
    const cardsToDelete = [...lastCardIds].filter(id => !nextCardIds.has(id))

    if (cardRows.length) {
      const { error } = await supabase.from('cards').upsert(cardRows, { onConflict: 'id' })
      if (error) throw error
    }
    if (cardsToDelete.length) {
      const { error } = await supabase.from('cards').delete().in('id', cardsToDelete)
      if (error) throw error
    }
    lastCardIds = nextCardIds

    // ── presets diff ──
    const presetRows = data.presets.map(p => presetToRow(p, uid))
    data.presets.forEach((p, i) => { if (p.id !== presetRows[i].id) p.id = presetRows[i].id })
    const nextPresetIds = new Set(presetRows.map(r => r.id))
    const presetsToDelete = [...lastPresetIds].filter(id => !nextPresetIds.has(id))

    if (presetRows.length) {
      const { error } = await supabase.from('presets').upsert(presetRows, { onConflict: 'id' })
      if (error) throw error
    }
    if (presetsToDelete.length) {
      const { error } = await supabase.from('presets').delete().in('id', presetsToDelete)
      if (error) throw error
    }
    lastPresetIds = nextPresetIds
  },
}

// ─── Pick adapter ────────────────────────────────────────────────────────
// Priority: explicit VITE_STORAGE override → auth-enabled prod → prod static
//   → dev file API.
const override = (import.meta.env.VITE_STORAGE || '').toLowerCase()
const adapter: StorageAdapter =
  override === 'local'    ? LocalStorageAdapter :
  override === 'file'     ? FileApiAdapter :
  override === 'supabase' ? SupabaseAdapter :
  (import.meta.env.PROD && AUTH_ENABLED) ? SupabaseAdapter :
  import.meta.env.PROD    ? LocalStorageAdapter :
                            FileApiAdapter

export const STORAGE_ID = adapter.id

export async function loadData(): Promise<AppData> {
  return adapter.load()
}

// ─── Debounced save ──────────────────────────────────────────────────────
let saveTimer: number | undefined
let pending: AppData | null = null
let inflight: Promise<void> | null = null

async function flush() {
  if (!pending) return
  const data = pending
  pending = null
  await adapter.save(data)
}

export function saveData(data: AppData): Promise<void> {
  pending = data
  if (saveTimer) window.clearTimeout(saveTimer)
  if (!inflight) {
    inflight = new Promise<void>((resolve, reject) => {
      saveTimer = window.setTimeout(async () => {
        try { await flush(); resolve() }
        catch (e) { reject(e) }
        finally { inflight = null; saveTimer = undefined }
      }, 250)
    })
  }
  return inflight
}

// Reset internal diff state — call on sign-out so the next user's load
// doesn't try to delete the prior user's cards.
export function resetStorageState() {
  lastCardIds = new Set()
  lastPresetIds = new Set()
  pending = null
  if (saveTimer) { window.clearTimeout(saveTimer); saveTimer = undefined }
  inflight = null
}
