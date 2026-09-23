# Requirements Specification: AI Job Hunt Agents SaaS Platform

**Version:** 1.0 (Draft) | **Companion to:** PRD.md, TRD.md, ARCHITECTURE.md, SCOPE.md, LOW-LEVEL-SYSTEM-DESIGN.md | **Status:** For Review

**Priority Notation:**
- **P0 (MVP):** Core launch requirements for initial paying & trial cohort.
- **P1 (v1.0):** Autonomous scaling, self-service subscription management, realtime features.
- **P2 (v2.0):** Advanced platform coverage, email status parsing, multi-tenant team accounts.

---

## 1. Authentication & Multi-Tenancy Requirements (Clerk)

| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-AUTH-1** | System shall integrate **Clerk** for user authentication supporting Email magic links/passwords and social OAuth (Google, GitHub, LinkedIn). | P0 |
| **FR-AUTH-2** | System shall verify Clerk JWT session tokens on all protected API routes and Supabase database requests. | P0 |
| **FR-AUTH-3** | System shall consume Clerk webhooks (`user.created`, `user.updated`, `user.deleted`) to synchronize and maintain user records in Supabase `users` table. | P0 |
| **FR-AUTH-4** | System shall isolate user sessions, browser automation sandboxes, and data access strictly by Clerk user ID (`clerk_id`). | P0 |
| **FR-AUTH-5** | System shall support user account deletion via Clerk, cascading to hard/soft deletion of user records and stored documents in Supabase (GDPR right-to-erasure). | P0 |

---

## 2. Billing, Monetization & Quota Requirements (Stripe)

| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-BILL-1** | System shall integrate **Stripe Checkout** to handle subscription creation for Free Trial, Starter ($29/mo), and Pro ($79/mo) plans. | P0 |
| **FR-BILL-2** | System shall handle Stripe Webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) to update subscription state in Supabase. | P0 |
| **FR-BILL-3** | System shall enforce daily and monthly application quotas based on the user's active Stripe subscription tier before queuing any application. | P0 |
| **FR-BILL-4** | System shall provide a self-service **Stripe Customer Portal** redirect allowing users to manage payment methods, upgrade/downgrade tiers, and cancel subscriptions. | P1 |
| **FR-BILL-5** | System shall block automated application execution if a user's subscription status is `canceled`, `past_due`, or if the monthly quota has been exhausted. | P0 |
| **FR-BILL-6** | System shall support one-off credit top-ups via Stripe for extra applications beyond standard tier quotas. | P2 |

---

## 3. Database, Storage & Realtime Requirements (Supabase)

| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-DATA-1** | System shall persist all relational data (users, profiles, jobs, match decisions, applications, logs, subscriptions) in **Supabase PostgreSQL**. | P0 |
| **FR-DATA-2** | System shall enable **Row-Level Security (RLS)** on all user-owned tables ensuring users can only read/write their own records using their verified Clerk ID. | P0 |
| **FR-DATA-3** | System shall utilize **Supabase Storage** for secure resume uploads (PDF/DOCX) and submission confirmation screenshots using private buckets and signed URLs. | P0 |
| **FR-DATA-4** | System shall utilize the Supabase `pgvector` extension to store 1536-dimensional embeddings for candidate profiles and job listings. | P0 |
| **FR-DATA-5** | System shall utilize **Supabase Realtime** to broadcast application status transitions and quota updates live to the user dashboard. | P1 |

---

## 4. Agentic AI & Job Application Functional Requirements

### 4.1 Resume Understanding & Profile Ingestion
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-PROF-1** | System shall accept resume uploads in PDF and DOCX formats into Supabase Storage. | P0 |
| **FR-PROF-2** | System shall extract structured profile data (skills, experience, education, projects, certifications, links) via LLM extraction into `profiles.parsed_json`. | P0 |
| **FR-PROF-3** | System shall provide an interactive profile editor allowing users to review, refine, and update their parsed data and preferences. | P0 |
| **FR-PROF-4** | System shall allow users to configure job search parameters: target roles, seniority, location, remote preference, minimum salary floor, blacklisted companies, and custom screening Q&A answers. | P0 |

