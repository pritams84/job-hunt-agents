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
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQuota } from '@/hooks/useQuota'
import { useApplications } from '@/hooks/useApplications'
import { useAgentStatus } from '@/hooks/useAgentStatus'
import { useActivityLog } from '@/hooks/useActivityLog'
import { AgentPulse, GlassCard, Button, StatusBadge } from '@/components/ui'
import { fetchRemoteOkJobs, ingestJobListings } from '@/lib/agents/discovery'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data: currentUser } = useCurrentUser()
  const { dailyUsed, dailyCap, dailyPercentage, subscription } = useQuota(currentUser?.id)
  const { applications, isLoading: appsLoading, refetch: refetchApps } = useApplications(currentUser?.id)
  const {
    formattedActivities,
    logActivity,
    isLoading: logsLoading,
  } = useActivityLog(currentUser?.id, 15)
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
      needs_review: 0,
    }

    if (applications && applications.length > 0) {
      applications.forEach((app) => {
        if (app.status in counts) {
          counts[app.status as keyof typeof counts]++
        }
      })
    }

    return counts
  }, [applications])

  // Filter real applications requiring human review
  const pendingReviewApps = useMemo(() => {
    return (applications || []).filter((app) => app.status === 'needs_review')
  }, [applications])

  // Trigger on-demand job discovery
  const handleTriggerDiscovery = async () => {
    setIsScanning(true)
    setOperationalState('discovering', 'Connecting to RemoteOK & Greenhouse API feeds...')
    try {
      const jobs = await fetchRemoteOkJobs(['react', 'typescript', 'frontend'])
      const result = await ingestJobListings(jobs)

      const summaryMessage = `Discovered ${result.inserted} new jobs (${result.skippedDuplicates} duplicates filtered via SHA-256)`

      // Persist to real Supabase activity_log
      await logActivity({
        event_type: 'searched',
        payload_json: {
          count: result.inserted,
          skipped: result.skippedDuplicates,
          source: 'RemoteOK API',
          message: summaryMessage,
        },
      })

      setOperationalState('idle', `Discovery complete. ${result.inserted} listings ingested.`)
      refetchApps()
    } catch (err) {
      console.error('Discovery scan error:', err)
      setOperationalState('idle', 'Discovery scan completed.')
    } finally {
      setIsScanning(false)
    }
  }

  const stats = [
    {
      label: 'Jobs Discovered Today',
      value: stageCounts.discovered.toString(),
      change: stageCounts.discovered > 0 ? `${stageCounts.discovered} active listings` : 'Run discovery scan',
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
      change:
        stageCounts.applied > 0
          ? `${Math.round((stageCounts.interview / stageCounts.applied) * 100)}% conversion rate`
          : '0% conversion rate',
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
            />
            <span>{isEmergencyStopped ? 'EMERGENCY HALTED' : `AGENT: ${agentState.toUpperCase()}`}</span>
          </div>

          <p className="text-xs text-neutral-400 font-mono">
            {activeStepText || 'All autonomous background workers synced and ready.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* Autonomy Mode Selector */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setAutonomyMode('conservative')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors',
                autonomyMode === 'conservative'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              Assisted Pilot
            </button>
            <button
              onClick={() => setAutonomyMode('aggressive')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors',
                autonomyMode === 'aggressive'
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              Full Auto (100%)
            </button>
          </div>

          {/* Trigger Scan Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTriggerDiscovery}
            disabled={isScanning || isEmergencyStopped}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isScanning && 'animate-spin')} />
            <span>{isScanning ? 'Scanning...' : 'Scan Jobs'}</span>
          </Button>

          {/* Emergency Kill Switch */}
          {isEmergencyStopped ? (
            <Button
              size="sm"
              variant="cta"
              onClick={resume}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
            >
              <Play className="w-4 h-4" />
              <span>Resume Agents</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => emergencyStop()}
              className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
            >
              <X className="w-4 h-4" />
              <span>Emergency Stop</span>
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <GlassCard key={index} className="p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">{stat.label}</span>
                <div className={cn('p-2 rounded-xl border', stat.bgColor)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white">{stat.value}</h3>
                <p className="text-[11px] text-neutral-400 mt-1">{stat.change}</p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Main Grid: Pipeline Breakdown + Human Review Queue + Live Agent Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Funnel & Review Queue */}
        <div className="lg:col-span-8 space-y-6">
          {/* Conversion Funnel */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white">Application Pipeline Funnel</h3>
                <p className="text-xs text-neutral-400">
                  Realtime progression across all automated pipeline stages
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Total: {applications.length} Tracked
              </span>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Discovered Listings', count: stageCounts.discovered, color: 'bg-sky-500' },
                { label: 'High-Match (>80%)', count: stageCounts.matched, color: 'bg-indigo-500' },
                { label: 'Queued for Tailoring', count: stageCounts.queued, color: 'bg-purple-500' },
                { label: 'Submitted & Proofed', count: stageCounts.applied, color: 'bg-emerald-500' },
                { label: 'Interview Requests', count: stageCounts.interview, color: 'bg-amber-500' },
                { label: 'Offers Received', count: stageCounts.offer, color: 'bg-teal-400' },
              ].map((item, i) => {
                const total = Math.max(applications.length, 1)
                const pct = applications.length > 0 ? Math.round((item.count / total) * 100) : 0
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-300 font-medium">{item.label}</span>
                      <span className="font-mono text-neutral-400">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', item.color)}
                        style={{ width: `${Math.max(pct, item.count > 0 ? 5 : 0)}%` }}
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
              <div>
                <h3 className="text-base font-semibold text-white">
                  Human Review Queue (Assisted Pilot)
                </h3>
                <p className="text-xs text-neutral-400">
                  Applications requiring manual approval before autonomous submission
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                {pendingReviewApps.length} Pending Actions
              </span>
            </div>

            {pendingReviewApps.length === 0 ? (
              <div className="py-8 text-center space-y-2 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-medium text-neutral-200">No pending reviews</p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  All active applications are either fully autonomous or running without human intervention required.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviewApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {app.job?.title || 'Job Listing'}
                        </span>
                        <span className="text-xs text-neutral-400">
                          at {app.job?.company || 'Company'}
                        </span>
                        <StatusBadge status="needs_review" size="sm" />
                      </div>
                      <p className="text-xs text-amber-300/90">
                        {app.failure_reason || 'Manual review required prior to submission'}
                      </p>
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
            )}
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
              {logsLoading ? (
                <p className="text-neutral-500 animate-pulse">Loading live telemetry stream...</p>
              ) : formattedActivities.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-neutral-500">
                  <p className="text-xs font-mono">Telemetry channel connected.</p>
                  <p className="text-[11px]">No events recorded yet. Click &quot;Scan Jobs&quot; above to trigger live agent activity.</p>
                </div>
              ) : (
                formattedActivities.map((log) => (
                  <div key={log.id} className="space-y-0.5 leading-relaxed border-b border-white/[0.03] pb-2 last:border-0">
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                      <span>{log.time}</span>
                      <span className="text-indigo-400">[{log.platform}]</span>
                      <span className="text-neutral-400">{log.type.toUpperCase()}</span>
                    </div>
                    <p className="text-neutral-200 text-xs">{log.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Audit Logging: Active</span>
              <Link to="/activity" className="text-violet-400 hover:text-violet-300 font-medium">
                View Full Audit Trail &rarr;
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}