# GitHub Repository & Workflow Guide: JobHunt AI

**Repository URL:** [https://github.com/pritams84/job-hunt-agents.git](https://github.com/pritams84/job-hunt-agents.git)  
**Version:** 1.0 | **Companion to:** `architecture.md`, `ui-rules.md`, `constraint.md` | **Status:** Active Standard

---

## 1. Repository Overview

This repository houses the end-to-end codebase for **JobHunt AI** — an autonomous multi-agent career automation SaaS platform built on React (Vite + TypeScript), Tailwind CSS v4, Framer Motion, GSAP, Clerk Authentication (`@clerk/clerk-react`), Supabase (PostgreSQL + pgvector), Stripe Billing, and NVIDIA Nemotron LLM inference.

```
Remote Origin: https://github.com/pritams84/job-hunt-agents.git
Primary Branch: main
Development Branch: dev (or feature/*)
```

---

## 2. Initial Setup & Git Remote Configuration

To initialize and link your local workspace to the remote GitHub repository:

```bash
# 1. Initialize local git repository (if not already done)
git init

# 2. Add remote origin
git remote add origin https://github.com/pritams84/job-hunt-agents.git

# 3. Rename default branch to main
git branch -M main

# 4. Verify remote configuration
git remote -v
```

### Initial Commit & Push Instructions

> ⚠️ **CRITICAL SECURITY CHECK:**  
> Verify `.gitignore` exists and excludes `context/secret-key.md` and `.env*.local` before running `git add .`!

```bash
# Check status to ensure NO secrets (secret-key.md) are staged
git status

# Stage all approved context and configuration files
git add .

# Create initial commit
git commit -m "feat: initial multi-agent SaaS architecture, design system, and context specs"

# Push to GitHub main branch
git push -u origin main
```

---

## 3. GitHub Secrets Configuration (Settings ➔ Secrets and Variables ➔ Actions)

When setting up CI/CD workflows, configure the following secrets in GitHub Repository Settings:

| Secret Name | Description | Environment |
| :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key (`pk_test_...`) | Client Build & Deploy |
| `CLERK_SECRET_KEY` | Clerk Server Secret Key (`sk_test_...`) | Server / CI |
| `CLERK_WEBHOOK_SECRET` | Webhook verification signing secret | Server / CI |
| `VITE_SUPABASE_URL` | Supabase Project URL (`https://....supabase.co`) | Client Build & Deploy |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anonymous Key | Client Build & Deploy |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Server Service Role Key (Admin) | Server / CI |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key (`pk_test_...`) | Client Build & Deploy |
| `STRIPE_SECRET_KEY` | Stripe Server Secret Key (`sk_test_...`) | Server / CI |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signature Secret (`whsec_...`) | Server / CI |
| `NVIDIA_API_KEY` | NVIDIA NIM Inference API Key (`nvapi-...`) | Server / CI |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` | Server / CI |
| `VERCEL_TOKEN` | Token for automated deployment to Vercel | Deployment |
| `VERCEL_ORG_ID` | Vercel Organization ID | Deployment |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Deployment |

---

## 4. Branching Strategy & Contribution Guidelines

```
main (Production)
 ▲
 │ Pull Request (Requires CI Pass + 1 Approval)
dev (Staging / Integration)
 ▲
 │ Pull Request
feature/[feature-name]  or  fix/[bug-name]
```

### Branch Naming Conventions
- `feature/auth-clerk-integration`
- `feature/supabase-rls-schema`
- `feature/stripe-checkout-webhook`
- `feature/bento-dashboard-ui`
- `fix/playwright-captcha-detection`
- `docs/update-agent-spec`

### Conventional Commits
All commits must adhere to the Conventional Commits specification:
```
feat: add NVIDIA Nemotron LLM client abstraction
fix: prevent layout shift on dashboard metric cards
docs: update multi-agent architecture and constraint rules
style: enforce UI/UX Pro Max typography tokens in Tailwind
refactor: isolate Supabase Realtime channel listeners
test: add unit tests for resume parsing and match scoring
chore: update .gitignore and package dependencies
```

---

## 5. GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

The repository uses automated GitHub Actions workflows for continuous integration:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  validate:
    name: Lint, Typecheck & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint Code (ESLint & UI Rules)
        run: pnpm lint

      - name: TypeScript Typecheck
        run: pnpm typecheck

      - name: Run Unit Tests
        run: pnpm test

      - name: Secret Leak Check (Trufflehog)
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

---

## 6. Issue & PR Template Setup

### Pull Request Checklist (Enforced by GitHub Template)
- [ ] No secrets or `.env` files are tracked in git.
- [ ] UI changes comply with UI/UX Pro Max guidelines (No emojis as icons, `cursor-pointer` present, zero layout shift).
- [ ] Supabase migrations include RLS policies.
- [ ] TypeScript passes with zero `any` types.
- [ ] Unit tests pass for changed agent workflows.
