# Scope: JobHunt AI SaaS Platform

JobHunt AI is an autonomous multi-agent job application platform that matches, tailors, and submits job applications safely for job seekers.

**Build approach:** Tracer Bullet (end-to-end integration hardening across live APIs).  
**Workflow:** Beta (check verify, then test). The project default level of rigor.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Frontend UI & Design System | Brownfield | existing |
| B | Multi-Agent Engine (Agents 1-7) | Brownfield | existing |
| C | Database Schema & Vector Indexing | Brownfield | existing |
| D | Backend API & Webhook Infrastructure | Brownfield | existing |
| 1 | Clerk ID to Supabase UUID Mapping | Hardening | done |
| 2 | Playwright Worker Decoupling | Hardening | done |
| 3 | Live Jobs Feed & Stripe Checkout | Hardening | done |
| 4 | Stripe Webhook Production Guard | Hardening | done |

---

## Brownfield Assets (Existing)

### A. Frontend UI & Design System · existing
11 page views with OLED dark styling, glassmorphism, Framer Motion animations, and UI primitives.  
Code in `src/pages/`, `src/components/`

### B. Multi-Agent Engine (Agents 1-7) · existing
Full autonomous multi-agent pipeline (Parser, Discovery, Matcher, Tailor, Worker, Tracker, Orchestrator) verified end-to-end via test pipeline.  
Code in `src/lib/agents/`, `scripts/test-pipeline.ts`

### C. Database Schema & Vector Indexing · existing
Supabase PostgreSQL database with 7 core tables, Row-Level Security policies, and pgvector HNSW indexing.  
Code in `supabase/migrations/`

### D. Backend API & Webhook Infrastructure · existing
Express server with Svix Clerk webhooks and Stripe subscription event handlers.  
Code in `server/`

---

## Slice: Hardening & Integration Fixes

### 1. Clerk ID to Supabase UUID Mapping · done
Resolve Clerk user string identifiers to internal Supabase UUIDs across client hooks and server handlers to prevent PostgreSQL UUID syntax errors.  
**Done when:** `useQuota`, `useApplications`, and dashboard operations successfully query and mutate data using valid Supabase user UUIDs.
- [x] Build it: `/develop clerk-uuid-mapping`
- [x] Verify it: `/check verify clerk-uuid-mapping`
- [x] Test it: `/test clerk-uuid-mapping`
Spec 0001 · code in `src/hooks/useCurrentUser.ts`

### 2. Playwright Worker Decoupling · done
Relocate Playwright Node.js browser automation out of the client-side `src/` directory to ensure clean Vite client builds.  
**Done when:** Client-side source tree contains no Node.js-only Playwright execution code and client builds cleanly.
- [x] Build it: `/develop decouple-playwright-worker`
- [x] Verify it: `/check verify decouple-playwright-worker`
- [x] Test it: `/test decouple-playwright-worker`
Spec 0001 · code in `src/lib/workers/playwright.ts`

### 3. Live Jobs Feed & Stripe Checkout Integration · done
Connect `JobsPage.tsx` to live `public.job_listings` records via TanStack Query and wire `BillingPage.tsx` plan cards to `/api/billing/create-checkout`.  
**Done when:** `JobsPage` displays real ingested jobs with responsive filtering and `BillingPage` initiates live Stripe Checkout sessions.
- [x] Build it: `/develop live-jobs-and-billing`
- [x] Verify it: `/check verify live-jobs-and-billing`
- [x] Test it: `/test live-jobs-and-billing`
Spec 0001 · code in `src/pages/JobsPage.tsx`, `src/pages/BillingPage.tsx`

### 4. Stripe Webhook Production Guard · done
Enforce strict Stripe signature verification in non-development environments, blocking unauthenticated raw JSON fallback.  
**Done when:** Missing or invalid signatures reject with 400 Bad Request whenever `NODE_ENV` is production.
- [x] Build it: `/develop stripe-webhook-guard`
- [x] Verify it: `/check verify stripe-webhook-guard`
- [x] Test it: `/test stripe-webhook-guard`
Spec 0001 · code in `server/index.ts`

---

## Legend

- **Next step:** the first unticked box in the active slice.
- **Status:** `planned` -> `in-progress` -> `done`, plus `existing` for pre-existing foundations.
- **Workflow:** Beta (develop -> verify -> test).
