# System Constraints & Compliance Specification: AI Job Hunt SaaS

**Version:** 1.0 | **Companion to:** `architecture.md`, `agents.md`, `trd.md`, `prd.md`, `ui-rules.md` | **Status:** Enforced Standard

---

## 1. Overview & Constraint Categorization

The **JobHunt AI** platform operates within strict technical, legal, operational, and ethical boundaries. These constraints are non-negotiable guidelines designed to protect candidate accounts, ensure legal compliance, maintain multi-tenant data privacy, and guarantee SaaS profitability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE CONSTRAINT PILLARS                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Platform &     │ 2. AI Integrity & │ 3. Multi-Tenant                │
│    Anti-Bot Legal │    Anti-Hype      │    Security & Privacy          │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 4. Tech Stack &   │ 5. Performance,   │ 6. Cost & Unit                 │
│    Integration    │    A11y & UI/UX   │    Economics (SaaS)            │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 2. Platform Connectors & Anti-Bot Constraints (Legal & Operational)

### 2.1 The Zero-Bypass CAPTCHA Policy (Mandatory)
* **Hard Rule:** Under **NO CIRCUMSTANCES** shall the Playwright browser automation worker attempt to solve, crack, or bypass CAPTCHAs, Cloudflare Turnstiles, Arkose Labs challenges, or SMS/2FA prompts.
* **Failure Protocol:**
  1. The browser worker detects the challenge element.
  2. The worker immediately halts form execution.
  3. Captures a high-resolution screenshot and DOM snapshot for user reference.
  4. Transitions the application record to `needs_review` with flag `reason: 'CAPTCHA_DETECTED'`.
  5. Pushes an urgent real-time alert to the candidate's dashboard and email: *"Human action required to finalize application on [Platform]"*.

### 2.2 Rate Limiting & Human Jitter
To prevent candidate LinkedIn, Greenhouse, or Workday accounts from being flagged or banned:
* **Submission Concurrency:** Max **1 active Playwright browser instance per user** at any time.
* **Human-like Jitter:** Artificial randomized delays between keyboard inputs (40ms–110ms) and step transitions (400ms–1500ms).
* **Platform Ingestion Caps:**
  * LinkedIn: Max 20 auto-submissions per 24-hour rolling window.
  * Greenhouse / Lever / Ashby: Max 50 submissions per day.
  * Workday: Max 15 submissions per day (due to multi-page complexity).

### 2.3 Credential Storage & Encryption
* Candidate login sessions and platform cookies must **NEVER** be stored in plaintext.
* Must be encrypted using **AES-256-GCM** before writing to Supabase, with encryption keys managed via server-side environment variables or AWS KMS.

---

## 3. AI Integrity & Anti-Hallucination Constraints

### 3.1 Strict Automated Fact-Checker Pass
* **Zero Fabrications:** The Tailoring Agent (Agent 4) is forbidden from inventing skills, adding non-existent employers, fabricating certifications, or inflating years of experience.
* **Deterministic Verification Loop:**
  * Generated resume bullets and cover letters must be cross-checked against the user's master `parsed_json` profile before submission.
  * If a bullet claims proficiency in a framework or metric not present in the master profile, the fact-checker rejects the draft and forces regeneration.
* **Metric Preservation:** Candidates' original numbers (e.g., "Led team of 6 engineers", "Decreased load times by 32%") must be preserved verbatim or accurately contextualized.

### 3.2 Human-in-the-Loop (HITL) Thresholds
* **Match Score 70% – 84%:** Must be held in `needs_review` queue; cannot auto-submit without user click.
* **Custom Essay Questions:** If an application asks open-ended cultural or subjective questions (e.g., *"Describe a time you resolved a conflict"*), the draft answer must be displayed for user review unless explicitly pre-authorized in the user's `standard_answers` bank.

---

## 4. Multi-Tenant Architecture & Security Constraints

### 4.1 Identity & Authentication (Clerk)
* Clerk is the **exclusive identity provider**. No custom auth or native username/password storage in Supabase.
* All backend API requests must validate Clerk JWT session tokens (`clerkClient.verifyToken()`).
* Clerk user lifecycle webhooks (`user.created`, `user.deleted`) must be cryptographically verified using `svix` and `CLERK_WEBHOOK_SECRET`.

### 4.2 Database Multi-Tenancy & Row-Level Security (Supabase)
* **RLS is Non-Optional:** Every public table in Supabase (`profiles`, `job_listings`, `applications`, `match_decisions`, `activity_log`, `subscriptions`) must have RLS enabled.
* Tenant isolation is enforced via Clerk JWT claims:
  ```sql
  CREATE POLICY "Users can only access own data"
    ON public.applications
    FOR ALL
    USING (auth.jwt() ->> 'sub' = (SELECT clerk_user_id FROM public.users WHERE id = user_id));
  ```
