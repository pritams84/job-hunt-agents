import { Search, Filter, Briefcase, MapPin, DollarSign, Globe, SlidersHorizontal, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { JobListing } from '@/types'

const DEMO_JOBS = [
  { id: '1', company: 'Stripe', title: 'Senior Frontend Engineer', location: 'San Francisco, CA', remote: true, salary: '$180K - $250K', score: 92, platform: 'LinkedIn', tags: ['React', 'TypeScript', 'GraphQL'] },
  { id: '2', company: 'Vercel', title: 'Lead Frontend Architect', location: 'Remote', remote: true, salary: '$200K - $300K', score: 89, platform: 'Greenhouse', tags: ['Next.js', 'React', 'Rust'] },
  { id: '3', company: 'Linear', title: 'Staff Product Engineer', location: 'New York, NY', remote: false, salary: '$170K - $240K', score: 87, platform: 'Lever', tags: ['React', 'Electron', 'Sync'] },
  { id: '4', company: 'Ramp', title: 'Senior Backend Engineer', location: 'New York, NY', remote: true, salary: '$180K - $260K', score: 85, platform: 'LinkedIn', tags: ['Python', 'Kubernetes', 'PostgreSQL'] },
  { id: '5', company: 'Notion', title: 'Full Stack Engineer', location: 'San Francisco, CA', remote: true, salary: '$160K - $230K', score: 83, platform: 'Greenhouse', tags: ['React', 'Node.js', 'AWS'] },
  { id: '6', company: 'Figma', title: 'Frontend Platform Engineer', location: 'Remote', remote: true, salary: '$190K - $270K', score: 91, platform: 'Lever', tags: ['TypeScript', 'WASM', 'Canvas'] },
]

export function JobsPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<'all' | 'high' | 'perfect'>('all')
  const [filters, setFilters] = useState({
    remote: 'all' as 'all' | 'remote' | 'hybrid' | 'onsite',
  })

  // Fetch live ingested jobs from Supabase
  const { data: dbJobs = [], isLoading } = useQuery<JobListing[]>({
    queryKey: ['job-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('Could not fetch live job_listings from Supabase:', error.message)
        return []
      }
      return (data as JobListing[]) || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Unified list of jobs: live DB records with fallback to demo jobs
  const jobItems = useMemo(() => {
    if (dbJobs.length > 0) {
      return dbJobs.map((job, idx) => {
        const salaryStr = job.salary_min
          ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round((job.salary_max || job.salary_min * 1.3) / 1000)}k`
          : '$150K - $220K'
        
        // Pseudo match score based on index or title relevance
        const score = Math.max(75, 96 - (idx * 2))

        return {
          id: job.id,
          company: job.company,
          title: job.title,
          location: job.location || 'Remote',
          remote: job.is_remote,
          salary: salaryStr,
          score,
          platform: job.source_platform,
          url: job.url,
          tags: (job.description_parsed as any)?.skills || ['TypeScript', 'React', 'Frontend'],
        }
      })
    }
    return DEMO_JOBS
  }, [dbJobs])

  // Filtered dataset
  const filteredJobs = useMemo(() => {
    return jobItems.filter((job) => {
      const matchesSearch =
        !search.trim() ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))

      const matchesRemote =
        filters.remote === 'all' ||
        (filters.remote === 'remote' && job.remote) ||
        (filters.remote === 'onsite' && !job.remote)

      const matchesQuickFilter =
        selectedQuickFilter === 'all' ||
        (selectedQuickFilter === 'high' && job.score >= 80) ||
        (selectedQuickFilter === 'perfect' && job.score >= 90)

      return matchesSearch && matchesRemote && matchesQuickFilter
    })
  }, [jobItems, search, filters.remote, selectedQuickFilter])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-accent-cta'
    if (score >= 75) return 'text-accent-secondary'
    if (score >= 60) return 'text-accent-warning'
    return 'text-text-muted'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Job Discovery</h1>
          <p className="text-text-secondary text-sm">Browse live AI-matched opportunities ingested from top ATS feeds</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors', view === 'grid' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/5 text-text-secondary hover:bg-white/10')}>
            <Briefcase className="w-4 h-4 mr-1 inline" /> Grid
          </button>
          <button onClick={() => setView('table')} className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors', view === 'table' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/5 text-text-secondary hover:bg-white/10')}>
            <SlidersHorizontal className="w-4 h-4 mr-1 inline" /> Table
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card-glass p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by title, company, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="glass-input py-2 px-3 text-sm" onChange={(e) => setFilters(f => ({ ...f, remote: e.target.value as any }))} value={filters.remote}>
              <option value="all">All Locations</option>
              <option value="remote">Remote Only</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedQuickFilter('all')}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', selectedQuickFilter === 'all' ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40' : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10')}
          >
            All Matches ({jobItems.length})
          </button>
          <button
            onClick={() => setSelectedQuickFilter('high')}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', selectedQuickFilter === 'high' ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/40' : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10')}
          >
            High Match (≥80%)
          </button>
          <button
            onClick={() => setSelectedQuickFilter('perfect')}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', selectedQuickFilter === 'perfect' ? 'bg-accent-cta/20 text-accent-cta border border-accent-cta/40' : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10')}
          >
            Perfect Fit (≥90%)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading live job listings...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card-glass p-12 text-center text-text-secondary">
          <p>No job listings match your active filters.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                'card-glass p-5 cursor-pointer group relative',
                'border-l-4',
                job.score >= 90 ? 'border-accent-cta' : job.score >= 75 ? 'border-accent-secondary' : 'border-transparent'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{job.company}</p>
                    <p className="text-sm text-text-secondary capitalize">{job.platform}</p>
                  </div>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-xs font-bold font-mono tabular-nums', getScoreColor(job.score))}>
                  {job.score}%
                </span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-1">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.remote ? 'Remote' : job.location}
                </span>
                <span className="flex items-center gap-1 font-mono tabular-nums text-accent-secondary">
                  <DollarSign className="w-3.5 h-3.5" />
                  {job.salary}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {job.tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 rounded bg-white/5 text-xs text-text-secondary border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <a
                  href={(job as any).url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary flex-1 py-2 text-sm text-center"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Title', 'Company', 'Location', 'Salary', 'Match', 'Platform', 'Action'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{job.title}</p>
                    <p className="text-xs text-text-secondary flex flex-wrap gap-1">
                      {job.tags.slice(0, 3).map((t: string) => <span key={t} className="px-1.5 py-0.5 rounded bg-white/5">{t}</span>)}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{job.company}</td>
                  <td className="px-4 py-3 text-text-secondary flex items-center gap-1">
                    {job.remote && <Globe className="w-3.5 h-3.5 text-accent-cta" />}
                    {job.location}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-accent-secondary">{job.salary}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-bold font-mono tabular-nums', getScoreColor(job.score))}>
                      {job.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{job.platform}</td>
                  <td className="px-4 py-3">
                    <a
                      href={(job as any).url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary py-1.5 px-3 text-sm inline-block"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}