# Build Plan: Autonomous AI Job Hunt SaaS (Loop Engineering Methodology)

**Version:** 1.0 | **Framework:** Loop Engineering (Inner ➔ Integration ➔ Outer ➔ E2E Hardening)  
**Status:** Approved Implementation Blueprint | **Companion to:** `user-flow.md`, `agents.md`, `architecture.md`, `ui-rules.md`

---

## 1. Loop Engineering Methodology Explained

**Loop Engineering** decomposes development into 5 concentric, testable feedback loops. Each loop must achieve **100% verification** before the next loop begins. No unverified assumptions are permitted to bubble up into outer layers.

```
┌────────────────────────────────────────────────────────────────────────┐
│  LOOP 4: OUTER EXPERIENCE LOOP (UI/UX Pro Max, Bento Grid, Motion)    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  LOOP 3: WORKER & SAFETY LOOP (Playwright Sandboxes, Zero-Bypass)│  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  LOOP 2: DATA & BILLING LOOP (Supabase RLS, Stripe, Auth)  │  │  │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  LOOP 1: CORE AI ENGINE LOOP (Nemotron, Agents, Fact) │  │  │  │
│  │  │  │  ┌────────────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  LOOP 0: FOUNDATION & CONTRACTS (React + Vite, Types)│  │  │  │  │
│  │  │  │  └────────────────────────────────────────────────┘  │  │  │  │
│  │  │  └──────────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                 LOOP 5: E2E VERIFICATION & PRODUCTION DEPLOY
```

---

## 2. Phase-by-Phase Build Specification

---

### 🔁 LOOP 0: Foundation, Types & Tooling Setup
> **Goal:** Create the core **React (Vite + TypeScript)** project structure, install dependencies, configure type definitions, and validate environment secrets.

#### Step 0.1: Initialize React + Vite Project
* **Action:** Initialize Vite with React and TypeScript template.
* **Commands:**
  ```bash
  # Initialize React with Vite + TypeScript
  pnpm create vite . --template react-ts
  ```
* **Packages to Install:**
  ```bash
  # Frontend UI & Routing
  pnpm add react-router-dom @clerk/clerk-react @supabase/supabase-js @stripe/stripe-js @tanstack/react-query @tanstack/react-virtual lucide-react framer-motion gsap clsx tailwind-merge zod

  # Styling & Dev Dependencies
  pnpm add -D tailwindcss @tailwindcss/vite postcss autoprefixer prettier prettier-plugin-tailwindcss @types/node

  # Backend / Server Services (for Stripe webhooks, Clerk webhooks & Playwright worker)
  pnpm add express cors dotenv stripe openai svix
  pnpm add -D @types/express @types/cors tsx
  ```

#### Step 0.2: Configure Environment Secret Schema (`src/lib/env.ts`)
* **Action:** Create type-safe Zod environment validation for `VITE_` client variables and server variables:
  - Client: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
  - Server: `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NVIDIA_API_KEY`.
* **Target File:** `src/lib/env.ts`

#### Step 0.3: Define Shared Domain Types (`src/types/index.ts`)
* **Target File:** `src/types/index.ts`
* **Defines:** `CandidateProfile`, `JobListing`, `MatchDecision`, `ApplicationStatus`, `SubscriptionTier`, `AgentLogEvent`.

---

### 🔁 LOOP 1: Core AI & Multi-Agent Engine (Inner Execution Loop)
> **Goal:** Build and test all AI agents in pure isolation with mock data and the live NVIDIA Nemotron API before connecting databases or UI.

#### Step 1.1: Build Unified OpenAI-Compatible AI Client (`lib/ai/client.ts`)
* **Target File:** `lib/ai/client.ts`
* **Implementation:** Standard OpenAI client configured with `NVIDIA_BASE_URL` (`https://integrate.api.nvidia.com/v1`) and `NVIDIA_API_KEY`.
* **Verification:** Run a standalone Node.js test script to confirm chat completion returns valid JSON from `nvidia/llama-3.1-nemotron-70b-instruct`.

#### Step 1.2: Agent 1 — Resume Parsing Engine (`lib/agents/parser.ts`)
* **Input:** Raw resume text / PDF buffer.
* **Output:** Validated `CandidateProfile` JSON matching Zod schema.
* **Verification:** Feed sample resume text and assert that `skills`, `experience`, and `education` arrays are non-empty.

#### Step 1.3: Agent 2 — Discovery & Deduplication Engine (`lib/agents/discovery.ts`)
* **Input:** Raw job postings from mock ATS feeds (Greenhouse / Lever sample JSONs).
* **Output:** Normalized `JobListing` with `dedup_hash = sha256(company:title:location)`.
* **Verification:** Test that two identical job posts from different feeds resolve to the exact same hash.