### 4.2 Job Discovery & Normalization
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-DISC-1** | System shall execute scheduled job discovery across supported platforms without requiring manual triggers. | P0 |
| **FR-DISC-2** | System shall normalize job listings into a uniform schema (title, company, location, salary, description, URL, source) and compute a SHA-256 deduplication hash. | P0 |
| **FR-DISC-3** | System shall prevent duplicate job insertions and avoid applying twice to the same job posting. | P0 |

### 4.3 Intelligent Matching Engine
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-MTCH-1** | System shall apply hard-rule filters (blacklist, salary floor, location compatibility, visa requirements) before evaluating deeper fit. | P0 |
| **FR-MTCH-2** | System shall calculate semantic similarity using `pgvector` between profile and job description embeddings. | P0 |
| **FR-MTCH-3** | System shall execute an LLM structured evaluation on borderline jobs to produce a match score and transparent reasoning text. | P0 |

### 4.4 Content Generation & Fact-Checking
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-GEN-1** | System shall generate customized cover letters and tailored resume summaries strictly grounded in the user's verified profile. | P0 |
| **FR-GEN-2** | System shall run an automated fact-checking validator against the user's profile to prevent hallucinated claims, skills, or dates. | P0 |
| **FR-GEN-3** | System shall persist all generated documents and Q&A answers alongside the application record in Supabase. | P0 |

### 4.5 Form Filling & Submission Execution
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-SUBM-1** | In **Review Mode (MVP default)**, system shall present the prepared form fields and generated documents for user review and one-click approval. | P0 |
| **FR-SUBM-2** | In **Auto-Submit Mode (v1.0)**, system shall submit applications automatically if match score and field confidence meet configured thresholds and tier quota allows. | P1 |
| **FR-SUBM-3** | System shall capture submission confirmation references and store screenshot artifacts in Supabase Storage. | P0 |
| **FR-SUBM-4** | System shall immediately pause execution and alert user when detecting CAPTCHAs, bot challenges, or expired platform sessions without attempting evasive bypasses. | P0 |

### 4.6 Tracking, Audit & Activity Logging
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-TRCK-1** | System shall track application lifecycle states: `discovered` $\rightarrow$ `matched` $\rightarrow$ `queued` $\rightarrow$ `applied` $\rightarrow$ `viewed` $\rightarrow$ `interview` $\rightarrow$ `offer` / `rejected` / `failed` / `needs_review`. | P0 |
| **FR-TRCK-2** | System shall maintain an append-only `activity_log` recording every search, match decision, filled field, and error event. | P0 |
| **FR-TRCK-3** | System shall provide a real-time web dashboard displaying application metrics, pipeline status, and quota usage. | P0 |

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Security, Isolation & Compliance
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **NFR-SEC-1** | **Multi-Tenant Isolation:** Supabase Row-Level Security (RLS) must enforce strict tenant boundaries based on validated Clerk user IDs. | P0 |
| **NFR-SEC-2** | **Zero PCI Scope:** No raw credit card data or payment details shall touch application servers; Stripe handles all payment data. | P0 |
| **NFR-SEC-3** | **Credential Encryption:** Third-party job platform session cookies must be encrypted at rest using AES-GCM / KMS keys. | P0 |
| **NFR-SEC-4** | **Browser Worker Sandboxing:** Each Playwright execution must run in an isolated, ephemeral container with no shared state or cross-user data leaks. | P0 |

### 5.2 Performance & Scalability
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **NFR-PERF-1** | Vector similarity lookups in Supabase (`pgvector`) must return in $< 50\text{ms}$ for candidate listings. | P0 |
| **NFR-PERF-2** | Dashboard initial load time must be $< 1.5\text{s}$ using efficient cached queries and Supabase indexes. | P0 |
| **NFR-PERF-3** | Application worker pool must autoscale based on Redis / Orchestrator queue depth. | P1 |

### 5.3 Reliability & Idempotency
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **NFR-REL-1** | Stripe webhook processing must be idempotent to prevent duplicate credit/subscription updates. | P0 |
| **NFR-REL-2** | Application submission activity must be strictly idempotent to prevent duplicate job submissions. | P0 |
| **NFR-REL-3** | Background workflows and paused tasks must survive service restarts without losing state. | P0 |