# Objective & Vision: AI Job Hunt Agents SaaS Platform

## 1. Vision
Build a multi-tenant, fully autonomous **AI Job Search & Application SaaS Platform** that enables job seekers to automate their entire job search lifecycle. The user sets up their profile, resume, and preferences once, selects a subscription tier (Free, Pro, Premium), and the agent ecosystem continuously and autonomously finds, evaluates, tailors, applies to, and tracks relevant job opportunities on their behalf.

> **Simple Vision:**
> "Give the agent my resume, preferences, and set my rules once. The platform continuously discovers suitable jobs, evaluates fit, fills out applications, generates tailored resumes/cover letters, submits applications automatically, and tracks interview/offer statuses, all backed by a secure multi-tenant SaaS architecture."

## 2. Core Architecture Pillars
- **Authentication & User Management:** **Clerk** (OAuth, Passwordless, MFA, Session management, Multi-tenancy).
- **Backend & Persistence:** **Supabase** (Managed PostgreSQL, Row-Level Security [RLS], `pgvector` for semantic job matching, Supabase Storage for resumes and audit artifacts).
- **Billing & Monetization:** **Stripe** (Tiered SaaS subscriptions, usage-based quotas for daily/monthly applications, Stripe Checkout, Customer Billing Portal, and resilient Webhooks).
- **Multi-Agent AI Engine:** Agentic workflows (parsing, matching, Q&A, content generation with fact-checking, sandboxed browser automation, and status tracking).

## 3. End-to-End Lifecycle
$$\text{User Onboarding (Clerk)} \longrightarrow \text{Subscription Selection (Stripe)} \longrightarrow \text{Resume Ingestion (Supabase Storage + LLM)}$$
$$\longrightarrow \text{Continuous Job Discovery} \longrightarrow \text{Vector \& Rule Matching (pgvector)} \longrightarrow \text{Content Tailoring \& Fact-Checking}$$
$$\longrightarrow \text{Automated Form Filling \& Submission} \longrightarrow \text{Audit Logging \& Tracking (Supabase RLS)}$$

## 4. Core SaaS Capabilities
1. **Seamless Auth & Multi-Tenancy:** Instant login via Google, GitHub, LinkedIn, or Email powered by Clerk, mapped directly to user records and RLS tenant boundaries in Supabase.
2. **Tiered Monetization & Quota Management:** Enforce daily and monthly application caps, concurrency limits, and premium platform connectors based on active Stripe subscription plans.
3. **Resume Understanding & Vectorization:** Extract skills, experience, education, projects, and store embeddings in Supabase (`pgvector`) for ultra-fast semantic matching.
4. **Continuous Job Discovery:** Scheduled background crawlers and API integrations fetching listings into a normalized Supabase repository.
5. **Intelligent Tiered Matching:** Hard rule filtering + `pgvector` cosine similarity + selective LLM scoring for high-accuracy match decisions.
6. **Fact-Checked Dynamic Application Generation:** Job-specific cover letters and resume summaries generated strictly from verified user profile data.
7. **Automated & Review-Mode Form Filling:** Automated filling with human-in-the-loop pause points when user approval or CAPTCHA intervention is required.
8. **Application Tracking & Activity Audit:** Real-time dashboard of submitted applications, confirmation receipts, screenshots in Supabase Storage, and status updates.