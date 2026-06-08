import { useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { ArrowUpRightIcon, ChevronDownIcon, LinkIcon } from './icons'

// "Looks like" detection — covers raw domains (linkedin.com/jobs/...) and full URLs.
export function looksLikeUrl(v: string): boolean {
  const s = (v || '').trim()
  if (!s) return false
  if (/^https?:\/\//i.test(s)) return true
  return /^[\w-]+(\.[\w-]+)+(\/|$)/.test(s)
}

// Add https:// when the user typed a bare domain.
export function normalizeUrl(v: string): string {
  const s = (v || '').trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : 'https://' + s
}

export const inputBase: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', fontSize: 14,
  color: 'var(--m-label-normal)', background: 'var(--m-bg-normal)',
  border: '0.5px solid var(--m-line-normal)', borderRadius: 'var(--m-radius-8)',
  outline: 'none', lineHeight: '20px',
}

const fieldLabel: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: 'var(--m-label-alternative)', marginBottom: 6,
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', minWidth: 0 }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, icon: Icon }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: ComponentType<{ size?: number; style?: CSSProperties }>
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {Icon && <Icon size={16} style={{ position: 'absolute', left: 11, color: 'var(--m-label-assistive)' }} />}
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          ...inputBase,
          paddingLeft: Icon ? 34 : 12,
          borderColor: focus ? 'var(--m-primary-normal)' : 'var(--m-line-normal)',
          boxShadow: focus ? '0 0 0 3px var(--m-blue-95)' : 'none',
        }}
      />
    </div>
  )
}

// URL input — link icon on the left, ↗ open-in-new-tab on the right when value looks like a URL.
export function UrlInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [focus, setFocus] = useState(false)
  const open = looksLikeUrl(value)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <LinkIcon size={16} style={{ position: 'absolute', left: 11, color: 'var(--m-label-assistive)' }} />
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          ...inputBase,
          paddingLeft: 34, paddingRight: open ? 38 : 12,
          borderColor: focus ? 'var(--m-primary-normal)' : 'var(--m-line-normal)',
          boxShadow: focus ? '0 0 0 3px var(--m-blue-95)' : 'none',
        }}
      />
      {open && (
        <a
          href={normalizeUrl(value)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="새 탭에서 열기"
          title="새 탭에서 열기"
          className="ktrack-iconbtn"
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 'var(--m-radius-8)',
            color: 'var(--m-primary-strong)', textDecoration: 'none',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ArrowUpRightIcon size={16} />
        </a>
      )}
    </div>
  )
}

export function Select<T extends string>({ value, onChange, options }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={(e) => onChange(e.target.value as T)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          ...inputBase, appearance: 'none', cursor: 'pointer', paddingRight: 34,
          borderColor: focus ? 'var(--m-primary-normal)' : 'var(--m-line-normal)',
          boxShadow: focus ? '0 0 0 3px var(--m-blue-95)' : 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDownIcon size={16} style={{
        position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--m-label-alternative)', pointerEvents: 'none',
      }} />
    </div>
  )
}
