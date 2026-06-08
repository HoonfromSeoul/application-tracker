import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  size?: 'sm' | 'md'
}

export function EmptyState({ icon, title, description, action, size = 'md' }: EmptyStateProps) {
  const pad = size === 'sm' ? '32px 24px' : '64px 24px'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: pad, textAlign: 'center',
      color: 'var(--m-label-alternative)',
    }}>
      {icon && (
        <div style={{
          width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--m-radius-pill)', background: 'var(--m-fill-normal)',
          color: 'var(--m-label-alternative)',
        }}>
          {icon}
        </div>
      )}
      <div style={{
        fontSize: size === 'sm' ? 14 : 15, fontWeight: 700, color: 'var(--m-label-normal)',
      }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 13, lineHeight: '20px', maxWidth: 360 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  )
}
