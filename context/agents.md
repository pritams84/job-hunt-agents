# Multi-Agent Architecture Specification: AI Job Hunt SaaS

**Version:** 1.0 | **Companion to:** `architecture.md`, `system-design.md`, `low-level-system-design.md`, `frontend-design.md` | **Status:** Approved Specification

---

## 1. Multi-Agent System Overview

The **JobHunt AI** platform operates as an autonomous, event-driven multi-agent career automation system. Rather than using a single monolithic script or generic LLM prompt, the platform decomposes the complex career search and application process into **7 specialized, decoupled agents**.

Each agent has a single responsibility, strict input/output contracts, isolated execution sandboxes, and dedicated guardrails.

```
                                ┌────────────────────────────────────────────────────────┐
                                │               Candidate / User Profile                 │
                                └───────────────────────────┬────────────────────────────┘
                                                            │ Resume Upload / Prefs
                                                            ▼
                                ┌────────────────────────────────────────────────────────┐
                                │             1. Profile Parsing Agent                   │
                                │   (PDF/DOCX Extraction, JSON Normalization, Embedding) │
                                └───────────────────────────┬────────────────────────────┘
                                                            │
                                                            │ Profile JSON + Embedding
                                                            ▼
┌───────────────────────────────┐               ┌────────────────────────────────────────┐
│   2. Job Discovery Agent      │               │                                        │
│ (Scrapers, API Connectors,    │──────────────▶│       3. Matching & Scoring Agent      │
│  Dedup Hashes, Normalization) │ Listings Feed │ (Hard Filters + Vector Cosine + LLM)   │
└───────────────────────────────┘               └───────────────────┬────────────────────┘
                                                                    │
                                                Decision: 'apply'   │ (or 'needs_review')
                                                                    ▼
                                                ┌────────────────────────────────────────┐
                                                │   4. Tailoring & Fact-Checker Agent    │
                                                │ (Bespoke Resume + Cover Letter + Audit)│
                                                └───────────────────┬────────────────────┘
                                                                    │
                                                Tailored PDF/Text   │ + Verification Proof
                                                                    ▼
                                                ┌────────────────────────────────────────┐
                                                │   5. Browser & Form-Filling Agent      │
                                                │ (Playwright Sandboxes + ATS Automation)│
                                                └───────────────────┬────────────────────┘
                                                                    │
                                                Submission Proof    │ + Screenshots
                                                                    ▼
                                                ┌────────────────────────────────────────┐
                                                │   6. Application Tracker Agent         │
                                                │ (Email Webhooks, Status Sync, Realtime)│
                                                └───────────────────┬────────────────────┘
                                                                    │
                                                                    │ Live WebSocket Sync
                                                                    ▼
                                                ┌────────────────────────────────────────┐
                                                │    Command Center Dashboard (UI)       │
                                                └────────────────────────────────────────┘
```

---

## 2. Agent Catalog & Deep Technical Breakdown

### 2.1 Agent 1: Profile Parsing & Representation Agent

* **Purpose:** Converts raw, unstructured resume files (PDF, DOCX) into structured JSON schema and computes semantic vector embeddings.
* **Trigger:** User uploads or updates a resume on `/profile` or during the `/onboarding` wizard.
* **LLM Engine:** Fast extraction model (Claude 3.5 Haiku / GPT-4o-mini).

#### Technical Contract
- **Input:** Raw binary file from Supabase Storage bucket `resumes/{user_id}/original.pdf`.
- **Output:**
  1. `parsed_json`: Validated against `CandidateProfileSchema` (Zod/Pydantic).
  2. `embedding`: 1536-dimensional vector stored in Supabase PostgreSQL via `pgvector`.
  3. `skills_extracted`: Normalized skill array mapped to standard taxonomy.

#### Schema Extraction Spec
```typescript
interface CandidateProfileSchema {
  personal: {
    full_name: string;
    email: string;
    phone: string;
    location: { city: string; state: string; country: string; timezone: string };
    links: { linkedin?: string; github?: string; portfolio?: string; twitter?: string };
  };
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date: string | 'Present';
    highlights: string[];
    technologies: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_year: number;
    gpa?: string;
  }>;
  skills: {
    primary: string[];
    secondary: string[];
    tools_and_platforms: string[];
  };
  certifications: string[];
  work_authorization: {
    us_authorized: boolean;
    requires_sponsorship: boolean;
    clearance_level?: string;
  };
}
```

