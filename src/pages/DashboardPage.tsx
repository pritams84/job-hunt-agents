import { Briefcase, SendHorizonal, TrendingUp, Users, Clock, AlertTriangle, Play, Pause, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const stats = [
  { label: 'Jobs Discovered Today', value: '142', change: '+18%', icon: Briefcase, color: 'text-accent-secondary' },
  { label: 'Auto-Applications Sent', value: '28', change: '22/50 daily', icon: SendHorizonal, color: 'text-accent-cta' },
  { label: 'Interview Invites', value: '4', change: '14.2% conversion', icon: Users, color: 'text-accent-primary' },
  { label: 'Active Agent Hours', value: '6.4', change: 'Autopilot running', icon: Clock, color: 'text-accent-ai' },
]

const agentLogs = [
  { time: '14:22:01', type: 'DISCOVERY', message: 'Scanned Greenhouse board — 23 new listings', platform: 'Greenhouse' },
  { time: '14:22:04', type: 'MATCH_SCORING', message: 'Match score: 92% — Senior Frontend @ Stripe', platform: 'LinkedIn' },
  { time: '14:22:08', type: 'RESUME_TAILOR', message: 'Tailoring PDF for application #1847', platform: 'System' },
  { time: '14:22:15', type: 'APPLICATION_SUBMIT', message: 'Submitted ✓ Proof captured', platform: 'Greenhouse' },
  { time: '14:22:18', type: 'RATE_LIMIT', message: 'Waiting next batch — 45s', platform: 'Orchestrator' },
  { time: '14:21:45', type: 'DISCOVERY', message: 'Scanned Lever board — 12 new listings', platform: 'Lever' },
  { time: '14:21:32', type: 'MATCH_SCORING', message: 'Match score: 87% — Backend Engineer @ Vercel', platform: 'LinkedIn' },
  { time: '14:21:10', type: 'APPLICATION_SUBMIT', message: 'Submitted ✓ Proof captured', platform: 'Lever' },
]

const pendingReviews = [
  { id: '1', company: 'Stripe', title: 'Senior Full Stack Engineer', score: 82, reason: 'Verify salary expectation', platform: 'Greenhouse' },
  { id: '2', company: 'Vercel', title: 'Lead Frontend Architect', score: 89, reason: 'Custom essay answer required', platform: 'LinkedIn' },
  { id: '3', company: 'Linear', title: 'Staff Product Engineer', score: 78, reason: 'Portfolio URL needed', platform: 'Lever' },
]

export function DashboardPage() {
  const [agentRunning, setAgentRunning] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const [logFilter, setLogFilter] = useState<string>('ALL')

  const typeColors: Record<string, string> = {
    DISCOVERY: 'text-accent-secondary',
    MATCH_SCORING: 'text-accent-primary',
    RESUME_TAILOR: 'text-accent-ai',
    APPLICATION_SUBMIT: 'text-accent-cta',
    RATE_LIMIT: 'text-accent-warning',
  }

  return (
    <div className="space-y-6">
      {/* Agent Control Bar */}
      <div className="card-glass p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-medium',
            agentRunning
              ? 'bg-accent-cta/10 text-accent-cta border border-accent-cta/30'
              : 'bg-accent-warning/10 text-accent-warning border border-accent-warning/30'
          )}>
            <span className={cn('w-2 h-2 rounded-full', agentRunning ? 'bg-accent-cta animate-pulse' : 'bg-accent-warning')} />
            {agentRunning ? 'Agent Running: Autopilot Mode' : 'Agent Paused'}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 font-mono text-sm">
            <span className="text-text-secondary">Today's Quota:</span>
            <span className="font-bold text-text-primary">24 / 50</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value="conservative"
            className="glass-input py-2 px-3 text-sm w-auto"
            aria-label="Autonomy mode"
          >
            <option value="conservative">Conservative (≥85% auto-apply)</option>
            <option value="aggressive">Aggressive (≥70% auto-apply)</option>
          </select>
          <button
            onClick={() => setAgentRunning(!agentRunning)}
            className={cn('btn-secondary px-4 py-2', agentRunning ? '' : 'bg-accent-cta/10 text-accent-cta border-accent-cta/30')}
          >
            {agentRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Resume
              </>
            )}
          </button>
          <button className="btn-ghost p-2 text-accent-danger hover:bg-accent-danger/10" title="Emergency Stop">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold font-mono tabular-nums text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.change}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `${stat.color}/20`)}>
                <stat.icon className="w-5 h-5" style={{ color: `var(--${stat.color.replace('text-', '')})` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Funnel + Chart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pipeline Funnel */}
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Application Pipeline</h3>
            <div className="space-y-3">
              {[
                { stage: 'Discovered', count: 142, color: 'var(--status-discovered)' },
                { stage: 'AI Matched', count: 28, color: 'var(--status-matched)' },
                { stage: 'Tailored', count: 24, color: 'var(--status-queued)' },
                { stage: 'Applied', count: 18, color: 'var(--status-applied)' },
                { stage: 'Screening', count: 6, color: 'var(--status-needs-review)' },
                { stage: 'Interview', count: 4, color: 'var(--status-interview)' },
              ].map((funnel, idx) => (
                <div key={funnel.stage} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{funnel.stage}</span>
                    <span className="text-sm font-mono tabular-nums text-text-secondary">{funnel.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(funnel.count / 142) * 100}%`, backgroundColor: funnel.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Activity Chart Placeholder */}
          <div className="card-glass p-6 h-64 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Daily Activity Chart</p>
              <p className="text-sm mt-1">(Recharts - lazy loaded)</p>
            </div>
          </div>
        </div>

        {/* Right: Agent Terminal Stream */}
        <div className="lg:col-span-4">
          <div className="card-glass p-0 overflow-hidden h-[500px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-cta animate-pulse" />
                Agent Stream
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="glass-input py-1 px-2 text-xs w-auto"
                >
                  <option value="ALL">ALL</option>
                  <option value="DISCOVERY">DISCOVERY</option>
                  <option value="MATCH_SCORING">MATCH_SCORING</option>
                  <option value="RESUME_TAILOR">RESUME_TAILOR</option>
                  <option value="APPLICATION_SUBMIT">APPLICATION_SUBMIT</option>
                  <option value="RATE_LIMIT">RATE_LIMIT</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-3 h-3 rounded accent-accent-primary"
                  />
                  Auto-scroll
                </label>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
              {agentLogs
                .filter(log => logFilter === 'ALL' || log.type === logFilter)
                .map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-text-secondary group hover:text-text-primary">
                    <span className="text-text-muted flex-shrink-0">{log.time}</span>
                    <span className={cn('font-medium flex-shrink-0', typeColors[log.type])}>[{log.type}]</span>
                    <span className="text-text-primary flex-1 min-w-0 truncate">{log.message}</span>
                    <span className="text-text-muted flex-shrink-0">{log.platform}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent-warning" />
            Pending Human Review (3)
          </h3>
          <span className="text-sm text-text-muted">Requires your attention</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingReviews.map((job) => (
            <div key={job.id} className="card-glass p-4 border border-accent-warning/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-text-primary">{job.title}</p>
                  <p className="text-sm text-text-secondary">{job.company}</p>
                </div>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-bold font-mono tabular-nums',
                  job.score >= 85 ? 'bg-accent-cta/20 text-accent-cta' : 'bg-accent-warning/20 text-accent-warning'
                )}>
                  {job.score}%
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3 flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-white/5 text-xs">{job.platform}</span>
                <span className="text-accent-warning">{job.reason}</span>
              </p>
              <div className="flex gap-2">
                <button className="btn-cta flex-1 py-2 text-sm">Approve</button>
                <button className="btn-secondary flex-1 py-2 text-sm">Skip</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}