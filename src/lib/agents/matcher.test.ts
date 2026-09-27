import { describe, it, expect } from 'vitest'
import { checkHardFilters } from './matcher'
import { CandidateProfile, JobListing } from '../../types'

describe('Matcher Scoring Funnel Unit Tests (AC-3)', () => {
  const mockProfile: CandidateProfile = {
    personal: {
      full_name: 'Test Engineer',
      email: 'test@example.com',
      phone: '+1 555 1234',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        timezone: 'America/Los_Angeles',
      },
      links: {
        linkedin: 'https://linkedin.com/in/test',
      },
    },
    summary: 'Experienced full stack engineer',
    experience: [],
    education: [],
    skills: {
      primary: ['React', 'TypeScript', 'Node.js'],
      secondary: ['PostgreSQL', 'Tailwind CSS'],
      tools_and_platforms: ['Vite', 'Docker'],
    },
    certifications: [],
    work_authorization: {
      us_authorized: true,
      requires_sponsorship: false,
    },
  }

  const mockJob: JobListing = {
    id: 'job-1',
    source_platform: 'remoteok',
    external_id: 'rok-123',
    url: 'https://remoteok.com/job/123',
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    is_remote: true,
    salary_min: 140000,
    salary_max: 180000,
    salary_currency: 'USD',
    description_raw: 'Looking for a Senior Frontend Engineer with React and TypeScript experience.',
    description_parsed: null,
    embedding: null,
    posted_at: new Date().toISOString(),
    discovered_at: new Date().toISOString(),
    dedup_hash: 'hash123',
  }

  it('should pass deterministic fit when remote and salary meet preferences', () => {
    const result = checkHardFilters(
      mockProfile,
      { salary_min: 120000, remote_ok: true, blacklist_companies: ['BadCorp'] },
      mockJob
    )
    expect(result.passed).toBe(true)
  })

  it('should reject when salary max is below candidate floor', () => {
    const lowSalaryJob: JobListing = {
      ...mockJob,
      salary_max: 90000,
    }
    const result = checkHardFilters(
      mockProfile,
      { salary_min: 120000, remote_ok: true },
      lowSalaryJob
    )
    expect(result.passed).toBe(false)
    expect(result.reason).toContain('below your floor')
  })

  it('should reject when company is on blacklist', () => {
    const result = checkHardFilters(
      mockProfile,
      { blacklist_companies: ['Acme Corp'] },
      mockJob
    )
    expect(result.passed).toBe(false)
    expect(result.reason).toContain('personal blacklist')
  })
})
