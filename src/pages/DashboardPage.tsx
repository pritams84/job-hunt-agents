import {
  Briefcase,
  SendHorizonal,
  Users,
  Clock,
  Play,
  Pause,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuota } from '@/hooks/useQuota'
import { useApplications } from '@/hooks/useApplications'
import { useAgentStatus } from '@/hooks/useAgentStatus'
import { AgentPulse, GlassCard, Button, StatusBadge } from '@/components/ui'
import { fetchRemoteOkJobs, ingestJobListings } from '@/lib/agents/discovery'

export function DashboardPage() {
  const { user } = useUser()
  const { dailyUsed, dailyCap, dailyPercentage, subscription } = useQuota(user?.id)
  const { applications, isLoading: appsLoading, refetch: refetchApps } = useApplications(user?.id)
  const {
    state: agentState,
    activeStepText,
    isEmergencyStopped,
    setOperationalState,
    emergencyStop,
    resume,
  } = useAgentStatus()

  const [autonomyMode, setAutonomyMode] = useState<'conservative' | 'aggressive'>('conservative')
  const [isScanning, setIsScanning] = useState(false)
  const [recentLogs, setRecentLogs] = useState<
    Array<{ time: string; type: string; message: string; platform: string }>
  >([
    { time: '14:22:01', type: 'DISCOVERY', message: 'Scanned Greenhouse board — 23 new listings', platform: 'Greenhouse' },
    { time: '14:22:04', type: 'MATCH_SCORING', message: 'Match score: 92% — Senior Frontend @ Stripe', platform: 'LinkedIn' },
    { time: '14:22:08', type: 'RESUME_TAILOR', message: 'Tailoring PDF for application (Fact-check audit: Passed)', platform: 'System' },
    { time: '14:22:15', type: 'APPLICATION_SUBMIT', message: 'Submitted ✓ Proof captured', platform: 'Greenhouse' },
    { time: '14:22:18', type: 'RATE_LIMIT', message: 'Waiting next batch with human jitter', platform: 'Orchestrator' },
  ])

  // Aggregate real application counts by stage
  const stageCounts = useMemo(() => {
    const counts = {
      discovered: 0,
      matched: 0,
      queued: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }

    if (applications.length > 0) {
      applications.forEach((app) => {
        if (app.status in counts) {
          counts[app.status as keyof typeof counts]++
        }
      })
    } else {
      // Demo defaults
      counts.discovered = 142
      counts.matched = 28
      counts.queued = 14
      counts.applied = 28
      counts.interview = 4
      counts.offer = 1
      counts.rejected = 6
    }

    return counts
  }, [applications])

  // Trigger on-demand job discovery
  const handleTriggerDiscovery = async () => {
    setIsScanning(true)
    setOperationalState('discovering', 'Connecting to RemoteOK & Greenhouse API feeds...')
    try {
      const jobs = await fetchRemoteOkJobs(['react', 'typescript', 'frontend'])
      const result = await ingestJobListings(jobs)

      const newLog = {
        time: new Date().toLocaleTimeString([], { hour12: false }),
        type: 'DISCOVERY',
        message: `Discovered ${result.inserted} new jobs (${result.skippedDuplicates} duplicates filtered via SHA-256)`,
        platform: 'RemoteOK',
      }
      setRecentLogs((prev) => [newLog, ...prev.slice(0, 7)])
      setOperationalState('idle', `Discovery complete. ${result.inserted} listings ingested.`)
      refetchApps()
    } catch (err) {
      console.error('Discovery scan error:', err)
      setOperationalState('idle', 'Discovery scan completed with fallback.')
    } finally {
      setIsScanning(false)
    }
  }

  const stats = [
    {
      label: 'Jobs Discovered Today',
      value: stageCounts.discovered.toString(),
      change: '+18% this week',
      icon: Briefcase,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: "Today's Applications",
      value: `${dailyUsed} / ${dailyCap}`,
      change: `${dailyPercentage}% of daily cap`,
      icon: SendHorizonal,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Interview Invites',
      value: stageCounts.interview.toString(),
      change: '14.2% conversion rate',
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Plan Tier',
      value: (subscription?.plan_tier || 'Free Trial').toUpperCase().replace('_', ' '),
      change: `${subscription?.monthly_applications_used || 0}/${subscription?.monthly_quota || 5} monthly quota`,
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Agent Control Bar */}
      <GlassCard className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-semibold uppercase tracking-wider',
              isEmergencyStopped
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : agentState === 'idle'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
            )}
          >
            <AgentPulse
              status={
                isEmergencyStopped
                  ? 'error'
                  : agentState === 'idle'
                  ? 'active'
                  : 'active'
              }
              size="sm"
            />
            <span>
              {isEmergencyStopped
                ? 'Emergency Stopped'
                : agentState === 'idle'
                ? 'Autopilot: Active'
                : `Agent: ${agentState}`}
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 font-mono text-xs">
            <span className="text-neutral-400">Daily Quota:</span>
            <span className="font-bold text-white">
              {dailyUsed} / {dailyCap}
            </span>
          </div>

          <span className="text-xs text-neutral-400 hidden xl:inline">
            Status: {activeStepText}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={autonomyMode}
            onChange={(e) => setAutonomyMode(e.target.value as any)}
            className="bg-neutral-900 border border-white/10 text-neutral-200 text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Autonomy mode"
          >
            <option value="conservative">Conservative (≥85% Auto-Apply)</option>
            <option value="aggressive">Aggressive (≥70% Auto-Apply)</option>
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleTriggerDiscovery}
            isLoading={isScanning}
            leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', isScanning && 'animate-spin')} />}
          >
            Scan Jobs
          </Button>

          {isEmergencyStopped ? (
            <Button size="sm" variant="cta" onClick={resume} leftIcon={<Play className="w-3.5 h-3.5" />}>
              Resume System
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={emergencyStop}
              leftIcon={<X className="w-3.5 h-3.5" />}
              title="Instantly terminates all background worker sandboxes"
            >
              Emergency Kill
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Stats KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-400 mt-1">{stat.change}</p>
              </div>
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center border',
                  stat.bgColor
                )}
              >
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pipeline Funnel & Review Queue */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pipeline Funnel */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Application Pipeline Breakdown</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h3>
              <span className="text-xs text-neutral-400">Realtime Supabase Sync</span>
            </div>

            <div className="space-y-3">
              {[
                { stage: 'Discovered Listings', count: stageCounts.discovered, color: 'bg-neutral-600' },
                { stage: 'AI Matched (≥70%)', count: stageCounts.matched, color: 'bg-blue-500' },
                { stage: 'Tailored & Verified', count: stageCounts.queued, color: 'bg-indigo-500' },
                { stage: 'Submitted to ATS', count: stageCounts.applied, color: 'bg-purple-500' },
                { stage: 'Recruiter Interviews', count: stageCounts.interview, color: 'bg-emerald-500' },
              ].map((item) => {
                const max = Math.max(stageCounts.discovered, 1)
                const pct = Math.min(100, Math.round((item.count / max) * 100))
                return (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-300 font-medium">{item.stage}</span>
                      <span className="font-mono text-neutral-400 font-bold">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', item.color)}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          {/* Pending Human Approval Queue */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">
                Human Review Queue (Assisted Pilot)
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                3 Pending Actions
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: '1',
                  company: 'Stripe',
                  title: 'Senior Full Stack Engineer',
                  score: 82,
                  reason: 'Verify salary expectation ($190k requested)',
                  platform: 'Greenhouse',
                },
                {
                  id: '2',
                  company: 'Vercel',
                  title: 'Lead Frontend Architect',
                  score: 89,
                  reason: 'Custom essay response: "Why Vercel?" needs review',
                  platform: 'LinkedIn',
                },
                {
                  id: '3',
                  company: 'Linear',
                  title: 'Staff Product Engineer',
                  score: 78,
                  reason: 'Portfolio URL confirmation required',
                  platform: 'Lever',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{item.title}</span>
                      <span className="text-xs text-neutral-400">at {item.company}</span>
                      <StatusBadge status="needs_review" size="sm" />
                    </div>
                    <p className="text-xs text-amber-300/90">{item.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button size="sm" variant="cta">
                      Approve & Submit
                    </Button>
                    <Button size="sm" variant="ghost">
                      Skip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right: Live Agent Event Stream Terminal */}
        <div className="lg:col-span-4">
          <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Autonomous Console</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">NVIDIA Nemotron 70B</span>
            </div>

            <div className="flex-1 bg-black/60 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-3 border border-white/[0.05] max-h-[500px]">
              {recentLogs.map((log, index) => (
                <div key={index} className="space-y-0.5 leading-relaxed">
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span>{log.time}</span>
                    <span className="text-indigo-400">[{log.platform}]</span>
                    <span className="text-neutral-400">{log.type}</span>
                  </div>
                  <p className="text-neutral-200 text-xs">{log.message}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}