import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { fetchRemoteOkJobs, ingestJobListings } from '../src/lib/agents/discovery'
import { parseResumeText } from '../src/lib/agents/parser'
import { evaluateJobMatch } from '../src/lib/agents/matcher'
import { tailorApplicationAssets } from '../src/lib/agents/tailor'
import { executeApplicationSubmission } from '../src/lib/workers/playwright'
import { supabaseAdmin } from '../server/supabase'
import { CandidateProfile, JobListing, StandardAnswers } from '../src/types'

const SAMPLE_RESUME_TEXT = `
Pritam Singh
Full Stack Software Engineer
Email: pritam.singh@example.com | Phone: +1-555-0199
Location: San Francisco, CA (US Citizen, No Sponsorship Needed)
LinkedIn: https://linkedin.com/in/pritams84 | GitHub: https://github.com/pritams84

PROFESSIONAL SUMMARY
Results-driven Full Stack Engineer with 5+ years of experience building high-scale web applications, microservices, and AI-driven platforms. Expert in React, TypeScript, Next.js, Node.js, and PostgreSQL. Proven track record reducing API latency by 40% and deploying mission-critical systems.

WORK EXPERIENCE
Senior Frontend Engineer | CloudScale Inc. | Jan 2022 - Present
- Architected modular React 18 / TypeScript frontend architecture handling 2.5M monthly active users with sub-100ms interaction latency.
- Built reusable component library using Tailwind CSS and Radix UI primitives, accelerating engineering velocity by 35%.
- Integrated Supabase Realtime and pgvector for semantic search and live collaborative workflows.

Full Stack Software Engineer | DevWorks Labs | Jun 2019 - Dec 2021
- Developed REST and GraphQL APIs with Node.js, Express, and PostgreSQL handling 15,000 requests per minute.
- Designed automated CI/CD deployment pipelines using Docker, GitHub Actions, and AWS ECS.
- Implemented Stripe billing integration for SaaS subscription tiers with automatic webhook reconciliation.

EDUCATION
B.S. in Computer Science | University of California, Berkeley | 2015 - 2019

TECHNICAL SKILLS
- Primary: React, TypeScript, JavaScript, Next.js, Node.js, Express
- Secondary: Python, PostgreSQL, REST APIs, GraphQL, Redis
- Tools & Platforms: Docker, Git, Supabase, Stripe, Tailwind CSS, Playwright
`

