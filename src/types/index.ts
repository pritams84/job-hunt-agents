export interface User {
  id: string
  clerk_id: string
  email: string
  first_name: string | null
  last_name: string | null
  image_url: string | null
  status: 'active' | 'suspended' | 'deleted'
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan_tier: SubscriptionTier
  status: SubscriptionStatus
  monthly_quota: number
  monthly_applications_used: number
  daily_cap: number
  daily_applications_used: number
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  updated_at: string
}

export type SubscriptionTier = 'free_trial' | 'starter' | 'pro' | 'power'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, { monthly_quota: number; daily_cap: number }> = {
  free_trial: { monthly_quota: 5, daily_cap: 3 },
  starter: { monthly_quota: 50, daily_cap: 5 },
  pro: { monthly_quota: 250, daily_cap: 15 },
  power: { monthly_quota: 999999, daily_cap: 50 },
}

export interface CandidateProfile {
  personal: {
    full_name: string
    email: string
    phone: string
    location: {
      city: string
      state: string
      country: string
      timezone: string
    }
    links: {
      linkedin?: string
      github?: string
      portfolio?: string
      twitter?: string
    }
  }
  summary: string
  experience: Array<{
    company: string
    title: string
    location: string
    start_date: string
    end_date: string | 'Present'
    highlights: string[]
    technologies: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field_of_study: string
    graduation_year: number
    gpa?: string
  }>
  skills: {
    primary: string[]
    secondary: string[]
    tools_and_platforms: string[]
  }
  certifications: string[]
  work_authorization: {
    us_authorized: boolean
    requires_sponsorship: boolean
    clearance_level?: string
  }
}

export interface Profile {
  id: string
  user_id: string
  resume_url: string | null
  parsed_json: CandidateProfile
  preferences: JobPreferences
  standard_answers: StandardAnswers
  rules: UserRules
  embedding: number[] | null
  updated_at: string
}

export interface JobPreferences {
  target_roles: string[]
  target_seniority: string[]
  locations: string[]
  remote_ok: boolean
  salary_min: number
  salary_currency: string
  visa_sponsorship_needed: boolean
}

export interface StandardAnswers {
  work_authorization: string
  notice_period_weeks: number
  linkedin_url: string
  github_url: string
  portfolio_url: string
  salary_expectation: number
  willing_to_relocate: boolean
  custom_answers: Record<string, string>
}

export interface UserRules {
  blacklist_companies: string[]
  autonomy_mode: 'review' | 'auto'
  min_match_score: number
  max_applications_per_day: number
}

export interface JobListing {
  id: string
  source_platform: string
  external_id: string
  url: string
  title: string
  company: string
  location: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  description_raw: string | null
  description_parsed: Record<string, unknown> | null
  embedding: number[] | null
  posted_at: string | null
  discovered_at: string
  dedup_hash: string
}

export interface MatchDecision {
  id: string
  job_id: string
  user_id: string
  score: number
  score_breakdown: {
    skills_overlap: number
    experience_alignment: number
    llm_qualitative_fit: number
    salary_fit: number
    location_fit: number
  }
  decision: 'apply' | 'skip' | 'needs_review'
  reasoning_text: string
  created_at: string
}

export type ApplicationStatus =
  | 'discovered'
  | 'matched'
  | 'queued'
  | 'applied'
  | 'needs_review'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'failed'

export interface Application {
  id: string
  user_id: string
  job_id: string
  status: ApplicationStatus
  submitted_content: {
    resume_url: string
    cover_letter_text: string
    qa_answers: Record<string, string>
  } | null
  confirmation_ref: string | null
  screenshot_url: string | null
  failure_reason: string | null
  retry_count: number
  submitted_at: string | null
  created_at: string
}

export interface ApplicationStatusHistory {
  id: string
  application_id: string
  status: ApplicationStatus
  source: 'system' | 'user' | 'platform_poll' | 'email_parse'
  occurred_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  application_id: string | null
  event_type: AgentEventType
  payload_json: Record<string, unknown>
  created_at: string
}

export type AgentEventType =
  | 'searched'
  | 'matched'
  | 'skipped'
  | 'generated_content'
  | 'filled_field'
  | 'submitted'
  | 'error'
  | 'captcha_detected'
  | 'quota_reached'
  | 'status_changed'

export interface AgentLogEvent {
  type: AgentEventType
  message: string
  timestamp: string
  platform?: string
  metadata?: Record<string, unknown>
}

export interface PlatformCredentials {
  id: string
  user_id: string
  platform: string
  encrypted_payload: Uint8Array
  status: 'valid' | 'expired' | 'revoked'
  last_verified_at: string | null
}

export interface StripeEvent {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
  created: number
}