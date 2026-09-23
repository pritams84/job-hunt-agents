# Product Scope: AI Job Hunt Agents SaaS Platform

**Version:** 1.0 (Draft) | **Companion to:** PRD.md, TRD.md, ARCHITECTURE.md, SYSTEM-DESIGN.md | **Status:** For Review

---

## 1. Scope Purpose & Boundaries

This document defines the deliverables, feature boundaries, and technical scope for the **Job Hunt Agents SaaS Platform**. It clearly distinguishes between **MVP**, **v1.0**, and **v2.0** releases to ensure aligned development across Authentication (Clerk), Backend/Database (Supabase), Payments/Subscriptions (Stripe), and the AI Agent automation engine.

---

## 2. In Scope — MVP (Proof of SaaS Value & Core Loop)

**Goal:** Launch a commercial SaaS prototype allowing paying or trial users to sign up via Clerk, subscribe via Stripe, upload resumes to Supabase Storage, discover jobs, review match decisions, and execute supervised (review-mode) applications with an audit trail.

| Area | In Scope for MVP |
| :--- | :--- |
| **Authentication & Users** | Clerk integration (Email, Google, LinkedIn login); Clerk Webhook syncing user creation/updates to Supabase `users` table; JWT validation. |
| **Backend & Database** | Supabase PostgreSQL schema with Row-Level Security (RLS) enabled on all user tables; `pgvector` extension for profile & job embeddings; Supabase Storage for resumes and confirmation artifacts. |
| **Monetization & Billing** | Stripe Checkout integration (Free Trial, Starter, Pro monthly tiers); Stripe webhook handling (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`); Basic application quota tracking in Supabase. |
| **Resume Ingestion** | Upload PDF/DOCX to Supabase Storage; LLM-based parsing of skills, experience, education; generation of structured profile and embedding vector. |
| **Preferences & Rules** | Target roles, locations, remote/on-site, minimum compensation floor, blacklisted companies, and custom screening Q&A answers. |
| **Job Discovery** | Scheduled crawlers/API connectors for 1–2 initial platforms (e.g., LinkedIn / Greenhouse); normalization and SHA-256 deduplication. |
| **Matching Engine** | Tiered matching: Rule-based filters + `pgvector` cosine similarity + selective LLM scoring on borderline candidates. |
| **Content Generation** | Job-tailored cover letters and resume summaries grounded strictly in profile data, verified with an automated fact-checking validator. |
| **Application Submission** | **Review-before-submit mode only** for MVP (agent prepares form payload, user confirms one-click submission from the dashboard). |
| **Activity Log & Audit** | Immutable logging of discovery, match reasoning, submitted fields, and confirmation screenshots in Supabase. |
| **Failure Handling** | Immediate pause and user notification upon detecting CAPTCHAs, session timeouts, or unmapped form fields (no bypass attempts). |

---

## 3. In Scope — v1.0 (Autonomous SaaS Production Release)

**Goal:** Expand to fully autonomous application mode, self-service billing management, realtime updates, and autoscaled background workers.

| Area | In Scope for v1.0 |
| :--- | :--- |
| **Autonomous Mode** | User-toggleable "Full Auto-Submit" mode where eligible jobs (score $\ge$ auto-apply threshold) are submitted without human clicks. |
| **Billing & Stripe Portal** | Stripe Customer Billing Portal integration (upgrade/downgrade plans, change credit cards, view invoices, cancel subscriptions); strict automated daily and monthly application quota enforcement. |
| **Realtime Dashboard** | Supabase Realtime subscriptions driving live UI updates for pipeline stage transitions, quota meters, and task notifications. |
| **Worker Infrastructure** | Autoscaling pool of ephemeral Playwright browser worker containers managed via queue depth. |
| **Platform Connectors** | Expand support to 3–5 top platforms and ATS systems (e.g., Lever, Workday, Indeed). |
| **Notifications** | Multi-channel notifications (In-app, Email via Resend/SendGrid) for applications needing review, CAPTCHA alerts, and daily activity summaries. |

---

## 4. In Scope — v2.0 (Scale, Analytics & Advanced Integrations)

| Area | In Scope for v2.0 |
| :--- | :--- |
| **Email Status Parsing** | Optional, consent-based IMAP/Gmail API integration to automatically parse interview invitations, assessment requests, and rejections. |
| **SaaS Analytics & Insights** | Cohort conversion analytics, application response rate benchmarks by industry, and dynamic profile optimization suggestions. |
| **Feedback Loop Learning** | Adaptive adjustment of match scoring weights based on recruiter response rates and user feedback. |
| **Team / Agency Accounts** | Clerk Organizations and Supabase multi-user tenant roles for career coaches, universities, and recruitment agencies managing multiple candidates. |

---

## 5. Explicitly Out of Scope (All Phases)

| Excluded Item | Justification / Rationale |
| :--- | :--- |
| **CAPTCHA / Cloudflare Bypass** | Violates platform terms of service and legal standards; system will always pause and notify user. |
| **Resume Fabrication / Exaggeration** | Hard product constraint: all generated content must be strictly fact-checked against user profile. |
| **Automated Video / Coding Assessments** | Interactive assessments require genuine candidate participation and cannot be ethically automated. |
| **Direct Salary Negotiation** | Highly subjective and conversational; outside the bounds of form application automation. |
| **Native Mobile Apps (iOS/Android)** | Responsive web application built with modern web technologies is sufficient for MVP and v1. |
| **Storing Raw Credit Card Information** | All payment handling delegated 100% to Stripe PCI-compliant infrastructure. |

---

## 6. SaaS Constraints & Dependencies

1. **Clerk Auth as Identity Provider:** All user identities originate in Clerk; Supabase relies on Clerk user IDs for user lookup and RLS enforcement.
2. **Stripe as Source of Truth for Entitlements:** Subscription status (`active`, `past_due`, `canceled`) and tier limits are dictated by Stripe webhooks and synced to Supabase.
3. **Supabase RLS for Tenant Isolation:** No user query can read or write rows belonging to another user ID; strict database-level security policies apply.
4. **Target Platform Rate Limits:** Orchestrator must enforce rate limits and concurrency caps per platform to protect user accounts from being flagged.