---

### 2.2 Agent 2: Job Discovery & Aggregation Agent

* **Purpose:** Continuous background ingestion of job listings across multiple boards, ATS endpoints, and search engines.
* **Trigger:** Scheduled cron jobs per tier (Autopilot: hourly, Pro: every 6 hours, Free: daily).
* **Connectors:**
  1. **Direct ATS Connectors:** Greenhouse, Lever, Ashby, Workday APIs/public boards.
  2. **Aggregated Connectors:** LinkedIn Job Search, Indeed, RemoteOK, Wellfound/AngelList.
  3. **Google Jobs API / Custom Webhooks.**

#### Key Mechanisms
- **Deduplication Engine:** Computes a SHA-256 fingerprint:
  `sha256(normalize(company) + ":" + normalize(title) + ":" + normalize(location_country))`
  Prevents duplicate database insertions across multi-board syndication.
- **Normalization Pipeline:** Extracts salary range, remote flag, seniority tag, and cleanses HTML to Markdown.
- **Vectorization:** Generates 1536-dimensional embedding of `title + " " + company + "\n\n" + description_markdown` and stores in `public.job_listings`.

---

### 2.3 Agent 3: Matching & Scoring Agent

* **Purpose:** Evaluates compatibility between candidate profile and discovered jobs using a 3-stage funnel to minimize LLM compute costs while maximizing precision.
* **Trigger:** Arrival of new `job_listings` or candidate preference update.

#### 3-Stage Evaluation Funnel

```
┌────────────────────────────────────────────────────────┐
│ Stage 1: Hard Deterministic Filters (Zero LLM Cost)     │
│ - Company Blacklist Check                              │
│ - Remote / Location Hard Constraints                   │
│ - Minimum Salary Floor Check ($ >= target)             │
│ - Visa / Work Authorization Hard Mismatch              │
└───────────────────────────┬────────────────────────────┘
                            │ Pass Hard Filters
                            ▼
┌────────────────────────────────────────────────────────┐
│ Stage 2: Semantic Vector Cosine Similarity (Fast)      │
│ - pgvector HNSW Cosine Distance (profile <=> job)      │
│ - Score < 0.65 ➔ Instantly Flag as 'skip'              │
│ - Score >= 0.65 ➔ Advance to Stage 3                   │
└───────────────────────────┬────────────────────────────┘
                            │ Pass Vector Threshold
                            ▼
┌────────────────────────────────────────────────────────┐
│ Stage 3: LLM Precision Fit & Reasoning Pass (Deep)     │
│ - Evaluates nuance: Tech stack stack overlap,          │
│   career trajectory, missing vs required criteria      │
│ - Outputs structured score (0-100) + decision + rationale│
└────────────────────────────────────────────────────────┘
```

#### Match Scoring Formula
$$\text{Final Score} = (\text{Skills Overlap} \times 0.40) + (\text{Experience Alignment} \times 0.30) + (\text{LLM Qualitative Fit} \times 0.30)$$

#### Decision Logic
- **`score >= 85` (Autonomous Autopilot Mode):** Marked as `apply`. Automatically queued for the Application Agent.
- **`70 <= score < 85` (or Semi-Autonomous Mode):** Marked as `needs_review`. Surfaced on candidate dashboard with notification badge.
- **`score < 70`:** Marked as `skip`. Stored for analytics to avoid re-evaluating.

---

### 2.4 Agent 4: Tailoring & Fact-Checker Agent (Anti-Hallucination)

* **Purpose:** Customizes resume bullet points and generates personalized cover letters tailored to the specific role, with a strict automated fact-checker pass.
* **Trigger:** Match decision transitions to `apply` (either autonomously or approved by user).
* **LLM Engine:** Claude 3.5 Sonnet / GPT-4o (High-reasoning model).

#### Anti-Hallucination & Fact-Checking Protocol
To guarantee candidates are never misrepresented, Agent 4 operates as a **two-agent adversarial pair**:

```
 ┌───────────────────────────┐         Draft Resume / Cover Letter         ┌───────────────────────────┐
 │       Drafting Agent      │────────────────────────────────────────────▶│     Fact-Checker Agent    │
 │ (Generates tailored copy  │                                             │ (Strict verification rule │
 │  highlighting real skills)│◀────────────────────────────────────────────│  against master profile)  │
 └───────────────────────────┘               Rejection / Fix Loop          └─────────────┬─────────────┘
                                                                                         │
                                                                                         │ Verified Pass
                                                                                         ▼
                                                                           ┌───────────────────────────┐
                                                                           │  PDF Generator / Storage  │
                                                                           └───────────────────────────┘
```

