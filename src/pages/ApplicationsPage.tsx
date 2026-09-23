import { SendHorizonal, Clock, CheckCircle, MessageSquare, Award, Archive, Search, Filter, ChevronDown, MoreHorizontal, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const columns = [
  { id: 'discovered', title: 'Discovered', color: 'text-status-discovered', icon: SendHorizonal },
  { id: 'matched', title: 'AI Matched', color: 'text-status-matched', icon: CheckCircle },
  { id: 'queued', title: 'In Queue', color: 'text-status-queued', icon: Clock },
  { id: 'applied', title: 'Applied', color: 'text-status-applied', icon: SendHorizonal },
  { id: 'interviewing', title: 'Interviewing', color: 'text-status-interview', icon: MessageSquare },
  { id: 'offer', title: 'Offers', color: 'text-status-offer', icon: Award },
  { id: 'rejected', title: 'Archived', color: 'text-status-rejected', icon: Archive },
]

const applications = [
  { id: '1', company: 'Stripe', title: 'Senior Frontend Engineer', platform: 'LinkedIn', score: 92, salary: '$180K-$250K', date: '2026-09-20', status: 'applied' },
  { id: '2', company: 'Vercel', title: 'Lead Frontend Architect', platform: 'Greenhouse', score: 89, salary: '$200K-$300K', date: '2026-09-19', status: 'interviewing' },
  { id: '3', company: 'Linear', title: 'Staff Product Engineer', platform: 'Lever', score: 87, salary: '$170K-$240K', date: '2026-09-18', status: 'applied' },
  { id: '4', company: 'Ramp', title: 'Senior Backend Engineer', platform: 'LinkedIn', score: 85, salary: '$180K-$260K', date: '2026-09-18', status: 'applied' },
  { id: '5', company: 'Notion', title: 'Full Stack Engineer', platform: 'Greenhouse', score: 83, salary: '$160K-$230K', date: '2026-09-17', status: 'matched' },
  { id: '6', company: 'Figma', title: 'Frontend Platform Engineer', platform: 'Lever', score: 91, salary: '$190K-$270K', date: '2026-09-17', status: 'applied' },
  { id: '7', company: 'OpenAI', title: 'ML Engineer', platform: 'LinkedIn', score: 78, salary: '$200K-$350K', date: '2026-09-16', status: 'needs_review' },
  { id: '8', company: 'Anthropic', title: 'Research Engineer', platform: 'Greenhouse', score: 82, salary: '$190K-$280K', date: '2026-09-16', status: 'queued' },
]

export function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'table'>('kanban')

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      discovered: 'text-status-discovered',
      matched: 'text-status-matched',
      queued: 'text-status-queued',
      applied: 'text-status-applied',
      needs_review: 'text-status-needs-review',
      interviewing: 'text-status-interview',
      offer: 'text-status-offer',
      rejected: 'text-status-rejected',
      failed: 'text-status-failed',
    }
    return colors[status] || 'text-text-muted'
  }

  const getStatusLabel = (status: string) => {
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

  const appsByStatus = columns.map(col => ({
    ...col,
    apps: applications.filter(app => app.status === col.id)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Applications Pipeline</h1>
          <p className="text-text-secondary text-sm">Track every application from discovery to offer</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setView('kanban')}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', view === 'kanban' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary')}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('table')}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', view === 'table' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary')}
          >
            Table
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card-glass p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary px-4 py-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="btn-secondary px-4 py-2 flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              Sort
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {appsByStatus.map((column) => (
            <div key={column.id} className="w-80 flex-shrink-0 flex flex-col">
              <div className="card-glass p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <column.icon className={cn('w-4 h-4', column.color)} />
                    <h3 className="font-semibold text-text-primary">{column.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono tabular-nums text-text-secondary">
                    {column.apps.length}
                  </span>
                </div>
              </div>
              <div className="card-glass p-2 flex-1 min-h-[400px] space-y-3 overflow-y-auto">
                {column.apps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-bg-surface/50 rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-colors group relative"
                    draggable
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{app.title}</p>
                        <p className="text-sm text-text-secondary truncate">{app.company}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-text-muted">{app.platform}</span>
                          <span className={cn('px-1.5 py-0.5 rounded font-mono tabular-nums', getStatusColor(app.status))}>
                            {app.score}%
                          </span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-mono tabular-nums text-accent-secondary">{app.salary}</span>
                      <span className="text-text-muted">{new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
                {column.apps.length === 0 && (
                  <div className="text-center py-8 text-text-muted text-sm">
                    <column.icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No applications
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="card-glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['', 'Title', 'Company', 'Status', 'Match', 'Salary', 'Platform', 'Date', ''].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3"><GripVertical className="w-4 h-4 text-text-muted cursor-grab" /></td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{app.title}</p>
                    <p className="text-xs text-text-secondary">{app.company}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(app.status))}>
                      {getStatusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-accent-secondary">{app.score}%</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-accent-secondary">{app.salary}</td>
                  <td className="px-4 py-3 text-text-secondary">{app.platform}</td>
                  <td className="px-4 py-3 text-text-muted">{new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3"><button className="btn-ghost p-1"><MoreHorizontal className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}