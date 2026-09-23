# Low-Level System Design: AI Job Hunt Agents SaaS Platform

**Version:** 1.0 (Draft) | **Companion to:** PRD.md, TRD.md, ARCHITECTURE.md, SYSTEM-DESIGN.md | **Status:** For Review

---

## 1. Database Schema & Supabase RLS (PostgreSQL DDL)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Users Table (Synchronized from Clerk via Webhook)
CREATE TABLE public.users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id          TEXT UNIQUE NOT NULL,            -- e.g., 'user_2xyz...'
  email             TEXT UNIQUE NOT NULL,
  first_name        TEXT,
  last_name         TEXT,
  image_url         TEXT,
  status            TEXT NOT NULL DEFAULT 'active',   -- active | suspended | deleted
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);

-- 2. Subscriptions Table (Synchronized from Stripe via Webhooks)
CREATE TABLE public.subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id        TEXT UNIQUE NOT NULL,
  stripe_subscription_id    TEXT UNIQUE,
  plan_tier                 TEXT NOT NULL DEFAULT 'free_trial', -- free_trial | starter | pro | power
  status                    TEXT NOT NULL DEFAULT 'active',     -- trialing | active | past_due | canceled | unpaid
  monthly_quota             INT NOT NULL DEFAULT 5,
  monthly_applications_used INT NOT NULL DEFAULT 0,
  daily_cap                 INT NOT NULL DEFAULT 5,
  daily_applications_used   INT NOT NULL DEFAULT 0,
  current_period_start      TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end        TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT false,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- 3. Idempotency Table for Stripe Webhooks
CREATE TABLE public.processed_stripe_events (
  event_id          TEXT PRIMARY KEY,
  event_type        TEXT NOT NULL,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Profiles Table (Resume & Search Preferences)
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_url        TEXT,                            -- Supabase Storage signed/public path
  parsed_json       JSONB NOT NULL DEFAULT '{}',     -- skills, experience[], education[], projects[], links{}
  preferences       JSONB NOT NULL DEFAULT '{}',     -- roles[], locations[], salary_min, remote_ok
  standard_answers  JSONB NOT NULL DEFAULT '{}',     -- screening question answer bank
  rules             JSONB NOT NULL DEFAULT '{}',     -- blacklist_companies[], autonomy_mode
  embedding         VECTOR(1536),                    -- pgvector profile embedding
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. Job Listings Table (Normalized cross-platform listings)
CREATE TABLE public.job_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform   TEXT NOT NULL,                   -- linkedin | greenhouse | lever | indeed | workday
  external_id       TEXT NOT NULL,
  url               TEXT NOT NULL,
  title             TEXT NOT NULL,
  company           TEXT NOT NULL,
  location          TEXT,
  is_remote         BOOLEAN NOT NULL DEFAULT false,
  salary_min        NUMERIC,
  salary_max        NUMERIC,
  salary_currency   TEXT DEFAULT 'USD',
  description_raw   TEXT,
  description_parsed JSONB,
  embedding         VECTOR(1536),                    -- pgvector job description embedding
  posted_at         TIMESTAMPTZ,
  discovered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  dedup_hash        TEXT NOT NULL,                   -- sha256(company + title + location)
  UNIQUE(source_platform, external_id)
);
CREATE INDEX idx_job_listings_dedup_hash ON public.job_listings(dedup_hash);
CREATE INDEX idx_job_listings_embedding ON public.job_listings USING hnsw (embedding vector_cosine_ops);

-- 6. Match Decisions Table
CREATE TABLE public.match_decisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score             NUMERIC NOT NULL,
  score_breakdown   JSONB NOT NULL,                  -- {skills, salary_fit, location_fit, llm_score}
  decision          TEXT NOT NULL,                   -- apply | skip | needs_review
  reasoning_text    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);
CREATE INDEX idx_match_decisions_user_decision ON public.match_decisions(user_id, decision);

-- 7. Applications Table
CREATE TABLE public.applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'discovered',
  -- discovered | matched | queued | applied | needs_review | viewed | interview | offer | rejected | withdrawn | failed
  submitted_content JSONB,                           -- {resume_url, cover_letter_text, qa_answers[]}
  confirmation_ref  TEXT,
  screenshot_url    TEXT,                            -- Supabase Storage URL for audit proof
  failure_reason    TEXT,
  retry_count       INT NOT NULL DEFAULT 0,
  submitted_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