* **Fact-Checker Non-Negotiable Rule:** Every claim, technology, metric, and previous company name in the generated text MUST have an exact or verifiable semantic precursor in the user's master `parsed_json` profile.
* **Forbidden:** Fabricating years of experience, adding unlisted frameworks, inventing revenue metrics or awards.
* **Output:**
  1. `tailored_resume_pdf`: Rendered via headless Chrome / Typst and saved to `resumes/{user_id}/tailored_{app_id}.pdf`.
  2. `cover_letter_text`: Markdown and plain-text format.
  3. `custom_answers`: Pre-generated answers to standard ATS essay questions (e.g. "Why this company?").

---

### 2.5 Agent 5: Autonomous Browser & Form-Filling Agent

* **Purpose:** Automates the physical submission of job applications on external ATS platforms (Greenhouse, Lever, Workday, LinkedIn Easy Apply).
* **Execution Environment:** Ephemeral Playwright worker sandboxes in Docker containers.

#### ATS Compatibility Matrix
| ATS Platform | Automation Method | Success Rate Target | Human Fallback Trigger |
| :--- | :--- | :--- | :--- |
| **Greenhouse** | Direct REST API or Playwright Web Form | 98% | Custom file upload requirements |
| **Lever** | Playwright Web Form | 96% | Unknown required dropdown options |
| **Ashby** | Public GraphQL / Playwright Form | 97% | Complex portfolio prompt |
| **LinkedIn Easy Apply** | Playwright Session Sandbox | 90% | SMS 2FA or CAPTCHA challenge |
| **Workday** | Playwright Guided Multi-Page Flow | 82% | Re-login required or dynamic CAPTCHA |

#### Execution & Safeguards Flow
1. **Rate Limiting & Human Jitter:** Uses randomized human-like delays (300ms–1200ms between interactions) and realistic mouse curve paths.
2. **Field Auto-Mapper:**
   - Detects form field semantics (`name`, `email`, `phone`, `resume_upload`, `linkedin_url`, `portfolio_url`, `salary_expectation`, `notice_period`).
   - Pulls exact answers from `profiles.standard_answers`.
3. **Safety / CAPTCHA Guardrail (Zero-Bypass Policy):**
   - If a CAPTCHA, Cloudflare turnstile, or unfamiliar 2FA is encountered, the agent **STOPS IMMEDIATELY**.
   - Captures high-res screenshot and DOM snapshot.
   - Sets application state to `needs_review` with alert: *"Human verification required on LinkedIn"*.
   - Sends real-time notification to the user's dashboard and email.
4. **Proof Capture:**
   - Takes full-page screenshot of the final "Application Submitted Successfully" confirmation page.
   - Stores proof in Supabase bucket `audit-artifacts/{user_id}/{app_id}_proof.png`.

---

### 2.6 Agent 6: Application Tracker & Inbound Status Agent

* **Purpose:** Monitors candidate communication channels to update application statuses automatically throughout the hiring lifecycle.
* **Trigger:** Inbound email webhooks, periodic ATS status polling, or user manual override.

#### Detection Capabilities
- **Email Classifier:** Parses inbound recruiter emails via SendGrid / Postmark inbound parse webhook:
  - `APPLICATION_RECEIVED` (Maintains status `applied`)
  - `ASSESSMENT_INVITATION` (Transitions to `assessment`, alerts candidate with test deadline)
  - `INTERVIEW_REQUEST` (Transitions to `interview`, extracts recruiter Calendly/booking link)
  - `REJECTION_NOTICE` (Transitions to `rejected`, extracts polite feedback if available)
  - `OFFER_EXTENDED` (Transitions to `offer`, celebratory UI banner)
- **Supabase Realtime Broadcast:** Pushes status change to client websocket, triggering instant Kanban card move and notification toast.

---

### 2.7 Agent 7: Orchestrator & Concurrency Governor

* **Purpose:** Master state machine supervising task dispatching, user tier quota enforcement, error recovery, and system health.
* **Engine:** Temporal Workflow Engine or Celery + Redis distributed task queue.

