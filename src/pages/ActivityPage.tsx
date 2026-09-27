import { Filter, Download, Search, Activity, RefreshCw, X, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useActivityLog, FormattedActivity } from '@/hooks/useActivityLog'
import { AgentEventType } from '@/types'
import { Skeleton, GlassCard, Button } from '@/components/ui'

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  submitted: { icon: '✅', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'SUBMISSION' },
  matched: { icon: '🧠', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'MATCH_SCORE' },
  searched: { icon: '🔍', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', label: 'DISCOVERY' },
  generated_content: { icon: '📝', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'TAILOR_AI' },
  status_changed: { icon: '🔄', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'STATUS_SYNC' },
  captcha_detected: { icon: '⚠️', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'CAPTCHA' },
  quota_reached: { icon: '🛑', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'QUOTA' },
  error: { icon: '❌', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'ERROR' },
  skipped: { icon: '⏭️', color: 'text-neutral-400 bg-white/5 border-white/10', label: 'SKIPPED' },
  filled_field: { icon: '✍️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'FORM_FIELD' },
}

const filterTypes: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'All Events' },
  { key: 'searched', label: 'Discovery' },
  { key: 'matched', label: 'Match Scoring' },
  { key: 'generated_content', label: 'Resume Tailor' },
  { key: 'submitted', label: 'Submission' },
  { key: 'status_changed', label: 'Status Updates' },
  { key: 'captcha_detected', label: 'CAPTCHA' },
  { key: 'error', label: 'Errors' },
]

export function ActivityPage() {
  const { data: currentUser } = useCurrentUser()
  const { formattedActivities, isLoading, refetch } = useActivityLog(currentUser?.id, 100)

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string[]>(['ALL'])
  const [search, setSearch] = useState('')
  const [inspectEvent, setInspectEvent] = useState<FormattedActivity | null>(null)

  const filteredLogs = useMemo(() => {
    return formattedActivities.filter((event) => {
      // 1. Type filter
      if (!typeFilter.includes('ALL') && !typeFilter.includes(event.type)) {
        return false
      }

      // 2. Search query filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchMsg = event.message.toLowerCase().includes(q)
        const matchPlatform = event.platform.toLowerCase().includes(q)
        const matchType = event.type.toLowerCase().includes(q)
        if (!matchMsg && !matchPlatform && !matchType) return false
      }

      // 3. Date range filter
      if (dateRange !== 'all') {
        const eventDate = new Date(event.created_at).getTime()
        const now = Date.now()
        if (isNaN(eventDate)) return true

        if (dateRange === 'today' && now - eventDate > 24 * 60 * 60 * 1000) return false
        if (dateRange === 'week' && now - eventDate > 7 * 24 * 60 * 60 * 1000) return false
        if (dateRange === 'month' && now - eventDate > 30 * 24 * 60 * 60 * 1000) return false
      }

      return true
    })
  }, [formattedActivities, typeFilter, search, dateRange])

  const exportCsv = () => {
    if (filteredLogs.length === 0) return

    const headers = ['ID', 'Timestamp', 'Event Type', 'Message', 'Platform', 'Status']
    const rows = filteredLogs.map((log) => [
      log.id,
      log.created_at,
      log.type,
      `"${log.message.replace(/"/g, '""')}"`,
      log.platform,
      log.status,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `agent_activity_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activity Log</h1>
          <p className="text-neutral-400 text-sm">
            Live forensic audit trail and telemetry from all autonomous agent executions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={exportCsv}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by event message, platform, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10 text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="glass-input py-2 px-3 text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="today">Today (24h)</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="all">All History</option>
            </select>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
          {filterTypes.map((item) => (
            <button
              key={item.key}
              onClick={() =>
                setTypeFilter((prev) => {
                  if (item.key === 'ALL') return ['ALL']
                  const withoutAll = prev.filter((t) => t !== 'ALL')
                  if (withoutAll.includes(item.key)) {
                    const remaining = withoutAll.filter((t) => t !== item.key)
                    return remaining.length === 0 ? ['ALL'] : remaining
                  }
                  return [...withoutAll, item.key]
                })
              }
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                typeFilter.includes(item.key) || (typeFilter.includes('ALL') && item.key === 'ALL')
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                  : 'bg-white/[0.03] text-neutral-400 border-white/[0.06] hover:bg-white/[0.08]'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Activity Table */}
      <GlassCard className="overflow-hidden p-0 border border-white/[0.08]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-medium text-white">No activity events found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {search || !typeFilter.includes('ALL')
                ? 'No activity logs match your active filters.'
                : 'Your autonomous agents will log discovery, scoring, and submission events here as they execute.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                    Time
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">
                    Payload
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLogs.map((event) => {
                  const config = typeConfig[event.type] || {
                    icon: '📋',
                    color: 'text-neutral-400 bg-white/5 border-white/10',
                    label: event.type.toUpperCase(),
                  }

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-neutral-400 whitespace-nowrap">
                        {event.time}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border font-mono',
                            config.color
                          )}
                        >
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-neutral-200 max-w-md break-words">
                        {event.message}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-400 whitespace-nowrap">
                        {event.platform}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                            event.status === 'success' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                            event.status === 'warning' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                            event.status === 'error' && 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                            event.status === 'info' && 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          )}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectEvent(event)}
                          title="View JSON payload"
                          className="p-1.5 rounded-lg bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* JSON Payload Inspection Modal */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0d12] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-semibold text-white">Event Telemetry Payload</h3>
              </div>
              <button
                onClick={() => setInspectEvent(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-neutral-400">
                <div><span className="text-neutral-500">Event Type:</span> {inspectEvent.type}</div>
                <div><span className="text-neutral-500">Logged At:</span> {inspectEvent.created_at}</div>
                <div><span className="text-neutral-500">Platform:</span> {inspectEvent.platform}</div>
                <div><span className="text-neutral-500">Status:</span> {inspectEvent.status}</div>
              </div>
            </div>

            <div className="bg-black/70 rounded-xl p-4 border border-white/[0.06] overflow-x-auto max-h-80">
              <pre className="font-mono text-xs text-neutral-300">
                {JSON.stringify(inspectEvent.payload, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setInspectEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}