import React from 'react'
import { clsx } from 'clsx'
import { ApplicationStatus } from '../../types'

export interface StatusBadgeProps {
  status: ApplicationStatus | string
  size?: 'sm' | 'md'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    discovered: {
      label: 'Discovered',
      bg: 'bg-neutral-800/80',
      text: 'text-neutral-300',
      border: 'border-neutral-700',
    },
    matched: {
      label: 'Matched',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    needs_review: {
      label: 'Needs Review',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    queued: {
      label: 'Queued',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
    },
    applied: {
      label: 'Applied',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    viewed: {
      label: 'Viewed',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    interview: {
      label: 'Interview',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    offer: {
      label: 'Offer',
      bg: 'bg-green-500/20',
      text: 'text-green-300 font-semibold',
      border: 'border-green-400/50',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-neutral-900',
      text: 'text-neutral-400',
      border: 'border-neutral-800',
    },
    failed: {
      label: 'Failed',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
    },
    withdrawn: {
      label: 'Withdrawn',
      bg: 'bg-neutral-800',
      text: 'text-neutral-500',
      border: 'border-neutral-700',
    },
  }

  const current = configs[status] || {
    label: status.replace('_', ' '),
    bg: 'bg-neutral-800',
    text: 'text-neutral-300',
    border: 'border-neutral-700',
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border backdrop-blur-sm uppercase tracking-wider',
        sizeClasses[size],
        current.bg,
        current.text,
        current.border,
        className
      )}
    >
      {current.label}
    </span>
  )
}
