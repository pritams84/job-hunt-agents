import { CandidateProfile, JobListing, Profile, Subscription, SUBSCRIPTION_TIERS } from '../../types'
import { supabase } from '../supabase'
import { evaluateJobMatch } from './matcher'
import { tailorApplicationAssets } from './tailor'
import { executeApplicationSubmission } from '../workers/playwright'

export interface OrchestrationResult {
  jobId: string
  score: number
  decision: 'apply' | 'skip' | 'needs_review'
  applicationId?: string
  status: 'submitted' | 'queued_for_review' | 'skipped' | 'quota_exceeded' | 'aborted'
  message: string
}

/**
 * Agent 7: Orchestrator & Concurrency Governor
 *
 * Coordinates execution across all specialized agents:
 * Enforces tier quotas, evaluates match criteria, coordinates tailoring and submission,
 * and handles emergency abort states.
 */
export class AgentOrchestrator {
  private userId: string
  private isAborted: boolean = false

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Emergency Stop Trigger
   */
  public abort(): void {
    this.isAborted = true
  }

  /**
   * Validates if user has remaining daily applications in their subscription tier
   */
  public async checkQuota(): Promise<{
    allowed: boolean
    used: number
    cap: number
    tier: string
  }> {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle()

    const tier = (sub?.plan_tier || 'free_trial') as keyof typeof SUBSCRIPTION_TIERS
    const limits = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free_trial
    const used = sub?.daily_applications_used || 0
    const cap = sub?.daily_cap || limits.daily_cap

    return {
      allowed: used < cap,
      used,
      cap,
      tier,
    }
  }

  /**
   * Executes autonomous pipeline for a candidate and discovered job
   */
  public async processJob(params: {
    job: JobListing
    userProfile: Profile
    resumeUrl: string
  }): Promise<OrchestrationResult> {
    const { job, userProfile, resumeUrl } = params

    if (this.isAborted) {
      return {
        jobId: job.id,
        score: 0,
        decision: 'skip',
        status: 'aborted',
        message: 'Processing halted by Emergency Killswitch.',
      }
    }

    // 1. Quota Check
    const quota = await this.checkQuota()
    if (!quota.allowed) {
      await supabase.from('activity_log').insert({
        user_id: this.userId,
        event_type: 'quota_reached',
        payload_json: {
          job_title: job.title,
          company: job.company,
          used: quota.used,
          cap: quota.cap,
          tier: quota.tier,
        },
      })

      return {
        jobId: job.id,
        score: 0,
        decision: 'skip',
        status: 'quota_exceeded',
        message: `Daily cap of ${quota.cap} reached for tier ${quota.tier}. Resumes tomorrow.`,
      }
    }

    // 2. Agent 3: 3-Stage Match Scoring Pass
    const matchResult = await evaluateJobMatch({
      profile: userProfile.parsed_json,
      job,
      preferences: {
        roles: userProfile.preferences.target_roles,
        salary_min: userProfile.preferences.salary_min,
        remote_ok: userProfile.preferences.remote_ok,
        blacklist_companies: userProfile.rules.blacklist_companies,
      },
    })

    // Record decision in Supabase
    await supabase.from('match_decisions').insert({
      job_id: job.id,
      user_id: this.userId,
      score: matchResult.score,
      score_breakdown: matchResult.score_breakdown,
      decision: matchResult.decision,
      reasoning_text: matchResult.reasoning_text,
    })

    if (matchResult.decision === 'skip') {
      return {
        jobId: job.id,
        score: matchResult.score,
        decision: 'skip',
        status: 'skipped',
        message: `Score ${matchResult.score}% below minimum threshold. Skipped.`,
      }
    }

    // 3. Create initial application record in database
    const initialStatus =
      matchResult.decision === 'apply' && userProfile.rules.autonomy_mode === 'auto'
        ? 'queued'
        : 'needs_review'

    const { data: newApp, error: appError } = await supabase
      .from('applications')
      .insert({
        user_id: this.userId,
        job_id: job.id,
        status: initialStatus,
        retry_count: 0,
      })
      .select('id')
      .single()

    if (appError || !newApp) {
      throw new Error(`Failed to create application: ${appError?.message}`)
    }

    // If candidate prefers review mode, queue for dashboard confirmation
    if (initialStatus === 'needs_review') {
      return {
        jobId: job.id,
        score: matchResult.score,
        decision: 'needs_review',
        applicationId: newApp.id,
        status: 'queued_for_review',
        message: `Match score ${matchResult.score}%. Queued for user confirmation on Dashboard.`,
      }
    }

    // 4. Agent 4: Tailoring & Adversarial Fact-Checker Pass
    const tailoredAssets = await tailorApplicationAssets({
      profile: userProfile.parsed_json,
      job,
      standardAnswers: userProfile.standard_answers.custom_answers || {},
    })

    if (this.isAborted) {
      return {
        jobId: job.id,
        score: matchResult.score,
        decision: 'apply',
        applicationId: newApp.id,
        status: 'aborted',
        message: 'Processing halted by Emergency Killswitch before submission.',
      }
    }

    // 5. Agent 5: Playwright Browser Worker Submission
    const submissionResult = await executeApplicationSubmission({
      applicationId: newApp.id,
      job,
      profile: userProfile.parsed_json,
      standardAnswers: userProfile.standard_answers,
      resumeFileUrl: resumeUrl,
      coverLetterText: tailoredAssets.cover_letter_text,
      customAnswers: tailoredAssets.custom_answers,
    })

    // Increment daily usage counter on successful submission
    if (submissionResult.success) {
      await supabase.rpc('increment_daily_applications', { user_uuid: this.userId })
    }

    return {
      jobId: job.id,
      score: matchResult.score,
      decision: 'apply',
      applicationId: newApp.id,
      status: submissionResult.success ? 'submitted' : 'queued_for_review',
      message: submissionResult.success
        ? `Application successfully submitted (Ref: ${submissionResult.confirmationRef})`
        : submissionResult.failureReason || 'Submission paused for human verification.',
    }
  }
}
