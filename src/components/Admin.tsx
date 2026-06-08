import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface AdminRow {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin'
  status: 'approved' | 'banned'
  created_at: string
  card_count: number
  preset_count: number
  last_activity: string | null
}

export function Admin({ onExit }: { onExit: () => void }) {
  const { profile, signOut } = useAuth()
  const [rows, setRows] = useState<AdminRow[] | null>(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, setPending] = useState<Set<string>>(new Set())

  const load = async () => {
    if (!supabase) return
    setErr(null)
    const { data, error } = await supabase
      .from('admin_user_stats')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setErr(error.message); return }
    setRows((data ?? []) as AdminRow[])
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term || !rows) return rows ?? []
    return rows.filter(r =>
      r.email.toLowerCase().includes(term) ||
      (r.full_name ?? '').toLowerCase().includes(term),
    )
  }, [rows, q])

  const totals = useMemo(() => {
    const r = rows ?? []
    return {
      users: r.length,
      banned: r.filter(x => x.status === 'banned').length,
      admins: r.filter(x => x.role === 'admin').length,
      cards: r.reduce((s, x) => s + (x.card_count ?? 0), 0),
    }
  }, [rows])

  const update = async (id: string, patch: Partial<Pick<AdminRow, 'status' | 'role'>>) => {
    if (!supabase) return
    setPending(p => new Set(p).add(id))
    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    setPending(p => { const n = new Set(p); n.delete(id); return n })
    if (error) { setErr(error.message); return }
    setRows(rs => rs?.map(r => r.id === id ? { ...r, ...patch } as AdminRow : r) ?? null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--m-bg-normal-alt)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px', background: 'var(--m-bg-normal)',
        borderBottom: '0.5px solid var(--m-line-normal)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            지원 트래커 · Admin
          </h1>
          <span style={{ fontSize: 13, color: 'var(--m-label-alternative)' }}>
            {profile?.email}
          </span>
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button onClick={onExit} className="ktrack-btn-ghost"
            style={{
              padding: '7px 12px', border: '0.5px solid var(--m-line-normal)',
              background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
              borderRadius: 'var(--m-radius-8)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>앱으로</button>
          <button onClick={signOut} className="ktrack-btn-ghost"
            style={{
              padding: '7px 12px', border: '0.5px solid var(--m-line-normal)',
              background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
              borderRadius: 'var(--m-radius-8)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>로그아웃</button>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 28px 40px' }}>
        {/* stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <Stat label="총 사용자" value={totals.users} />
          <Stat label="관리자" value={totals.admins} />
          <Stat label="차단됨" value={totals.banned} accent="var(--m-red-40)" />
          <Stat label="총 카드 수" value={totals.cards} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="이메일 / 이름 검색…"
            style={{
              flex: 1, maxWidth: 320, padding: '9px 12px', fontSize: 14,
              border: '0.5px solid var(--m-line-normal)', borderRadius: 'var(--m-radius-8)',
              outline: 'none', background: 'var(--m-bg-normal)',
            }}
          />
          <button onClick={load} className="ktrack-btn-ghost"
            style={{
              padding: '8px 12px', border: '0.5px solid var(--m-line-normal)',
              background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
              borderRadius: 'var(--m-radius-8)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>새로고침</button>
        </div>

        {err && (
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--m-radius-8)',
            background: 'var(--m-red-95)', color: 'var(--m-red-40)', fontSize: 13,
          }}>{err}</div>
        )}

        <div style={{
          border: '0.5px solid var(--m-line-normal)', borderRadius: 'var(--m-radius-12)',
          background: 'var(--m-bg-normal)', overflow: 'auto',
        }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 880 }}>
            <thead>
              <tr style={{ background: 'var(--m-bg-normal-alt)' }}>
                {['이메일','이름','가입일','카드','프리셋','마지막 활동','권한','상태'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 700,
                    color: 'var(--m-label-alternative)',
                    borderBottom: '0.5px solid var(--m-line-normal)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--m-label-alternative)' }}>불러오는 중…</td></tr>
              )}
              {rows !== null && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--m-label-alternative)' }}>일치하는 사용자가 없습니다</td></tr>
              )}
              {filtered.map(u => {
                const isMe = u.id === profile?.id
                const busy = pending.has(u.id)
                return (
                  <tr key={u.id} style={{ borderBottom: '0.5px solid var(--m-line-alternative)' }}>
                    <td style={cell}><span style={{ fontWeight: 700 }}>{u.email}</span>{isMe && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--m-label-assistive)' }}>(나)</span>}</td>
                    <td style={cell}>{u.full_name ?? '—'}</td>
                    <td style={{ ...cell, color: 'var(--m-label-alternative)' }}>{formatDate(u.created_at)}</td>
                    <td style={{ ...cell, color: u.card_count > 400 ? 'var(--m-red-40)' : 'var(--m-label-neutral)', fontWeight: u.card_count > 400 ? 700 : 500 }}>{u.card_count}</td>
                    <td style={{ ...cell, color: 'var(--m-label-neutral)' }}>{u.preset_count}</td>
                    <td style={{ ...cell, color: 'var(--m-label-alternative)' }}>{u.last_activity ? formatDate(u.last_activity) : '—'}</td>
                    <td style={cell}>
                      <select
                        value={u.role}
                        disabled={busy || isMe}
                        onChange={(e) => update(u.id, { role: e.target.value as 'user' | 'admin' })}
                        style={selectStyle}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td style={cell}>
                      <select
                        value={u.status}
                        disabled={busy || isMe}
                        onChange={(e) => update(u.id, { status: e.target.value as 'approved' | 'banned' })}
                        style={{
                          ...selectStyle,
                          color: u.status === 'banned' ? 'var(--m-red-40)' : 'var(--m-label-normal)',
                          fontWeight: u.status === 'banned' ? 700 : 500,
                        }}
                      >
                        <option value="approved">approved</option>
                        <option value="banned">banned</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 18, fontSize: 12, color: 'var(--m-label-assistive)', lineHeight: '18px' }}>
          본인 계정의 권한/상태는 변경할 수 없습니다 (실수로 권한을 잃지 않도록). · 카드 수가 빨갛게 보이면 한도(500) 근처
        </p>
      </div>
    </div>
  )
}

const cell: React.CSSProperties = {
  padding: '12px 14px', fontSize: 13, color: 'var(--m-label-normal)', whiteSpace: 'nowrap',
}
const selectStyle: React.CSSProperties = {
  padding: '6px 8px', border: '0.5px solid var(--m-line-normal)',
  borderRadius: 'var(--m-radius-8)', background: 'var(--m-bg-normal)', fontSize: 13, cursor: 'pointer',
}

function formatDate(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{
      flex: 1, padding: '14px 18px', background: 'var(--m-bg-normal)',
      border: '0.5px solid var(--m-line-neutral)', borderRadius: 'var(--m-radius-12)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--m-label-alternative)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ?? 'var(--m-label-normal)', lineHeight: '32px', marginTop: 2 }}>
        {value}
      </div>
    </div>
  )
}