CREATE INDEX idx_applications_user_status ON public.applications(user_id, status);

-- 8. Application Status History Table
CREATE TABLE public.application_status_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status            TEXT NOT NULL,
  source            TEXT NOT NULL,                   -- system | user | platform_poll | email_parse
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_history_app ON public.application_status_history(application_id);

-- 9. Activity Log Table (Immutable Audit Trail)
CREATE TABLE public.activity_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id    UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL,
  -- searched | matched | skipped | generated_content | filled_field | submitted | error | captcha_detected
  payload_json      JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_user_time ON public.activity_log(user_id, created_at DESC);

-- 10. Platform Credentials Table (Encrypted)
CREATE TABLE public.platform_credentials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  encrypted_payload BYTEA NOT NULL,                  -- AES-256-GCM encrypted session cookies/tokens
  status            TEXT NOT NULL DEFAULT 'valid',    -- valid | expired | revoked
  last_verified_at  TIMESTAMPTZ,
  UNIQUE(user_id, platform)
);

-- ============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper function to fetch current authenticated user_id from Clerk JWT claim
CREATE OR REPLACE FUNCTION public.requesting_user_id() 
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE clerk_id = (auth.jwt() ->> 'sub');
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

-- Users Policy
CREATE POLICY "Users can view and edit own profile" 
ON public.users FOR ALL USING (id = public.requesting_user_id());

-- Subscriptions Policy
CREATE POLICY "Users can view own subscription" 
ON public.subscriptions FOR SELECT USING (user_id = public.requesting_user_id());

-- Profiles Policy
CREATE POLICY "Users can manage own profile" 
ON public.profiles FOR ALL USING (user_id = public.requesting_user_id());

-- Job Listings Policy (All authenticated users can read listings)
CREATE POLICY "Authenticated users can read listings" 
ON public.job_listings FOR SELECT TO authenticated USING (true);

-- Match Decisions Policy
CREATE POLICY "Users can view own match decisions" 
ON public.match_decisions FOR ALL USING (user_id = public.requesting_user_id());

-- Applications Policy
CREATE POLICY "Users can view and manage own applications" 
ON public.applications FOR ALL USING (user_id = public.requesting_user_id());

-- Activity Log Policy
CREATE POLICY "Users can view own activity log" 
ON public.activity_log FOR SELECT USING (user_id = public.requesting_user_id());

