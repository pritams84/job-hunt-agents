-- ==============================================================================
-- JobHunt AI: Initial Database Schema, RLS Policies, Indexes & Vector Setup
-- Companion to: architecture.md, low-level-system-design.md
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Users Table (Synchronized with Clerk via Webhooks)
CREATE TABLE IF NOT EXISTS public.users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id          TEXT UNIQUE NOT NULL,
  email             TEXT NOT NULL,
  first_name        TEXT,
  last_name         TEXT,
  image_url         TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 3. Profiles Table (Parsed Resume JSON & User Preferences)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_url        TEXT,                                -- Supabase Storage private path
  parsed_json       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Structured skills, work history, education
  preferences       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Target roles, remote preference, salary floor
  standard_answers  JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Visa, notice period, portfolio links
  rules             JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Blacklist companies, autonomy mode
  embedding         VECTOR(1536),                        -- pgvector profile embedding
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_profiles_user_id UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 4. Job Listings Table (Cross-Platform Ingestion Feed)
CREATE TABLE IF NOT EXISTS public.job_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform   TEXT NOT NULL,                       -- linkedin | greenhouse | lever | indeed | workday
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
  embedding         VECTOR(1536),                        -- pgvector job description embedding
  posted_at         TIMESTAMPTZ,
  discovered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  dedup_hash        TEXT NOT NULL,                       -- sha256(company + ":" + title + ":" + location)
  CONSTRAINT uq_job_listings_platform_ext_id UNIQUE(source_platform, external_id),
  CONSTRAINT uq_job_listings_dedup_hash UNIQUE(dedup_hash)
);
CREATE INDEX IF NOT EXISTS idx_job_listings_dedup_hash ON public.job_listings(dedup_hash);
CREATE INDEX IF NOT EXISTS idx_job_listings_company ON public.job_listings(company);
CREATE INDEX IF NOT EXISTS idx_job_listings_discovered_at ON public.job_listings(discovered_at DESC);

-- HNSW Cosine Distance Index for High-Speed Vector Similarity
CREATE INDEX IF NOT EXISTS idx_job_listings_embedding_hnsw 
  ON public.job_listings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. Match Decisions Table (Scores & Reasoning per User-Job Pair)
CREATE TABLE IF NOT EXISTS public.match_decisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score             NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  score_breakdown   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {skills, salary_fit, location_fit, llm_score}
  decision          TEXT NOT NULL CHECK (decision IN ('apply', 'needs_review', 'skip')),
  reasoning_text    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_match_decisions_job_user UNIQUE(job_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_match_decisions_user_decision ON public.match_decisions(user_id, decision);
CREATE INDEX IF NOT EXISTS idx_match_decisions_user_score ON public.match_decisions(user_id, score DESC);

-- 6. Applications Table (Kanban Pipeline & Automation Records)
CREATE TABLE IF NOT EXISTS public.applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id                UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'discovered' CHECK (
    status IN ('discovered', 'matched', 'queued', 'applied', 'needs_review', 'interviewing', 'offer', 'rejected', 'failed')
  ),
  match_score           NUMERIC,
  tailored_resume_url   TEXT,
  cover_letter_text     TEXT,
  custom_answers        JSONB DEFAULT '{}'::jsonb,
  proof_screenshot_url  TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_applications_user_job UNIQUE(user_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON public.applications(updated_at DESC);

-- 7. Subscriptions Table (Stripe Plan Quota Management)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id        TEXT NOT NULL,
  stripe_subscription_id    TEXT,
  plan_tier                 TEXT NOT NULL DEFAULT 'free_trial' CHECK (plan_tier IN ('free_trial', 'starter', 'pro', 'power')),
  status                    TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  monthly_quota             INT NOT NULL DEFAULT 5,
  monthly_applications_used INT NOT NULL DEFAULT 0,
  daily_cap                 INT NOT NULL DEFAULT 3,
  daily_applications_used   INT NOT NULL DEFAULT 0,
  current_period_start      TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT false,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_subscriptions_user_id UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_cust ON public.subscriptions(stripe_customer_id);

-- 8. Activity Log Table (Immutable Audit Events)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,                       -- DISCOVERY | MATCH | TAILOR | SUBMISSION | EMAIL | ERROR
  description       TEXT NOT NULL,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log(user_id, created_at DESC);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- Enforces tenant isolation via Clerk JWT: auth.jwt() ->> 'sub' = clerk_id
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function to resolve internal user_id from Clerk JWT claim
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS UUID AS $$
  SELECT id FROM public.users WHERE clerk_id = (auth.jwt() ->> 'sub') LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Users RLS
CREATE POLICY "Users can view and edit own profile"
  ON public.users
  FOR ALL
  USING (clerk_id = (auth.jwt() ->> 'sub'));

-- Profiles RLS
CREATE POLICY "Profiles access isolated to owner"
  ON public.profiles
  FOR ALL
  USING (user_id = public.current_user_id());

-- Job Listings (Publicly readable by authenticated candidates)
CREATE POLICY "Authenticated users can browse job listings"
  ON public.job_listings
  FOR SELECT
  TO authenticated
  USING (true);

-- Match Decisions RLS
CREATE POLICY "Match decisions isolated to owner"
  ON public.match_decisions
  FOR ALL
  USING (user_id = public.current_user_id());

-- Applications RLS
CREATE POLICY "Applications isolated to owner"
  ON public.applications
  FOR ALL
  USING (user_id = public.current_user_id());

-- Subscriptions RLS
CREATE POLICY "Subscriptions isolated to owner"
  ON public.subscriptions
  FOR SELECT
  USING (user_id = public.current_user_id());

-- Activity Log RLS
CREATE POLICY "Activity log isolated to owner"
  ON public.activity_log
  FOR SELECT
  USING (user_id = public.current_user_id());

-- Enable Supabase Realtime on critical tables for live UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
