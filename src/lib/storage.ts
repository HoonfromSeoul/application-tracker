import type { AppData } from '../types'
import seed from '../../data.seed.json'

// ─── Adapter contract ────────────────────────────────────────────────────
// Swap implementations later (e.g. SupabaseAdapter) without touching App.tsx.
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

// ─── LocalStorage adapter — for static deployments (Vercel/CF Pages) ────
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
    // First run on this browser — hand back the bundled seed.
    return seed as AppData
  },
  async save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  },
}

// ─── Pick adapter ────────────────────────────────────────────────────────
// Default: dev → file API, prod → localStorage. Override with
// `VITE_STORAGE=local|file` when needed (e.g. local prod preview testing).
const override = (import.meta.env.VITE_STORAGE || '').toLowerCase()
const adapter: StorageAdapter =
  override === 'local' ? LocalStorageAdapter :
  override === 'file' ? FileApiAdapter :
  import.meta.env.PROD ? LocalStorageAdapter : FileApiAdapter

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
