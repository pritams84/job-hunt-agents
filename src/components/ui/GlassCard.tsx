import React from 'react'
import { clsx } from 'clsx'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'glow' | 'interactive' | 'solid'
  className?: string
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const baseStyles = 'rounded-xl border backdrop-blur-md transition-all duration-300'

  const variantStyles = {
    default: 'bg-neutral-900/60 border-white/[0.08] shadow-xl',
    glow: 'bg-neutral-900/70 border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.12)]',
    interactive:
      'bg-neutral-900/50 border-white/[0.08] hover:border-white/[0.18] hover:bg-neutral-900/80 cursor-pointer shadow-lg hover:shadow-2xl hover:translate-y-[-2px]',
    solid: 'bg-neutral-950 border-neutral-800 shadow-xl',
  }

  return (
    <div className={clsx(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </div>
  )
}
