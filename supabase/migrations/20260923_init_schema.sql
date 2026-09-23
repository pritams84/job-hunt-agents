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
CREATE INDEX IF NOT EXISTS idx_job_listings_discovered_at ON public.job_listings(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_company ON public.job_listings(company);

-- Fast Approximate Nearest Neighbor (ANN) index for vector cosine similarity matching
CREATE INDEX IF NOT EXISTS idx_job_listings_embedding_hnsw
  ON public.job_listings USING hnsw (embedding vector_cosine_ops);

-- 5. Match Decisions Table (Agent 3 Output & Match Audit Rationale)
CREATE TABLE IF NOT EXISTS public.match_decisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score             NUMERIC(5,2) NOT NULL,               -- 0.00 to 100.00
  score_breakdown   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- skills_overlap, seniority, culture, compensation
  decision          TEXT NOT NULL CHECK (decision IN ('apply', 'skip', 'needs_review')),
  reasoning_text    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_match_job_user UNIQUE(job_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_match_decisions_user_score ON public.match_decisions(user_id, score DESC);

-- 6. Applications Table (Core Stage Machine Pipeline)
CREATE TABLE IF NOT EXISTS public.applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'discovered'
                    CHECK (status IN (
                      'discovered', 'matched', 'queued', 'applied',
                      'needs_review', 'viewed', 'interview', 'offer',
                      'rejected', 'withdrawn', 'failed'
                    )),
  submitted_content JSONB,                               -- Snapshot of tailored resume & custom essay answers
  confirmation_ref  TEXT,                                -- External ATS confirmation ID
  screenshot_url    TEXT,                                -- Submission proof in Supabase Storage
  failure_reason    TEXT,                                -- Error message or CAPTCHA trigger reason
  retry_count       INT NOT NULL DEFAULT 0,
  submitted_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_application_user_job UNIQUE(user_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);

-- 7. Subscriptions Table (Stripe Billing & Quota Enforcement)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  plan_tier               TEXT NOT NULL DEFAULT 'free_trial' CHECK (plan_tier IN ('free_trial', 'starter', 'pro', 'power')),
  status                  TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  monthly_quota           INT NOT NULL DEFAULT 5,        -- Free: 5 | Starter: 50 | Pro: 250 | Power: Unlimited
  monthly_applications_used INT NOT NULL DEFAULT 0,
  daily_cap               INT NOT NULL DEFAULT 3,        -- Free: 3 | Starter: 5 | Pro: 15 | Power: 50
  daily_applications_used INT NOT NULL DEFAULT 0,
  current_period_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_subscriptions_user UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_cust ON public.subscriptions(stripe_customer_id);

-- 8. Immutable Activity Audit Log (Full Forensic Agent Telemetry)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID,
  application_id    UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL CHECK (event_type IN (
                      'searched', 'matched', 'skipped', 'generated_content',
                      'filled_field', 'submitted', 'error', 'captcha_detected',
                      'quota_reached', 'status_changed'
                    )),
  payload_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
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

-- Function to increment daily applications
CREATE OR REPLACE FUNCTION public.increment_daily_applications(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET daily_applications_used = daily_applications_used + 1,
      monthly_applications_used = monthly_applications_used + 1,
      updated_at = now()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users RLS
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.users;
CREATE POLICY "Users can view and edit own profile"
  ON public.users
  FOR ALL
  USING (clerk_id = (auth.jwt() ->> 'sub'));

-- Profiles RLS
DROP POLICY IF EXISTS "Profiles access isolated to owner" ON public.profiles;
CREATE POLICY "Profiles access isolated to owner"
  ON public.profiles
  FOR ALL
  USING (user_id = public.current_user_id());

-- Job Listings (Publicly readable by authenticated candidates)
DROP POLICY IF EXISTS "Authenticated users can browse job listings" ON public.job_listings;
CREATE POLICY "Authenticated users can browse job listings"
  ON public.job_listings
  FOR SELECT
  TO authenticated
  USING (true);

-- Match Decisions RLS
DROP POLICY IF EXISTS "Match decisions isolated to owner" ON public.match_decisions;
CREATE POLICY "Match decisions isolated to owner"
  ON public.match_decisions
  FOR ALL
  USING (user_id = public.current_user_id());

-- Applications RLS
DROP POLICY IF EXISTS "Applications isolated to owner" ON public.applications;
CREATE POLICY "Applications isolated to owner"
  ON public.applications
  FOR ALL
  USING (user_id = public.current_user_id());

-- Subscriptions RLS
DROP POLICY IF EXISTS "Subscriptions isolated to owner" ON public.subscriptions;
CREATE POLICY "Subscriptions isolated to owner"
  ON public.subscriptions
  FOR SELECT
  USING (user_id = public.current_user_id());

-- Activity Log RLS
DROP POLICY IF EXISTS "Activity log isolated to owner" ON public.activity_log;
CREATE POLICY "Activity log isolated to owner"
  ON public.activity_log
  FOR SELECT
  USING (user_id = public.current_user_id());

-- Enable Supabase Realtime on critical tables for live UI updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END $$;