#### Daily Quota & Tier Enforcement Matrix
```typescript
async function validateUserQuota(userId: string): Promise<boolean> {
  const profile = await getProfileWithSubscription(userId);
  const today = new Date().toISOString().split('T')[0];
  
  const dailyCount = await getDailyApplicationCount(userId, today);
  const dailyLimit = profile.subscription.tier === 'autopilot' ? 50 : 
                     profile.subscription.tier === 'pro' ? 20 : 3;

  if (dailyCount >= dailyLimit) {
    await logAgentEvent({
      userId,
      event: 'QUOTA_REACHED',
      details: `Daily cap of ${dailyLimit} reached. Resuming tomorrow at 00:00 UTC.`
    });
    return false;
  }
  return true;
}
```

---

## 3. Inter-Agent State Machine & Lifecycle Transitions

```
[DISCOVERED]
     │
     ▼ (Agent 3: Matching)
┌─────────────┐
│ MATCH SCORE │
└──────┬──────┘
       ├── Score < 70 ──────────────────────────────────────────▶ [SKIPPED]
       ├── 70 <= Score < 85 (or Manual Mode) ───────────────────▶ [NEEDS_REVIEW]
       │                                                                │ User Approves
       └── Score >= 85 (Autopilot Mode)                                 │
             │                                                          │
             └──────────────────────┬───────────────────────────────────┘
                                    │
                                    ▼ (Agent 4: Tailoring)
                             [TAILORING_ASSETS]
                                    │
                                    ▼ (Agent 4: Fact-Checker Verified)
                             [READY_TO_SUBMIT]
                                    │
                                    ▼ (Agent 5: Browser Worker)
                             [SUBMITTING]
                                    ├── Encountered CAPTCHA ────▶ [PAUSED_NEEDS_HUMAN]
                                    ├── Network/Selector Fail ──▶ [RETRY_BACKOFF]
                                    └── Success Proof Captured
                                          │
                                          ▼
                                      [APPLIED]
                                          │
                                          ▼ (Agent 6: Tracker)
                             ┌────────────┴────────────┐
                             ▼                         ▼
                      [INTERVIEWING]               [REJECTED]
                             │
                             ▼
                         [OFFER]
```

---

## 4. LLM Routing & Cost Optimization Strategy

To ensure high SaaS gross margins (>75%), LLM inference is strictly tiered based on complexity:

| Agent Task | Selected Model | Target Latency | Est. Cost / Run |
| :--- | :--- | :--- | :--- |
| Resume JSON Extraction | GPT-4o-mini / Haiku 3.5 | < 2.0s | $0.0015 |
| Vector Embeddings | OpenAI `text-embedding-3-small` | < 150ms | $0.00002 |
| Semantic Job Filtering | Pure Vector Math (HNSW) | < 10ms | $0.00000 |
| Match Scoring & Rationale | Claude 3.5 Haiku | < 1.0s | $0.0010 |
| Resume Tailoring & Bullets | Claude 3.5 Sonnet | < 4.0s | $0.0150 |
| Fact-Checking Verification | Claude 3.5 Haiku | < 1.5s | $0.0020 |
| Form Field Semantic Resolver | GPT-4o-mini | < 800ms | $0.0008 |
| Email Inbound Parsing | GPT-4o-mini | < 800ms | $0.0005 |

**Blended Cost Per Automated Application:** ~**$0.021** (Allows profitable unit economics on $29/mo and $79/mo subscription pricing).

---

## 5. Security, Privacy & Compliance Guardrails

1. **Multi-Tenant RLS Isolation:** All agent tasks carry the authenticated `user_id` injected from Clerk session tokens. PostgreSQL RLS prevents any cross-tenant data leakage.
2. **Encrypted Credentials Store:** User platform credentials (e.g. LinkedIn login cookies) are encrypted via AES-GCM-256 with keys managed in Supabase Vault or AWS KMS.
3. **No Training on User Data:** Explicit zero-data retention agreements with LLM providers (Anthropic and OpenAI API terms guarantee user resumes are never used for model training).
4. **Emergency Stop Button:** Global client-side kill switch on the dashboard instantly aborts all running Playwright workers and queues via Redis pub/sub.
5. **Human-in-the-Loop Override:** Users can toggle between **Full Autopilot** (auto-applies when score ≥ 85%) and **Assisted Pilot** (prepares all assets but requires manual approval click).
