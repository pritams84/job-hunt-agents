import React from 'react'
import { clsx } from 'clsx'

export interface AgentPulseProps {
  status?: 'idle' | 'active' | 'warning' | 'error' | 'stopped'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export const AgentPulse: React.FC<AgentPulseProps> = ({
  status = 'active',
  size = 'md',
  label,
  className,
}) => {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  const pingSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  const statusColors = {
    active: 'bg-emerald-400',
    idle: 'bg-indigo-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-500',
    stopped: 'bg-neutral-500',
  }

  const pingColors = {
    active: 'bg-emerald-400/75',
    idle: 'bg-indigo-400/75',
    warning: 'bg-amber-400/75',
    error: 'bg-rose-500/75',
    stopped: 'bg-neutral-500/50',
  }

  return (
    <div className={clsx('inline-flex items-center gap-2 select-none', className)}>
      <span className="relative flex items-center justify-center">
        {status !== 'stopped' && (
          <span
            className={clsx(
              'absolute inline-flex rounded-full animate-ping opacity-75',
              pingSizes[size],
              pingColors[status]
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full',
            dotSizes[size],
            statusColors[status]
          )}
        />
      </span>
      {label && <span className="text-xs font-medium text-neutral-300">{label}</span>}
    </div>
  )
}