#### Step 1.4: Agent 3 — 3-Stage Match Scoring Engine (`lib/agents/matcher.ts`)
* **Stage 1:** Hard deterministic filters (salary floor, remote requirement, company blacklist).
* **Stage 2:** Cosine similarity calculation between profile and job vectors.
* **Stage 3:** Nemotron qualitative fit reasoning with structured JSON response `{ score: number, breakdown: object, decision: string, rationale: string }`.
* **Verification:** Unit test asserting high score for matching tech stack and `skip` for salary mismatch.

#### Step 1.5: Agent 4 — Tailoring & Fact-Checker Adversarial Loop (`lib/agents/tailor.ts`)
* **Target File:** `lib/agents/tailor.ts`
* **Sub-agents:**
  1. `DraftingAgent`: Generates customized bullet points and tailored cover letter.
  2. `FactCheckerAgent`: Cross-examines every bullet against the master profile JSON.
* **Verification Gate:** Inject an intentionally fabricated skill (e.g., "Invented 10 years of Rust") and assert that `FactCheckerAgent` rejects and forces revision.

---

### 🔁 LOOP 2: Supabase Data, Multi-Tenancy & Stripe Billing Loop
> **Goal:** Establish secure multi-tenant PostgreSQL storage with Row-Level Security, vector search indexes, and Stripe monetization.

#### Step 2.1: Supabase Database Migrations & RLS Policies (`supabase/migrations/`)
* **Target File:** `supabase/migrations/20260923_init_schema.sql`
* **Tables Created:**
  - `users`: Synchronized with Clerk `user.created` webhook.
  - `profiles`: Resume JSON, preferences, answer bank, `vector(1536)` embedding.
  - `job_listings`: Cross-platform job index with HNSW vector index.
  - `match_decisions`: Scored pairings with reasoning.
  - `applications`: Kanban state machine records.
  - `subscriptions`: Stripe plan state and daily quota counters.
  - `activity_log`: Immutable agent audit events.
* **Verification Gate:** Query `applications` with a non-matching Clerk JWT and confirm PostgreSQL returns `0` rows (RLS privacy verified).

#### Step 2.2: Clerk User Synchronization Webhook (`app/api/webhooks/clerk/route.ts`)
* **Target File:** `app/api/webhooks/clerk/route.ts`
* **Implementation:** Verifies `svix` headers, handles `user.created` and `user.deleted`, syncing to Supabase `public.users`.

#### Step 2.3: Stripe Checkout & Webhook Engine (`app/api/billing/`)
* **Target Files:**
  - `app/api/billing/create-checkout/route.ts`: Creates Stripe session for Pro ($29) or Autopilot ($79).
  - `app/api/billing/portal/route.ts`: Generates self-service Customer Portal session.
  - `app/api/webhooks/stripe/route.ts`: Verifies `stripe-signature`, handles `checkout.session.completed`, `customer.subscription.updated`, and `invoice.payment_failed`.
* **Verification Gate:** Use Stripe CLI (`stripe trigger checkout.session.completed`) and assert `subscriptions` table updates.

#### Step 2.4: Daily Quota Enforcement Middleware (`lib/billing/quota.ts`)
* **Implementation:** Enforces daily limits (Free: 3 total, Pro: 20/day, Autopilot: 50/day).
* **Verification:** Test that user with 20 applications on Pro is halted from launching job #21.

---

### 🔁 LOOP 3: Playwright Browser Worker & Anti-Bot Safety Loop
> **Goal:** Build the isolated browser automation worker that fills out job applications with human-like jitter and strict zero-bypass CAPTCHA safety.

#### Step 3.1: Playwright Sandbox Worker Architecture (`lib/workers/playwright.ts`)
* **Target File:** `lib/workers/playwright.ts`
* **Configuration:** Headless Chromium, isolated ephemeral browser context per job, randomized user-agents.
* **Human Jitter Protocol:** Artificial delay generator (40ms–110ms per keystroke, 400ms–1500ms between page actions).

#### Step 3.2: Universal Form Field Semantic Resolver (`lib/workers/form-filler.ts`)
* **Target File:** `lib/workers/form-filler.ts`
* **Logic:** Inspects `<input>`, `<select>`, `<textarea>`, matching against candidate standard answers (Name, Email, Phone, LinkedIn, Visa status).

#### Step 3.3: Zero-Bypass CAPTCHA & Challenge Guardrail
* **Logic:** Continuously inspects DOM for Cloudflare Turnstile, hCaptcha, reCAPTCHA, and 2FA triggers.
* **On Detection:**
  1. Halts execution immediately.
  2. Captures screenshot to `audit-artifacts/{user_id}/{app_id}_captcha.png`.
  3. Updates application status to `needs_review`.
* **Verification Gate:** Run against a mock test page with a dummy CAPTCHA element and assert execution terminates with status `needs_review`.