-- Platform Credentials Policy
CREATE POLICY "Users can manage own credentials" 
ON public.platform_credentials FOR ALL USING (user_id = public.requesting_user_id());
```

---

## 2. API Contracts & Webhooks

Base URL: `/api/v1`. Authentication: `Authorization: Bearer <Clerk_JWT>` on all protected endpoints.

### 2.1 Identity & Webhooks (Clerk)
- **POST `/api/webhooks/clerk`**
  - Consumes Svix-signed webhook payloads from Clerk.
  - Events: `user.created`, `user.updated`, `user.deleted`.
  - Actions: Upsert/delete row in `public.users` and initialize a `free_trial` subscription in `public.subscriptions`.

### 2.2 Billing & Subscription Endpoints (Stripe)
- **POST `/api/billing/create-checkout-session`**
  - **Request:** `{ "tier": "pro", "billing_interval": "month" }`
  - **Response (200):** `{ "url": "https://checkout.stripe.com/c/pay/cs_live_..." }`
- **POST `/api/billing/create-portal-session`**
  - **Response (200):** `{ "url": "https://billing.stripe.com/p/session/..." }`
- **POST `/api/webhooks/stripe`**
  - Consumes Stripe webhook events verified with `STRIPE_WEBHOOK_SECRET`.
  - Handled events:
    - `checkout.session.completed`: Upgrade subscription tier, set `monthly_quota = 250`, `status = 'active'`.
    - `customer.subscription.updated`: Update `status`, `current_period_end`, `cancel_at_period_end`.
    - `customer.subscription.deleted`: Set `status = 'canceled'`, drop tier to `free_trial`.
    - `invoice.payment_succeeded`: Reset `monthly_applications_used = 0`.
    - `invoice.payment_failed`: Set `status = 'past_due'`.
- **GET `/api/billing/usage`**
  - **Response (200):**
    ```json
    {
      "plan_tier": "pro",
      "status": "active",
      "monthly_quota": 250,
      "monthly_applications_used": 34,
      "daily_cap": 15,
      "daily_applications_used": 6,
      "current_period_end": "2026-10-23T00:00:00Z"
    }
    ```

### 2.3 Profile & Resume Management (Supabase Storage)
- **POST `/api/profile/resume`**
  - Upload resume binary to Supabase Storage bucket `resumes/<user_id>/resume.pdf`.
  - Triggers asynchronous resume parsing and embedding generation.
  - **Response (202):** `{ "status": "processing", "file_url": "..." }`
- **GET `/api/profile`**
  - **Response (200):** Returns structured parsed JSON, preferences, standard answers, and rules.
- **PATCH `/api/profile`**
  - Partial update of user preferences, rules, or screening answers.

### 2.4 Application Pipeline & Review
- **GET `/api/applications?status=needs_review`**
  - Returns applications awaiting human approval in Review Mode.
- **POST `/api/applications/{id}/approve`**
  - Signals orchestrator to dispatch prepared payload to Playwright execution worker.
- **POST `/api/applications/{id}/reject`**
  - Transitions application status to `withdrawn`.

---

## 3. Core Algorithms

### 3.1 Tiered Match Scoring
```python
def calculate_match_score(job_listing, profile, weights, thresholds):
    # Tier 0: Hard Deterministic Rules
    if violates_blacklist(job_listing.company, profile.rules.blacklist_companies):
        return MatchDecision("skip", 0.0, "Company is blacklisted")
    if job_listing.salary_max and job_listing.salary_max < profile.preferences.salary_min:
        return MatchDecision("skip", 0.0, "Salary below minimum requirement")
    if not is_location_compatible(job_listing, profile.preferences):
        return MatchDecision("skip", 0.0, "Location does not match preferences")

    # Tier 1: pgvector Cosine Similarity
    vector_sim = cosine_similarity(profile.embedding, job_listing.embedding)
    if vector_sim < 0.60:
        return MatchDecision("skip", vector_sim, "Semantic similarity below minimum cutoff")

    # Tier 2: Selective LLM Structured Judgment
    if vector_sim >= thresholds.auto_apply: # e.g. 0.82
        llm_score = vector_sim
        reasoning = "High-confidence skills and experience match."
    else:
        llm_judgment = llm_judge_fit(job_listing, profile)
        llm_score = llm_judgment.score
        reasoning = llm_judgment.reasoning

    final_score = (weights.vector * vector_sim) + (weights.llm * llm_score)
    decision = "apply" if final_score >= thresholds.auto_apply else ("needs_review" if final_score >= thresholds.review else "skip")

    return MatchDecision(decision, final_score, reasoning)
```

### 3.2 Content Fact-Checking Pass
```python
def verify_generated_claims(generated_text: str, profile_data: dict) -> bool:
    extracted_claims = llm_extract_factual_claims(generated_text)
    for claim in extracted_claims:
        if not claim_supported_in_profile(claim, profile_data):
            return False # Reject content: hallucination or unverified claim detected
    return True
```

---

## 4. State Machines

### 4.1 Application Lifecycle
$$\text{discovered} \longrightarrow \text{matched} \longrightarrow \text{queued} \longrightarrow \text{applied} \longrightarrow \text{viewed} \longrightarrow \text{interview} \longrightarrow \text{offer}$$
$$\text{queued} \longrightarrow \text{needs\_review} \longrightarrow (\text{approved} \rightarrow \text{applied}) \mid (\text{rejected} \rightarrow \text{withdrawn})$$
$$\text{queued / applied} \longrightarrow \text{failed (on unrecoverable block/error)}$$

### 4.2 Stripe Subscription Lifecycle
$$\text{free\_trial} \longrightarrow \text{active} \longleftrightarrow \text{past\_due}$$
$$\text{active} \longrightarrow \text{canceled} \longrightarrow \text{free\_trial}$$