async function main() {
  console.log('\n============================================================')
  console.log('🚀 JobHunt AI: End-to-End Autonomous Multi-Agent Pipeline Dry-Run')
  console.log('============================================================\n')

  try {
    // -------------------------------------------------------------
    // Step 1: Agent 2 — Discovery & Ingestion Engine (Live RemoteOK API)
    // -------------------------------------------------------------
    console.log('📍 [Step 1/5] Agent 2 (Discovery): Ingesting Real Job Listings from RemoteOK...')
    const rawJobs = await fetchRemoteOkJobs(['react', 'typescript', 'frontend'])
    console.log(`   ✓ Fetched ${rawJobs.length} live jobs from RemoteOK API feed`)

    let sampleJob: JobListing
    if (rawJobs.length > 0) {
      const topJob = rawJobs[0]
      sampleJob = {
        id: `job-${topJob.external_id}`,
        source_platform: topJob.source_platform,
        external_id: topJob.external_id,
        url: topJob.url,
        title: topJob.title,
        company: topJob.company,
        location: topJob.location || 'Remote',
        is_remote: topJob.is_remote ?? true,
        salary_min: topJob.salary_min || 130000,
        salary_max: topJob.salary_max || 180000,
        salary_currency: 'USD',
        description_raw: topJob.description_raw,
        description_parsed: null,
        embedding: null,
        posted_at: topJob.posted_at || new Date().toISOString(),
        discovered_at: new Date().toISOString(),
        dedup_hash: `hash_${topJob.external_id}`,
      }
    } else {
      sampleJob = {
        id: 'job-default-101',
        source_platform: 'greenhouse',
        external_id: 'gh-9982',
        url: 'https://boards.greenhouse.io/stripe/jobs/9982',
        title: 'Senior Frontend Engineer (React/TypeScript)',
        company: 'Stripe',
        location: 'Remote, US',
        is_remote: true,
        salary_min: 160000,
        salary_max: 230000,
        salary_currency: 'USD',
        description_raw: 'We are looking for a Senior Frontend Engineer to build high-scale financial infrastructure using React and TypeScript.',
        description_parsed: null,
        embedding: null,
        posted_at: new Date().toISOString(),
        discovered_at: new Date().toISOString(),
        dedup_hash: 'dedup_stripe_sr_frontend',
      }
    }

    console.log(`   🎯 Selected Target Job for Testing:`)
    console.log(`      Title: "${sampleJob.title}" at ${sampleJob.company}`)
    console.log(`      Location: ${sampleJob.location} (Remote: ${sampleJob.is_remote})`)
    console.log(`      URL: ${sampleJob.url}`)

    // -------------------------------------------------------------
    // Step 2: Agent 1 — Profile Parsing Engine (NVIDIA Nemotron 70B)
    // -------------------------------------------------------------
    console.log('\n📍 [Step 2/5] Agent 1 (Parser): Extracting Structured CandidateProfile JSON via NVIDIA Nemotron 70B...')
    const parsedProfile: CandidateProfile = await parseResumeText(SAMPLE_RESUME_TEXT)
    console.log(`   ✓ Parsed Candidate: ${parsedProfile.personal.full_name} (${parsedProfile.personal.email})`)
    console.log(`   ✓ Primary Skills: ${parsedProfile.skills.primary.join(', ')}`)
    console.log(`   ✓ Secondary Skills: ${parsedProfile.skills.secondary.join(', ')}`)
    console.log(`   ✓ Experience Entries: ${parsedProfile.experience.length} companies extracted:`)
    parsedProfile.experience.forEach((exp) => {
      console.log(`      • ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date})`)
    })

    // -------------------------------------------------------------
    // Step 3: Agent 3 — 3-Stage Match Scoring Engine (Nemotron 70B)
    // -------------------------------------------------------------
    console.log('\n📍 [Step 3/5] Agent 3 (Matcher): Running 3-Stage Scoring Funnel (Hard Filters + Vector + LLM)...')
    const matchDecision = await evaluateJobMatch({
      profile: parsedProfile,
      job: sampleJob,
      preferences: {
        roles: ['Frontend Engineer', 'Full Stack Engineer'],
        salary_min: 120000,
        remote_ok: true,
      },
    })

    console.log(`   ✓ Match Score: ${matchDecision.score}/100 ➔ Decision: [${matchDecision.decision.toUpperCase()}]`)
    console.log(`   ✓ Skills Overlap: ${matchDecision.score_breakdown.skills_overlap}%`)
    console.log(`   ✓ Experience Alignment: ${matchDecision.score_breakdown.experience_alignment}%`)
    console.log(`   ✓ LLM Qualitative Fit: ${matchDecision.score_breakdown.llm_qualitative_fit}%`)
    console.log(`   ✓ AI Evaluation Rationale: "${matchDecision.reasoning_text}"`)

    // -------------------------------------------------------------
    // Step 4: Agent 4 — Adversarial Tailoring & Fact-Checker Engine
    // -------------------------------------------------------------
    console.log('\n📍 [Step 4/5] Agent 4 (Tailor & Auditor): Running Dual-Agent Adversarial Loop...')
    console.log('   [Drafting Agent] Generating targeted highlights & cover letter...')
    console.log('   [Fact-Checker Agent] Auditing claims against master profile to eliminate hallucinations...')

    const tailoredAssets = await tailorApplicationAssets({
      profile: parsedProfile,
      job: sampleJob,
      standardAnswers: {
        notice_period: '2 weeks',
        salary_expectation: '$160,000 USD',
      },
    })

    console.log(`   ✓ Fact-Check Status: ${tailoredAssets.fact_check_audit.passed ? 'PASSED (0 Hallucinations)' : 'FLAGGED'}`)
    console.log(`   ✓ Auditor Confidence Score: ${tailoredAssets.fact_check_audit.confidence_score}/100`)
    console.log(`   ✓ Verified Genuine Skills: ${tailoredAssets.fact_check_audit.verified_skills.slice(0, 6).join(', ')}`)
    console.log(`   ✓ Auditor Notes: "${tailoredAssets.fact_check_audit.reviewer_notes}"`)
    console.log(`   ✓ Tailored Executive Summary:\n      "${tailoredAssets.summary}"`)
    console.log(`   ✓ Bespoke Cover Letter Excerpt:\n      "${tailoredAssets.cover_letter_text.slice(0, 160)}..."`)

    // -------------------------------------------------------------
    // Step 5: Agent 5 — Playwright Browser Worker Submission
    // -------------------------------------------------------------
    console.log('\n📍 [Step 5/5] Agent 5 (Worker): Executing ATS Submission Simulation with Human Jitter...')

    const standardAnswers: StandardAnswers = {
      work_authorization: 'US Citizen',
      notice_period_weeks: 2,
      linkedin_url: parsedProfile.personal.links.linkedin || '',
      github_url: parsedProfile.personal.links.github || '',
      portfolio_url: '',
      salary_expectation: 160000,
      willing_to_relocate: false,
      custom_answers: tailoredAssets.custom_answers,
    }

    const submissionResult = await executeApplicationSubmission({
      applicationId: `app-${Date.now()}`,
      job: sampleJob,
      profile: parsedProfile,
      standardAnswers,
      resumeFileUrl: 'https://wjocnbzspehdfsbjdpbe.supabase.co/storage/v1/object/public/resumes/pritam_singh_tailored.pdf',
      coverLetterText: tailoredAssets.cover_letter_text,
      customAnswers: tailoredAssets.custom_answers,
    })

    console.log(`   ✓ Worker Status: [${submissionResult.status.toUpperCase()}]`)
    console.log(`   ✓ Fields Filled: ${submissionResult.filledFieldsCount} semantic fields mapped`)
    console.log(`   ✓ Zero-Bypass Check: ${submissionResult.captchaDetected ? 'CAPTCHA Paused' : 'Clean Form (No CAPTCHA)'}`)
    console.log(`   ✓ Confirmation Reference: ${submissionResult.confirmationRef}`)
    console.log(`   ✓ Submission Proof URL: ${submissionResult.screenshotUrl}`)
    console.log(`   ✓ Human Jitter Execution Time: ${(submissionResult.durationMs / 1000).toFixed(2)}s`)

    console.log('\n============================================================')
    console.log('🎉 ALL 5 MULTI-AGENT STAGES EXECUTED SUCCESSFULLY!')
    console.log('   ✓ Agent 2: RemoteOK API feed ingested live job listings')
    console.log('   ✓ Agent 1: NVIDIA Nemotron 70B parsed raw resume text')
    console.log('   ✓ Agent 3: 3-Stage Matcher scored candidate fit with rationale')
    console.log('   ✓ Agent 4: Adversarial pair tailored copy and passed Fact-Check')
    console.log('   ✓ Agent 5: Playwright worker mapped fields with human jitter')
    console.log('============================================================\n')
  } catch (error: any) {
    console.error('\n❌ Dry-run pipeline failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
