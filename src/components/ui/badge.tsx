import type * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'positive' | 'warning' | 'danger' | 'ink'
}

export function Badge({ children, tone = 'neutral', className = '', ...props }: BadgeProps) {
  const tones = {
    neutral: 'bg-[var(--bg-elev-2)] text-[var(--text-2)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)]',
    positive: 'bg-[var(--positive-bg)] text-[var(--positive)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
    ink: 'bg-[var(--accent)] text-[var(--accent-fg)]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.01em] leading-[1.2] ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