#### Step 3.4: Confirmation Proof Capture & Storage
* **Logic:** On successful submission page, captures full-page screenshot and saves signed URL into Supabase `applications.proof_screenshot_url`.

---

### 🔁 LOOP 4: Frontend Command Center & UI/UX Pro Max (Outer Loop)
> **Goal:** Assemble the complete user interface following the UI/UX Pro Max design system tokens, zero-CLS skeleton loaders, and 3-tier animation rules.

#### Step 4.1: Design System Tokens & Base CSS (`src/index.css`, `tailwind.config.ts`)
* **Configuration:** OLED Dark Base (`#020617`), Indigo/AI Violet accents (`#6366F1`), Emerald Green CTAs (`#22C55E`), `Inter` UI font, and `Fira Code` tabular numbers.
* **Component Primitives:** `Button.tsx`, `GlassCard.tsx`, `AgentPulse.tsx`, `Skeleton.tsx`.

#### Step 4.2: Public Landing Page (`src/pages/LandingPage.tsx`)
* **Components:**
  - Sticky glass header with Clerk `<SignInButton>` / `<SignUpButton>`.
  - Hero with GSAP headline timeline and live interactive ATS simulation card.
  - 6-Card Bento Grid Showcase.
  - Pinned GSAP ScrollTrigger 3-step feature scrub.
  - Stripe pricing matrix with monthly/annual toggle.

#### Step 4.3: 4-Step Onboarding Wizard (`src/pages/OnboardingPage.tsx`)
* **Components:**
  - Step 1: Resume drag-and-drop with instant parsing preview.
  - Step 2: Target roles, location, and salary floor slider.
  - Step 3: Screening Q&A answer bank.
  - Step 4: Autopilot mode selector.

#### Step 4.4: Command Center Dashboard (`src/pages/DashboardPage.tsx`)
* **Components:**
  - Agent Control Bar with emergency kill switch and live pulsing indicator.
  - 4 Stat Bento Cards with GSAP number tickers.
  - Application Funnel Sankey / Area Chart (dynamically lazy loaded via `React.lazy`).
  - Real-Time Agent Stream Console with auto-scroll and pause-on-hover.
  - Pending Human Review Queue with 1-click approve buttons.

#### Step 4.5: Applications Pipeline Kanban (`src/pages/ApplicationsPage.tsx`)
* **Components:**
  - 6-Column Kanban board with Framer Motion drag physics.
  - Optimistic status updates on card drop.
  - Slide-over `ApplicationDetailSheet` displaying match breakdown and confirmation screenshot proof.

---

### 🔁 LOOP 5: End-to-End Hardening, Testing & Deployment
> **Goal:** Validate the entire SaaS lifecycle from sign-up to automated submission, run security audits, and deploy to production.

#### Step 5.1: End-to-End Flow Verification Script
* **Test Flow:**
  1. Mock user registers via Clerk test credentials.
  2. Uploads sample resume ➔ Parsed into JSON.
  3. Scrapes mock Greenhouse listing ➔ Match score 91% generated via Nemotron.
  4. Tailors resume bullets ➔ Passes Fact-Checker verification.
  5. Playwright worker fills application ➔ Captures confirmation screenshot.
  6. Application appears on Kanban board in `Applied` column.

#### Step 5.2: Security & Accessibility Quality Audit
* **Checklist:**
  - [ ] Run Trufflehog secret leak scanner (`trufflehog filesystem .`).
  - [ ] Run Lighthouse audit (Performance ≥ 90, Accessibility = 100, Best Practices = 100).
  - [ ] Verify Zero Layout Shift (CLS = 0) across all route loading states.
  - [ ] Test `prefers-reduced-motion` compliance.

#### Step 5.3: Production Deployment to Vercel & GitHub Actions
* **Actions:**
  - Configure GitHub repository secrets listed in `context/github.md`.
  - Link repository to Vercel for automated preview and production deployments.
  - Execute initial production release on branch `main`.

---

## 3. Progress Tracking Dashboard

| Loop | Phase Name | Status | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **Loop 0** | Foundation & Types | ⏳ Ready to Start | `pnpm typecheck` passes with zero errors |
| **Loop 1** | Core AI & Agents | ⏳ Queued | Fact-checker blocks 100% of hallucinations |
| **Loop 2** | Supabase & Stripe | ⏳ Queued | RLS blocks cross-tenant access; Stripe webhooks sync |
| **Loop 3** | Playwright Worker | ⏳ Queued | CAPTCHA immediately pauses and alerts user |
| **Loop 4** | UI/UX Pro Max UI | ⏳ Queued | Zero-CLS skeletons; 60 FPS Kanban drag-and-drop |
| **Loop 5** | E2E Hardening & Deploy | ⏳ Queued | Full autonomous run verified; Vercel deployment live |
