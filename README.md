# 🤖 JobHunt AI — Autonomous Career Automation SaaS Platform

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/pritams84/job-hunt-agents.git)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5%2F6-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_pgvector-3ECF8E?logo=supabase)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?logo=clerk)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Subscriptions_%26_Billing-635BFF?logo=stripe)](https://stripe.com/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-Nemotron_70B-76B900?logo=nvidia)](https://build.nvidia.com/)

> **JobHunt AI** is an autonomous, event-driven multi-agent SaaS platform that continuously hunts, evaluates, tailors resumes, and applies to relevant software and tech jobs 24/7 on behalf of job seekers.

---

## 🏗️ Architecture & Core Technology Stack

* **Frontend:** **React + Vite + TypeScript**, `react-router-dom`, Tailwind CSS, Framer Motion (Drag physics & layout animations), GSAP (Scroll timelines & tickers), Radix UI, Lucide React (100% SVG, Zero Emojis).
* **Design Framework:** **UI/UX Pro Max** — OLED Dark Base (`#020617`), Glassmorphism, 12-column Bento Grid Command Center, Zero-CLS Skeletons.
* **Authentication:** **Clerk Auth** (`@clerk/clerk-react` with OAuth, session tokens, multi-tenant JWT claims).
* **Database & Realtime:** **Supabase** (PostgreSQL with Row-Level Security, `pgvector` semantic embeddings, Supabase Storage, and Realtime WebSocket feed).
* **Billing Engine:** **Stripe** (Tiered subscriptions: Free, Pro $29/mo, Autopilot $79/mo, Customer Billing Portal, Webhooks).
* **AI & LLM Inference:** **NVIDIA Nemotron 70B** (`nvidia/llama-3.1-nemotron-70b-instruct`) hosted on NVIDIA NIM (`integrate.api.nvidia.com`) with zero vendor lock-in.
* **Browser Automation Worker:** **Playwright** sandboxes in isolated containers adhering to a strict **Zero-Bypass CAPTCHA Policy**.

---

## 🤖 The 7 Autonomous Agents

1. **Profile Parsing Agent:** Extracts structured JSON from PDF/DOCX resumes and computes 1536-dim embeddings.
2. **Job Discovery Agent:** Ingests listings across LinkedIn, Indeed, Greenhouse, Lever, and Workday with SHA-256 deduplication.
3. **Matching & Scoring Agent:** 3-stage funnel (Hard filters ➔ Vector cosine similarity ➔ LLM fit reasoning) producing a 0–100 match score.
4. **Tailoring & Fact-Checker Agent:** Dual-agent adversarial loop generating tailored resumes and cover letters with strict anti-hallucination verification against the master profile.
5. **Autonomous Browser Agent:** Automates form-filling and submission in Playwright sandboxes with human jitter and proof screenshot capture.
6. **Application Tracker Agent:** Inbound email webhook parser tracking application lifecycles (`applied` ➔ `interview` ➔ `offer`).
7. **Orchestrator Governor:** State machine enforcing daily quotas (Autopilot: 50, Pro: 20, Free: 3), rate limits, and dashboard emergency stop.

---

## 📚 Documentation Index (`/context`)

All detailed technical specifications are maintained in the `/context` directory:

| Document | Description |
| :--- | :--- |
| **[`context/github.md`](context/github.md)** | GitHub repository setup, remote configuration, CI/CD, and secrets |
| **[`context/agents.md`](context/agents.md)** | Full Multi-Agent system specification, contracts, prompts, and flows |
| **[`context/constraint.md`](context/constraint.md)** | Technical, legal, anti-bot, security, and unit economics constraints |
| **[`context/user-flow.md`](context/user-flow.md)** | End-to-end user journeys, onboarding wizard, and dashboard command center |
| **[`context/build-plan.md`](context/build-plan.md)** | Phase-by-phase build plan using Loop Engineering methodology |
| **[`context/frontend-design.md`](context/frontend-design.md)** | Complete frontend design tokens, route map, and component architecture |
| **[`context/ui-rules.md`](context/ui-rules.md)** | Strict UI development standards and UI/UX Pro Max anti-patterns checklist |
| **[`context/design-system/`](context/design-system/)** | Global Master design system (`MASTER.md`) and page-specific overrides |
| **[`context/architecture.md`](context/architecture.md)** | High-level system architecture and sequence diagrams |
| **[`context/low-level-system-design.md`](context/low-level-system-design.md)** | PostgreSQL schema, RLS policies, indexes, and API routes |
| **[`context/prd.md`](context/prd.md)** & **[`context/trd.md`](context/trd.md)** | Product and Technical Requirements Documents |

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/pritams84/job-hunt-agents.git
cd job-hunt-agents
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root (this file is excluded in `.gitignore`):
```bash
# Client Variables (React + Vite)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server Variables (Node/Express backend)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-70b-instruct
```

### 3. Install Dependencies & Run
```bash
pnpm install
pnpm dev
```

Visit `http://localhost:5173` to launch the React application.

---

## 🔒 Security & Privacy Notice
* Never commit `.env` or files containing raw credentials to git.
* Protected by strict Supabase PostgreSQL Row-Level Security (RLS).
* Zero-data retention guarantee with LLM providers.
