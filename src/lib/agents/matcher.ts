import { getStructuredCompletion } from '@/lib/ai/client'
import { CandidateProfile, JobListing, MatchDecision } from '@/types'

const MATCHER_SYSTEM_PROMPT = `You are an expert AI Career Matchmaker & Recruitment Evaluation Agent.
Your job is to thoroughly evaluate the compatibility between a candidate's profile and a job listing.

Evaluate across three dimensions:
1. Skills Overlap (Weight 40%): What % of required and preferred technologies match?
2. Experience Alignment (Weight 30%): Does the candidate's seniority level, role scope, and background match?
3. Domain / Role Context (Weight 30%): Are the responsibilities and company mission a natural fit?

You must output a valid JSON object matching this exact structure:
{
  "score": 88,
  "decision": "apply",
  "reasoning_text": "Detailed 2-3 sentence explanation of the match fit, key strengths, and any gaps.",
  "score_breakdown": {
    "skills_overlap": 90,
    "experience_alignment": 85,
    "llm_qualitative_fit": 88,
    "salary_fit": 85,
    "location_fit": 95
  }
}

Decision Rules:
- If score >= 85: decision MUST be "apply"
- If score is between 70 and 84: decision MUST be "needs_review"
- If score < 70: decision MUST be "skip"

Output only the JSON object. Do not include markdown code blocks or extra text.`

interface HardFilterResult {
  passed: boolean
  reason?: string
}

/**
 * Stage 1: Deterministic Hard Filters (Zero LLM cost)
 */
export function checkHardFilters(
  profile: CandidateProfile,
  preferences: { roles?: string[]; salary_min?: number; remote_ok?: boolean; blacklist_companies?: string[] },
  job: JobListing
): HardFilterResult {
  // 1. Company Blacklist Check
  const blacklist = preferences.blacklist_companies || []
  if (blacklist.some(blocked => job.company.toLowerCase().includes(blocked.toLowerCase()))) {
    return { passed: false, reason: `Company "${job.company}" is on your personal blacklist.` }
  }

  // 2. Salary Floor Filter
  if (preferences.salary_min && job.salary_max && job.salary_max < preferences.salary_min) {
    return { 
      passed: false, 
      reason: `Maximum listed salary ($${job.salary_max.toLocaleString()}) is below your floor ($${preferences.salary_min.toLocaleString()}).` 
    }
  }

  // 3. Strict Remote Filter
  if (preferences.remote_ok === false && job.is_remote) {
    return { passed: false, reason: 'Job is remote, but candidate requested on-site/hybrid only.' }
  }

  return { passed: true }
}

/**
 * Agent 3: Evaluates candidate compatibility against a job listing using a 3-stage funnel
 */
export async function evaluateJobMatch(params: {
  profile: CandidateProfile
  job: JobListing
  preferences?: { roles?: string[]; salary_min?: number; remote_ok?: boolean; blacklist_companies?: string[] }
}): Promise<Omit<MatchDecision, 'id' | 'created_at'>> {
  const { profile, job, preferences = {} } = params

  // Stage 1: Fast Hard Deterministic Filter
  const hardCheck = checkHardFilters(profile, preferences, job)
  if (!hardCheck.passed) {
    return {
      job_id: job.id,
      user_id: '',
      score: 35,
      decision: 'skip',
      reasoning_text: hardCheck.reason || 'Failed hard criteria filters.',
      score_breakdown: {
        skills_overlap: 40,
        experience_alignment: 30,
        llm_qualitative_fit: 30,
        salary_fit: 20,
        location_fit: 40,
      },
    }
  }

  // Stage 2 & 3: Deep Evaluation via NVIDIA Nemotron
  const description = (job.description_raw || '').slice(0, 3000)
  const evaluationPrompt = `
CANDIDATE SUMMARY:
Name: ${profile.personal.full_name}
Summary: ${profile.summary}
Primary Skills: ${profile.skills.primary.join(', ')}
Secondary Skills: ${profile.skills.secondary.join(', ')}
Tools/Platforms: ${profile.skills.tools_and_platforms.join(', ')}
Recent Roles: ${profile.experience.slice(0, 3).map(e => `${e.title} at ${e.company} (${e.start_date} - ${e.end_date})`).join('; ')}

TARGET JOB LISTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'} (Remote: ${job.is_remote})
Salary: $${job.salary_min?.toLocaleString() || 'N/A'} - $${job.salary_max?.toLocaleString() || 'N/A'}
Description:
${description}
`

  try {
    const result = await getStructuredCompletion<{
      score: number
      decision: 'apply' | 'needs_review' | 'skip'
      reasoning_text: string
      score_breakdown: {
        skills_overlap: number
        experience_alignment: number
        llm_qualitative_fit: number
        salary_fit: number
        location_fit: number
      }
    }>({
      systemPrompt: MATCHER_SYSTEM_PROMPT,
      userPrompt: evaluationPrompt,
      temperature: 0.2,
    })

    return {
      job_id: job.id,
      user_id: '',
      score: Math.min(100, Math.max(0, result.score || 70)),
      decision: result.decision || 'needs_review',
      reasoning_text: result.reasoning_text || 'Matched based on relevant skillset overlap.',
      score_breakdown: result.score_breakdown || {
        skills_overlap: result.score,
        experience_alignment: result.score,
        llm_qualitative_fit: result.score,
        salary_fit: 80,
        location_fit: 90,
      },
    }
  } catch (error) {
    console.error('Nemotron evaluation fallback:', error)
    return {
      job_id: job.id,
      user_id: '',
      score: 75,
      decision: 'needs_review',
      reasoning_text: 'Manual review suggested. Evaluation fallback triggered.',
      score_breakdown: {
        skills_overlap: 75,
        experience_alignment: 75,
        llm_qualitative_fit: 75,
        salary_fit: 75,
        location_fit: 75,
      },
    }
  }
}
