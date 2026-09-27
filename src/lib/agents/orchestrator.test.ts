import { describe, it, expect, vi } from 'vitest'
import { AgentOrchestrator } from './orchestrator'
import { JobListing, Profile } from '../../types'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              plan_tier: 'pro',
              daily_applications_used: 2,
              daily_cap: 15,
            },
            error: null,
          }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'app-uuid-123' },
            error: null,
          }),
        })),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

describe('Agent Orchestrator Unit Tests', () => {
  const userId = 'user-test-uuid'

  it('should initialize and check user quota allowance correctly', async () => {
    const orchestrator = new AgentOrchestrator(userId)
    const quota = await orchestrator.checkQuota()

    expect(quota.allowed).toBe(true)
    expect(quota.used).toBe(2)
    expect(quota.cap).toBe(15)
    expect(quota.tier).toBe('pro')
  })

  it('should abort pipeline immediately when killswitch is triggered', async () => {
    const orchestrator = new AgentOrchestrator(userId)
    orchestrator.abort()

    const mockJob: JobListing = {
      id: 'job-1',
      source_platform: 'remoteok',
      external_id: 'rok-1',
      url: 'https://remoteok.com/job/1',
      title: 'Frontend Engineer',
      company: 'TechCorp',
      location: 'Remote',
      is_remote: true,
      salary_min: 100000,
      salary_max: 150000,
      salary_currency: 'USD',
      description_raw: 'React developer',
      description_parsed: null,
      embedding: null,
      posted_at: new Date().toISOString(),
      discovered_at: new Date().toISOString(),
      dedup_hash: 'dedup1',
    }

    const mockProfile: Profile = {
      id: 'prof-1',
      user_id: userId,
      resume_url: null,
      parsed_json: {
        personal: {
          full_name: 'Test',
          email: 'test@example.com',
          phone: '',
          location: { city: '', state: '', country: '', timezone: '' },
          links: {},
        },
        summary: '',
        experience: [],
        education: [],
        skills: { primary: [], secondary: [], tools_and_platforms: [] },
        certifications: [],
        work_authorization: { us_authorized: true, requires_sponsorship: false },
      },
      preferences: {
        target_roles: ['Frontend Engineer'],
        target_seniority: ['Senior'],
        locations: ['Remote'],
        remote_ok: true,
        salary_min: 90000,
        salary_currency: 'USD',
        visa_sponsorship_needed: false,
      },
      standard_answers: {
        work_authorization: 'Citizen',
        notice_period_weeks: 2,
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        salary_expectation: 120000,
        willing_to_relocate: false,
        custom_answers: {},
      },
      rules: {
        blacklist_companies: [],
        autonomy_mode: 'auto',
        min_match_score: 80,
        max_applications_per_day: 10,
      },
      embedding: null,
      updated_at: new Date().toISOString(),
    }

    const result = await orchestrator.processJob({
      job: mockJob,
      userProfile: mockProfile,
      resumeUrl: 'https://example.com/resume.pdf',
    })

    expect(result.status).toBe('aborted')
    expect(result.message).toContain('Emergency Killswitch')
  })
})
