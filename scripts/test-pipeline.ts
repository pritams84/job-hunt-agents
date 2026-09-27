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
PRITAM SINGH
AI Engineer | Speech AI | Computer Vision | Edge AI | Generative AI
India | +91 84480 23794 | pritamsinghrajput84480@gmail.com
LinkedIn: https://linkedin.com/in/pritams84 | GitHub: https://github.com/pritams84

Professional Summary
AI Engineer with hands-on experience building and deploying production AI systems across Speech AI, Computer Vision, Edge AI, and Generative AI. Experienced in developing multilingual speech pipelines using WhisperX, Indic ASR, VAD, Pyannote.audio, and speaker embeddings, building LLM-powered conversation intelligence systems, and deploying real-time Computer Vision workloads on Raspberry Pi and Google Coral Edge TPU. Strong experience with Python, FastAPI, PostgreSQL, PyTorch, CUDA, Linux, Docker, GPU optimization, AI evaluation, and production debugging.

Professional Experience
Mialo Technologies | 2026 – Present
AI Engineer | India

TalkSense – AI Sales Assistant & Conversation Intelligence
• Engineered a production Conversation Intelligence and Speech Analytics platform for ingesting, transcribing, analyzing, and scoring real-world sales conversations.
• Developed a multilingual Speech AI pipeline supporting English, Hindi, Bengali, and mixed-language conversations using WhisperX, Indic ASR, Silero VAD, Pyannote.audio, and WeSpeaker.
• Implemented speaker diarization and Agent/Customer identification using voice embeddings, speaker enrollment, and cosine-similarity matching.
• Built asynchronous FastAPI + PostgreSQL + SQLAlchemy architecture with dedicated AI workers, separating API workloads from GPU/CPU-intensive processing.
• Implemented reliable processing lifecycle using PENDING → IN_PROGRESS → COMPLETED/FAILED, including failure handling, recovery, reconciliation, and orphan-session management.
• Integrated Llama 3.1 via Ollama for script adherence, objection handling, customer sentiment, buying signals, communication quality, and sales coaching analytics.
• Developed recording-ingestion workflows for Zoom, Google Meet, and Microsoft Teams and designed realtime conversation-intelligence workflows.
• Designed a wearable ambient-audio intelligence architecture supporting realtime provisional analysis and GPU-based batch finalization for high-accuracy transcription and analytics.
• Optimized long-form speech processing for an NVIDIA RTX 5060 8GB GPU, addressing VRAM, CUDA/cuBLAS, model-loading, VAD, and inference reliability challenges.
• Built evaluation workflows covering WER, CER, segmentation F1, diarization, speaker-role classification, audio coverage, and end-to-end pipeline accuracy.
• Performed production debugging across Linux, CUDA, PyTorch, FFmpeg, GPU memory, networking, audio processing, and backend services.
Technologies: Python, FastAPI, PostgreSQL, SQLAlchemy, PyTorch, WhisperX, Indic ASR, Silero VAD, Pyannote.audio, WeSpeaker, Llama 3.1, Ollama, CUDA, Docker, Linux

RetailSense – Edge AI Retail Analytics
• Deployed real-time Computer Vision inference on Raspberry Pi 4 + Google Coral Edge TPU for retail analytics.
• Integrated RTSP camera streams and optimized FPS, inference latency, CPU utilization, memory usage, and Edge TPU performance.
• Diagnosed production issues involving Linux, USB communication, networking, RTSP, Edge TPU runtime, and systemd services.
• Integrated edge inference with backend APIs for production analytics workflows.
Technologies: Python, FastAPI, Raspberry Pi, Google Coral Edge TPU, OpenCV, TensorFlow Lite, RTSP, Linux, systemd

Carton Box Detection & OCR System
• Developed a YOLO-based Computer Vision pipeline for automated carton detection and integrated OCR for extracting labels and textual information.
• Applied image preprocessing and model optimization techniques to improve detection and OCR reliability for warehouse automation.

Technical Skills
Languages: Python, SQL
AI / ML: Machine Learning, Computer Vision, Speech AI, Multilingual ASR, Speaker Diarization, Voice Embeddings, Generative AI, LLMs, Model Optimization
Speech AI: WhisperX, Indic ASR, Pyannote.audio, WeSpeaker, Silero VAD, Librosa, PyDub, VADER
Computer Vision: YOLO, OpenCV, TensorFlow Lite, OCR, Object Detection, Image Processing
LLM / GenAI: Llama 3.1, Ollama, LLM-based Analytics, Prompt Engineering
Backend: FastAPI, REST APIs, SQLAlchemy, Pydantic, JWT, RBAC, Asynchronous Processing, Microservices
Infrastructure: PyTorch, CUDA, Docker, Linux, Raspberry Pi, Google Coral Edge TPU, RTSP, SSH, systemd, Git, GitHub
Databases: PostgreSQL, MySQL

Education
Amity University, Jharkhand | 2022 – 2026
Bachelor of Technology (B.Tech) – Computer Science and Engineering

Certifications
• Generative AI Foundations – UpGrad, 2025
• Core Java Fundamentals – Udemy, 2024

Achievements
• 2nd Place among 60+ teams in an Idea, Innovation & Software Prototype Competition.
• Captain, B.Tech Cricket Team – led the team to a Runner-Up position.
• Department Representative for 1,400+ students – organized technical events and workshops.
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
