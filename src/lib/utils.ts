import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(min: number | null, max: number | null, currency = 'USD'): string {
  if (!min && !max) return 'Not specified'
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })
  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`
  if (min) return `${formatter.format(min)}+`
  return `Up to ${formatter.format(max!)}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    discovered: 'var(--status-discovered)',
    matched: 'var(--status-matched)',
    queued: 'var(--status-queued)',
    applied: 'var(--status-applied)',
    needs_review: 'var(--status-needs-review)',
    interviewing: 'var(--status-interview)',
    offer: 'var(--status-offer)',
    rejected: 'var(--status-rejected)',
    failed: 'var(--status-failed)',
  }
  return colors[status] || 'var(--text-muted)'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    discovered: 'Discovered',
    matched: 'AI Matched',
    queued: 'In Queue',
    applied: 'Applied',
    needs_review: 'Needs Review',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
    failed: 'Failed',
  }
  return labels[status] || status
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length - 3) + '...'
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}