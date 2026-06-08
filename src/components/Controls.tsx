import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ChevronDownIcon, CheckIcon, KanbanIcon, TableIcon } from './icons'
import type { View } from '../types'

interface FilterDropdownProps<T extends string> {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (v: T[]) => void
}

export function FilterDropdown<T extends string>({ label, options, selected, onChange }: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const active = selected.length > 0
  const toggle = (v: T) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="ktrack-filterbtn"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 10px 8px 12px', fontSize: 14,
          fontWeight: 'var(--m-w-medium)' as CSSProperties['fontWeight'],
          cursor: 'pointer', whiteSpace: 'nowrap',
          borderRadius: 'var(--m-radius-8)',
          border: active ? '0.5px solid var(--m-primary-normal)' : '0.5px solid var(--m-line-normal)',
          background: active ? 'var(--m-blue-95)' : 'var(--m-bg-normal)',
          color: active ? 'var(--m-primary-strong)' : 'var(--m-label-neutral)',
        }}
      >
        {label}{active && <span style={{ fontWeight: 700 }}>· {selected.length}</span>}
        <ChevronDownIcon size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', opacity: 0.7 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 180,
          background: 'var(--m-bg-elevated)', border: '0.5px solid var(--m-line-normal)',
          borderRadius: 'var(--m-radius-12)', boxShadow: 'var(--m-shadow-large)',
          padding: 6, animation: 'ktrack-fade .14s ease',
        }}>
          {options.map(opt => {
            const on = selected.includes(opt)
            return (
              <button key={opt} onClick={() => toggle(opt)} className="ktrack-menuitem"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  width: '100%', padding: '8px 10px', border: 'none', background: 'transparent',
                  borderRadius: 'var(--m-radius-8)', cursor: 'pointer',
                  fontSize: 14, color: 'var(--m-label-normal)', textAlign: 'left',
                }}>
                {opt}
                {on && <CheckIcon size={16} style={{ color: 'var(--m-primary-normal)' }} />}
              </button>
            )
          })}
          {active && (
            <>
              <div style={{ height: 1, background: 'var(--m-line-alternative)', margin: '6px 4px' }} />
              <button onClick={() => onChange([])} className="ktrack-menuitem"
                style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: 'var(--m-radius-8)', cursor: 'pointer', fontSize: 13, color: 'var(--m-label-alternative)', textAlign: 'left' }}>
                선택 해제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: '14px 18px',
      background: 'var(--m-bg-normal-alt)', border: '0.5px solid var(--m-line-neutral)',
      borderRadius: 'var(--m-radius-12)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--m-label-alternative)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent || 'var(--m-label-normal)', lineHeight: '32px', marginTop: 2 }}>
        {value}
      </div>
    </div>
  )
}

export function ViewToggle({ view, setView }: { view: View; setView: (v: View) => void }) {
  const opt = (id: View, Icon: typeof KanbanIcon, text: string) => {
    const on = view === id
    return (
      <button onClick={() => setView(id)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', border: 'none', borderRadius: 'var(--m-radius-8)',
          background: on ? 'var(--m-bg-normal)' : 'transparent',
          color: on ? 'var(--m-label-normal)' : 'var(--m-label-alternative)',
          boxShadow: on ? 'var(--m-shadow-xsmall)' : 'none',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          transition: 'background .15s, color .15s, box-shadow .15s',
        }}>
        <Icon size={16} /> {text}
      </button>
    )
  }
  return (
    <div style={{
      display: 'inline-flex', gap: 2, padding: 3,
      background: 'var(--m-fill-normal)', borderRadius: 'var(--m-radius-12)',
    }}>
      {opt('kanban', KanbanIcon, '칸반')}
      {opt('table', TableIcon, '테이블')}
    </div>
  )
}
