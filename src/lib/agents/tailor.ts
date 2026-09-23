import { CandidateProfile, JobListing } from '../../types'
import { getStructuredCompletion } from '../ai/client'

export interface TailoredExperience {
  company: string
  title: string
  highlights: string[]
}

export interface FactCheckAudit {
  passed: boolean
  verified_skills: string[]
  discrepancies: string[]
  confidence_score: number
  reviewer_notes: string
}

export interface TailoredApplicationAssets {
  summary: string
  tailored_experience: TailoredExperience[]
  cover_letter_text: string
  custom_answers: Record<string, string>
  fact_check_audit: FactCheckAudit
}

interface DraftResponse {
  summary: string
  tailored_experience: TailoredExperience[]
  cover_letter_text: string
  custom_answers: Record<string, string>
}

interface FactCheckResponse {
  passed: boolean
  verified_skills: string[]
  discrepancies: string[]
  confidence_score: number
  reviewer_notes: string
}

/**
 * Agent 4: Tailoring & Fact-Checker Engine (Adversarial Pair)
 *
 * Implements a strict dual-agent adversarial loop:
 * 1. Drafting Agent: Customizes resume bullets, writes bespoke cover letter and ATS QA answers tailored to the Job Listing.
 * 2. Fact-Checker Agent: Verifies every claim, metric, and skill against the Master Profile JSON to guarantee ZERO hallucinations.
 * 3. Self-healing loop: Automatically re-drafts if fact-checking fails (max 2 retries).
 */
export async function tailorApplicationAssets(params: {
  profile: CandidateProfile
  job: JobListing
  standardAnswers?: Record<string, string>
  maxRetries?: number
}): Promise<TailoredApplicationAssets> {
  const { profile, job, standardAnswers = {}, maxRetries = 2 } = params

  let currentDraft: DraftResponse | null = null
  let auditResult: FactCheckAudit | null = null
  let attempt = 0
  let previousFeedback = ''

  while (attempt <= maxRetries) {
    attempt++

    // 1. Drafting Agent Pass
    currentDraft = await generateDraft({
      profile,
      job,
      standardAnswers,
      feedback: previousFeedback,
    })

    // 2. Fact-Checker Agent Pass (Adversarial Audit)
    auditResult = await auditDraftAgainstProfile({
      profile,
      draft: currentDraft,
      job,
    })

    // If audit passed or reached max attempts, return results
    if (auditResult.passed || attempt > maxRetries) {
      break
    }

    // Prepare feedback for the next re-draft iteration
    previousFeedback = `CRITICAL FACT-CHECK VIOLATIONS FOUND IN PREVIOUS ATTEMPT:\n${auditResult.discrepancies.join(
      '\n'
    )}\nNotes: ${auditResult.reviewer_notes}\nPlease strictly remove or correct these unverified claims in the new version.`
  }

  return {
    summary: currentDraft!.summary,
    tailored_experience: currentDraft!.tailored_experience,
    cover_letter_text: currentDraft!.cover_letter_text,
    custom_answers: currentDraft!.custom_answers,
    fact_check_audit: auditResult!,
  }
}

/**
 * Sub-Agent 4A: Drafting Agent
 */
async function generateDraft(params: {
  profile: CandidateProfile
  job: JobListing
  standardAnswers: Record<string, string>
  feedback?: string
}): Promise<DraftResponse> {
  const { profile, job, standardAnswers, feedback } = params

  const systemPrompt = `You are an elite, ATS-optimized Executive Career Coach and Resume Tailoring Agent.
Your job is to tailor the candidate's existing experience and write a persuasive cover letter and ATS answers for a specific job opening.

STRICT ZERO-HALLUCINATION RULES:
1. ONLY emphasize technologies, achievements, and responsibilities that exist in the candidate's profile.
2. DO NOT invent metrics, revenue percentages, or awards that do not exist.
3. DO NOT add skills or libraries that the candidate never listed.
4. Reword, align keywords, and restructure existing bullets to match the job description's phrasing without adding false claims.

${feedback ? `\nADVERSARIAL FEEDBACK FROM PREVIOUS DRAFT:\n${feedback}\n` : ''}

Output strictly valid JSON with the following structure:
{
  "summary": "Tailored 3-4 sentence professional summary targeted at this specific company and role.",
  "tailored_experience": [
    {
      "company": "Company Name (Must match candidate's actual company)",
      "title": "Role Title",
      "highlights": [
        "Action verb + quantifiable impact + tech stack (aligned with job keywords, truthful to candidate profile)"
      ]
    }
  ],
  "cover_letter_text": "Complete, highly compelling 3-4 paragraph cover letter customized for the company, addressing how candidate's genuine background solves the company's stated problems.",
  "custom_answers": {
    "why_are_you_interested": "Truthful, inspiring response customized to company mission",
    "relevant_experience_summary": "Truthful summary of direct experience",
    "notice_period": "Candidate standard notice period"
  }
}`

  const userPrompt = `CANDIDATE MASTER PROFILE:
${JSON.stringify(profile, null, 2)}

STANDARD ANSWERS:
${JSON.stringify(standardAnswers, null, 2)}

TARGET JOB LISTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'} (${job.is_remote ? 'Remote' : 'On-site'})
Description:
${job.description_raw || JSON.stringify(job.description_parsed || {})}

Generate tailored resume highlights, cover letter, and ATS question responses in JSON format now.`

  return await getStructuredCompletion<DraftResponse>({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
  })
}

/**
 * Sub-Agent 4B: Fact-Checker Agent (Auditor)
 */
async function auditDraftAgainstProfile(params: {
  profile: CandidateProfile
  draft: DraftResponse
  job: JobListing
}): Promise<FactCheckAudit> {
  const { profile, draft, job } = params

  const systemPrompt = `You are a forensic, skeptical Career Compliance and Fact-Checking Auditor.
Your singular objective is to protect the candidate from fraud, embellishment, and AI hallucinations.

EVALUATION CRITERIA:
1. Skills Verification: Are any technologies, frameworks, or tools mentioned in the draft that do NOT appear anywhere in the master profile?
2. Metric Verification: Are any percentages, revenue figures, or performance claims exaggerated or fabricated beyond what the master profile states?
3. Chronology/Company Verification: Are company names, dates, or titles misattributed?
4. Truthfulness: Can the candidate defend every statement in an interview with 100% honesty?

Output strictly valid JSON with the following structure:
{
  "passed": boolean (true if zero hallucinated skills/metrics, false if any unverified claim is found),
  "verified_skills": ["List of skills successfully cross-checked in profile"],
  "discrepancies": ["List of any fabricated or unverified claims found, or empty array if none"],
  "confidence_score": number (0 to 100 confidence in truthfulness),
  "reviewer_notes": "Concise summary of audit findings"
}`

  const userPrompt = `MASTER CANDIDATE PROFILE (Source of Ground Truth):
${JSON.stringify(profile, null, 2)}

PROPOSED DRAFT ASSETS TO AUDIT:
Summary:
${draft.summary}

Tailored Experience:
${JSON.stringify(draft.tailored_experience, null, 2)}

Cover Letter:
${draft.cover_letter_text}

Custom Answers:
${JSON.stringify(draft.custom_answers, null, 2)}

TARGET ROLE:
${job.title} at ${job.company}

Audit the draft strictly against the master profile. Output the JSON audit result now.`

  return await getStructuredCompletion<FactCheckResponse>({
    systemPrompt,
    userPrompt,
    temperature: 0.0,
  })
}
