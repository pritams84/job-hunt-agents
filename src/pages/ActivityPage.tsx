import { Filter, Download, Search, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const events = [
  { time: '14:22:15', type: 'APPLICATION_SUBMIT', message: 'Submitted application to Stripe — Senior Frontend Engineer', platform: 'Greenhouse', status: 'success' },
  { time: '14:22:08', type: 'RESUME_TAILOR', message: 'Generated tailored resume for Vercel — Lead Frontend Architect', platform: 'System', status: 'info' },
  { time: '14:22:04', type: 'MATCH_SCORING', message: 'Match score: 92% — Stripe Senior Frontend Engineer', platform: 'LinkedIn', status: 'info' },
  { time: '14:22:01', type: 'DISCOVERY', message: 'Scanned Greenhouse board — 23 new listings', platform: 'Greenhouse', status: 'info' },
  { time: '14:21:45', type: 'DISCOVERY', message: 'Scanned Lever board — 12 new listings', platform: 'Lever', status: 'info' },
  { time: '14:21:32', type: 'MATCH_SCORING', message: 'Match score: 87% — Vercel Lead Frontend Architect', platform: 'LinkedIn', status: 'info' },
  { time: '14:21:10', type: 'APPLICATION_SUBMIT', message: 'Submitted application to Linear — Staff Product Engineer', platform: 'Lever', status: 'success' },
  { time: '14:20:55', type: 'MATCH_SCORING', message: 'Match score: 85% — Ramp Senior Backend Engineer', platform: 'LinkedIn', status: 'info' },
  { time: '14:20:30', type: 'DISCOVERY', message: 'Scanned LinkedIn Jobs — 45 new listings', platform: 'LinkedIn', status: 'info' },
  { time: '14:19:45', type: 'CAPTCHA_DETECTED', message: 'CAPTCHA detected on Workday — Human review required', platform: 'Workday', status: 'warning' },
  { time: '14:19:20', type: 'ERROR', message: 'Rate limit hit on LinkedIn — Backing off 60s', platform: 'LinkedIn', status: 'error' },
  { time: '14:18:50', type: 'APPLICATION_SUBMIT', message: 'Submitted application to Notion — Full Stack Engineer', platform: 'Greenhouse', status: 'success' },
]

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  DISCOVERY: { icon: '🔍', color: 'text-accent-secondary', label: 'DISCOVERY' },
  MATCH_SCORING: { icon: '🧠', color: 'text-accent-primary', label: 'MATCH' },
  RESUME_TAILOR: { icon: '📝', color: 'text-accent-ai', label: 'TAILOR' },
  APPLICATION_SUBMIT: { icon: '✅', color: 'text-accent-cta', label: 'SUBMIT' },
  CAPTCHA_DETECTED: { icon: '⚠️', color: 'text-accent-warning', label: 'CAPTCHA' },
  ERROR: { icon: '❌', color: 'text-accent-danger', label: 'ERROR' },
}

export function ActivityPage() {
  const [dateRange, setDateRange] = useState('today')
  const [typeFilter, setTypeFilter] = useState<string[]>(['ALL'])
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
        <p className="text-text-secondary text-sm">Full audit trail of everything your AI agents did</p>
      </div>

      {/* Filters */}
      <div className="card-glass p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="glass-input py-2 px-3 text-sm" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <button className="btn-secondary px-4 py-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Event Types
            </button>
            <button className="btn-secondary px-4 py-2 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'DISCOVERY', 'MATCH_SCORING', 'RESUME_TAILOR', 'APPLICATION_SUBMIT', 'CAPTCHA_DETECTED', 'ERROR'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(prev => {
                if (prev.includes('ALL')) return [type]
                if (prev.includes(type)) return prev.filter(t => t !== type)
                return [...prev, type]
              })}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                typeFilter.includes(type) || (typeFilter.includes('ALL') && type === 'ALL')
                  ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Table */}
      <div className="card-glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Time', 'Event Type', 'Description', 'Platform', 'Status', 'Payload'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events
              .filter(e => typeFilter.includes('ALL') || typeFilter.includes(e.type))
              .filter(e => search === '' || e.message.toLowerCase().includes(search.toLowerCase()))
              .map((event, idx) => {
                const config = typeConfig[event.type] || { icon: '📋', color: 'text-text-muted', label: event.type }
                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-sm text-text-secondary">{event.time}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-1 rounded text-xs font-medium font-mono', config.color)}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary max-w-md truncate">{event.message}</td>
                    <td className="px-4 py-3 text-text-secondary">{event.platform}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                        event.status === 'success' && 'bg-accent-cta/20 text-accent-cta',
                        event.status === 'warning' && 'bg-accent-warning/20 text-accent-warning',
                        event.status === 'error' && 'bg-accent-danger/20 text-accent-danger',
                        event.status === 'info' && 'bg-accent-secondary/20 text-accent-secondary'
                      )}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="btn-ghost p-1 text-text-muted hover:text-text-primary">
                        <Activity className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}