* Under no circumstances may client-side queries use the `SUPABASE_SERVICE_ROLE_KEY`. Service role keys are restricted strictly to server-only webhook handlers and background worker daemons.

### 4.3 Stripe Billing & Quota Constraints
* **Quota Enforcement:** The Orchestrator MUST check subscription status and daily usage balance prior to launching any Application Agent job:
  * **Free Trial:** Max 3 applications total.
  * **Pro ($29/mo):** Max 20 applications / day.
  * **Autopilot ($79/mo):** Max 50 applications / day.
* If a Stripe subscription enters `past_due`, `canceled`, or `unpaid`, agent execution must pause immediately without deleting user data.

---

## 5. UI/UX Pro Max & Frontend Constraints

### 5.1 Strict Anti-Patterns (HIGH Severity)
* **Zero Emojis as Icons:** All UI icons must be SVG from `lucide-react`. Never use emojis (e.g., 🤖, 💼, ⚡, ❌) for UI controls or status badges.
* **Interactive Affordance:** Every clickable row, card, button, and badge MUST have `cursor-pointer`.
* **Zero Layout Shift (CLS = 0):** All data-fetching components must render dimensional skeleton placeholders (`<Skeleton className="h-48" />`) matching final rendered elements.
* **Semantic Components:** Direct `<div onClick>` is forbidden; always use semantic `<button>` or Radix UI primitives.
* **Feedback on Submit:** All action buttons must reflect loading / disabled state within **50ms** of user click.

### 5.2 The 3-Tier Animation Discipline
* **Tailwind CSS:** Micro-states, hover lift, focus rings, utility keyframes.
* **Framer Motion:** Component lifecycle (`AnimatePresence`), slide-over drawers, physics-based Kanban drag-and-drop.
* **GSAP:** Landing page scroll-pinned timelines and number count-up tickers. Never mix GSAP into reactive component state.

### 5.3 Accessibility (WCAG 2.1 AA)
* Minimum contrast ratio of **4.5:1** for normal text and **3:1** for large text against dark OLED backgrounds (`#020617` / `#0B0F19`).
* Full keyboard tab navigation with visible `focus-visible:ring-2 focus-visible:ring-indigo-500` rings.
* Strict `prefers-reduced-motion` compliance across all animations.

---

## 6. LLM Inference & Unit Economics Constraints

### 6.1 Provider & Model Strategy
* **Primary LLM:** OpenAI-compatible **NVIDIA NIM** endpoint (`https://integrate.api.nvidia.com/v1`) using `nvidia/llama-3.1-nemotron-70b-instruct`.
* **Zero Lock-In Architecture:** All LLM calls must route through an OpenAI-standard SDK abstraction with `baseURL` and `apiKey` injected from environment variables (`NVIDIA_BASE_URL`, `NVIDIA_API_KEY`), allowing seamless fallback to Groq, Anthropic, or OpenAI.
* **Semantic Search Embeddings:** `pgvector` 1536-dimensional embeddings for cosine similarity.

### 6.2 Target Cost & Latency Budgets
| Operation | Model / Tool | Latency Budget | Max Cost Budget |
| :--- | :--- | :--- | :--- |
| Resume JSON Extraction | Nemotron / Haiku | < 3.0s | $0.002 |
| Semantic Match Scoring | pgvector + Nemotron | < 1.2s | $0.001 |
| Resume Tailoring | Nemotron 70B | < 4.5s | $0.015 |
| Fact-Checking Pass | Nemotron 70B | < 2.0s | $0.003 |
| Form Field Mapping | Rule engine / LLM | < 500ms | $0.0005 |
| **Total Automated Application** | — | **< 15.0s** | **≤ $0.025** |

*Target Unit Economics:* At ≤ $0.025 per application, 50 applications cost ~$1.25 in compute, yielding **>85% gross margins** on the $79/mo subscription.

---

## 7. Constraint Verification Checklist

Before deploying any feature or agent iteration:

- [ ] Does Playwright strictly pause and alert on CAPTCHA / 2FA without attempting bypass?
- [ ] Are all candidate platform credentials encrypted with AES-256-GCM?
- [ ] Is Supabase RLS enabled with Clerk JWT verification on all tables?
- [ ] Does the tailoring agent have an active fact-checking verification step?
- [ ] Does the UI strictly use Lucide-React SVG icons (zero emojis)?
- [ ] Do all data queries reserve dimensions to enforce zero layout shift (CLS = 0)?
- [ ] Is the LLM client decoupled via OpenAI-compatible environment variables?
- [ ] Are Stripe subscription limits verified before any agent job dispatches?
