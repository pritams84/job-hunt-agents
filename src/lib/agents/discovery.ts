import { JobListing, JobPreferences } from '../../types'
import { supabase } from '../supabase'

export interface RawJobPayload {
  source_platform: 'greenhouse' | 'lever' | 'ashby' | 'linkedin' | 'remoteok' | 'indeed' | 'custom'
  external_id: string
  url: string
  title: string
  company: string
  location?: string
  is_remote?: boolean
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description_raw: string
  posted_at?: string
}

/**
 * Normalizes strings for deterministic deduplication
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Universal SHA-256 deduplication fingerprint:
 * sha256(normalize(company) + ":" + normalize(title) + ":" + normalize(location))
 */
export async function computeDedupHash(company: string, title: string, location: string = 'remote'): Promise<string> {
  const normCompany = normalizeString(company)
  const normTitle = normalizeString(title)
  const normLocation = normalizeString(location)
  const data = `${normCompany}:${normTitle}:${normLocation}`

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    const hashArray = Array.from(new Uint8Array(buffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Fallback simple hash for environments without Web Crypto
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return `hash_${Math.abs(hash).toString(16).padStart(16, '0')}`
  }
}

/**
 * Parses and cleans HTML descriptions into readable markdown text
 */
export function cleanJobDescription(rawHtmlOrMarkdown: string): string {
  return rawHtmlOrMarkdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Mock/Simulator Connectors for external ATS feeds
 * In production, these query Greenhouse, Lever, and RemoteOK APIs
 */
export async function fetchRemoteOkJobs(tags: string[] = ['react', 'typescript', 'frontend']): Promise<RawJobPayload[]> {
  try {
    const tag = tags[0] || 'frontend'
    const res = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`, {
      headers: { 'User-Agent': 'JobHuntAI/1.0 (career-search-agent)' },
    })

    if (!res.ok) {
      console.warn(`RemoteOK API returned status ${res.status}`)
      return []
    }

    const data = await res.json()
    // First item in remoteok API is legal notice, filter out
    const jobs = Array.isArray(data) ? data.slice(1) : []

    return jobs.slice(0, 15).map((job: any) => ({
      source_platform: 'remoteok' as const,
      external_id: String(job.id || job.slug),
      url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      title: job.position || 'Software Engineer',
      company: job.company || 'Tech Company',
      location: job.location || 'Remote',
      is_remote: true,
      salary_min: job.salary_min ? Number(job.salary_min) : undefined,
      salary_max: job.salary_max ? Number(job.salary_max) : undefined,
      salary_currency: 'USD',
      description_raw: cleanJobDescription(job.description || ''),
      posted_at: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.error('Failed to fetch from RemoteOK connector:', err)
    return []
  }
}

/**
 * Greenhouse Board Connector
 * Pulls jobs from public greenhouse job boards: https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs
 */
export async function fetchGreenhouseBoardJobs(boardToken: string): Promise<RawJobPayload[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`)
    if (!res.ok) return []

    const data = await res.json()
    const jobs = data.jobs || []

    return jobs.map((job: any) => ({
      source_platform: 'greenhouse' as const,
      external_id: String(job.id),
      url: job.absolute_url,
      title: job.title,
      company: boardToken,
      location: job.location?.name || 'Remote',
      is_remote: (job.location?.name || '').toLowerCase().includes('remote'),
      description_raw: cleanJobDescription(job.content || ''),
      posted_at: job.updated_at || new Date().toISOString(),
    }))
  } catch (err) {
    console.error(`Failed to fetch Greenhouse jobs for ${boardToken}:`, err)
    return []
  }
}

/**
 * Lever Board Connector
 * Pulls jobs from public lever boards: https://api.lever.co/v0/postings/{site}
 */
export async function fetchLeverBoardJobs(site: string): Promise<RawJobPayload[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`)
    if (!res.ok) return []

    const jobs = await res.json()
    if (!Array.isArray(jobs)) return []

    return jobs.map((job: any) => ({
      source_platform: 'lever' as const,
      external_id: String(job.id),
      url: job.hostedUrl,
      title: job.text,
      company: site,
      location: job.categories?.location || 'Remote',
      is_remote: (job.categories?.location || '').toLowerCase().includes('remote') || job.workplaceType === 'remote',
      description_raw: cleanJobDescription(job.descriptionPlain || job.description || ''),
      posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.error(`Failed to fetch Lever jobs for ${site}:`, err)
    return []
  }
}

/**
 * Agent 2: Ingestion & Deduplication Pipeline
 * Takes raw jobs from any connector, deduplicates against database, and persists new listings
 */
export async function ingestJobListings(
  rawJobs: RawJobPayload[],
  targetPreferences?: JobPreferences
): Promise<{ inserted: number; skippedDuplicates: number; jobIds: string[] }> {
  let inserted = 0
  let skippedDuplicates = 0
  const insertedJobIds: string[] = []

  for (const raw of rawJobs) {
    const dedupHash = await computeDedupHash(raw.company, raw.title, raw.location || 'remote')

    // 1. Check if job already exists by dedup_hash
    const { data: existing } = await supabase
      .from('job_listings')
      .select('id')
      .eq('dedup_hash', dedupHash)
      .maybeSingle()

    if (existing) {
      skippedDuplicates++
      continue
    }

    // 2. Insert new job listing
    const { data: newJob, error } = await supabase
      .from('job_listings')
      .insert({
        source_platform: raw.source_platform,
        external_id: raw.external_id,
        url: raw.url,
        title: raw.title,
        company: raw.company,
        location: raw.location || null,
        is_remote: raw.is_remote ?? false,
        salary_min: raw.salary_min || null,
        salary_max: raw.salary_max || null,
        salary_currency: raw.salary_currency || 'USD',
        description_raw: raw.description_raw,
        posted_at: raw.posted_at || null,
        dedup_hash: dedupHash,
      })
      .select('id')
      .single()

    if (error) {
      console.warn(`Failed to insert job listing: ${raw.title} at ${raw.company}`, error.message)
      continue
    }

    if (newJob) {
      inserted++
      insertedJobIds.push(newJob.id)
    }
  }

  return {
    inserted,
    skippedDuplicates,
    jobIds: insertedJobIds,
  }
}
