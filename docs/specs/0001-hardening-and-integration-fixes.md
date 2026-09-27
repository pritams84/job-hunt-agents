# 0001. Hardening and Integration Fixes

**Date**: 2026-09-27  
**Status**: Accepted  

## Summary

This specification defines the architectural fixes for four critical and major findings discovered during the system code review. It addresses foreign key identifier alignment between Clerk and Supabase, separates Node.js Playwright execution from browser bundles, connects the Jobs and Billing pages to live endpoints, and locks down Stripe webhook verification in production environments.

## Context

JobHunt AI integrates Clerk for authentication, Supabase PostgreSQL for persistent relational and vector storage, Stripe for recurring billing, and a multi-agent pipeline for autonomous job applications. During code review, four integration issues were identified:
1. **Identifier mismatch**: The frontend passes Clerk string identifiers (e.g., `user_2...`) directly to database queries expecting a PostgreSQL `UUID`.
2. **Runtime isolation**: Playwright browser automation is located inside `src/lib/workers/`, which risks client bundle pollution and build issues in Vite.
3. **Mock UI surfaces**: `JobsPage` and `BillingPage` rely on hardcoded demo data rather than live API queries and Stripe checkout actions.
4. **Webhook security**: Stripe webhooks fall back to unverified JSON parsing when secret keys are absent, which poses a security risk in production.

Addressing these issues now ensures data integrity, clean builds, and production readiness.

## Requirements

**User stories**:
- As a job seeker, I want my quotas, applications, and profile to load reliably from the database so that my application progress is accurately tracked.
- As a job seeker, I want to browse real ingested job opportunities and upgrade my subscription through Stripe Checkout seamlessly.
- As a platform operator, I want all external webhooks strictly authenticated so that unauthorized requests cannot manipulate user subscriptions.

**Acceptance criteria**:
- **AC-1**: All Supabase queries in `useQuota`, `useApplications`, and `DashboardPage` resolve the user's Supabase UUID from their Clerk identity without PostgreSQL type errors.
- **AC-2**: The client-side `src/` directory contains zero imports of Node.js-only Playwright execution modules, and `npm run build` succeeds cleanly.
- **AC-3**: `JobsPage.tsx` queries live listings from `public.job_listings` with full text and platform filters, and `BillingPage.tsx` triggers `POST /api/billing/create-checkout` to initiate Stripe Checkout sessions.
- **AC-4**: `POST /api/webhooks/stripe` rejects unverified payloads with a 400 status whenever `NODE_ENV === 'production'` or `STRIPE_WEBHOOK_SECRET` is configured.

## Options Considered

### Option 1: Client-Side UUID Lookup Hook + Server-Side Worker Isolation (Chosen)
- Create a lightweight `useCurrentUser()` hook in the client that resolves `clerk_id` to `public.users.id` (UUID) with TanStack Query caching.
- Keep Playwright runner execution strictly in Node.js server/script runtime and expose actions via backend endpoints or CLI scripts.
- Wire frontend components to live Supabase and Express APIs.

**Pros**:
- Preserves existing database foreign key integrity (`UUID REFERENCES public.users(id)`).
- Zero changes required to PostgreSQL migrations or schema.
- Fast and reliable with minimal refactoring.

**Cons**:
- Requires one initial query per session to map Clerk ID to Supabase UUID.

### Option 2: Change Database Schema to Use Clerk String IDs as Primary Keys
- Alter `public.users`, `profiles`, `applications`, and `subscriptions` tables to use `TEXT` primary keys storing Clerk IDs.

**Pros**:
- Eliminates the need for UUID translation in client queries.

**Cons**:
- Requires destructive database migration on existing live tables and foreign keys.
- Degrades indexing performance compared to native UUIDs.

## Decision

**Chosen option**: Option 1: Client-Side UUID Lookup Hook + Server-Side Worker Isolation.

We preserve the relational integrity and indexing efficiency of PostgreSQL UUIDs while providing a clean `useCurrentUser` hook on the client. Playwright worker execution is kept strictly in server-side environments.

## Feature Design

### 1. User Identity Resolution
A helper hook `useCurrentUser()` queries `public.users` table:
```ts
// src/hooks/useCurrentUser.ts
export function useCurrentUser() {
  const { user, isLoaded } = useUser()
  return useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('users')
        .select('id, clerk_id, email, first_name, last_name')
        .eq('clerk_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })
}
```

### 2. API Surface
| Endpoint | Method | Key Inputs | Key Outputs | Auth | Error Handling |
|---|---|---|---|---|---|
| `/api/billing/create-checkout` | POST | `{ tier, userId, successUrl, cancelUrl }` | `{ url: string }` | Clerk Auth / Body | 400 Bad Request, 500 Stripe error |
| `/api/billing/portal` | POST | `{ customerId }` | `{ url: string }` | Clerk Auth / Body | 400 Bad Request, 500 Stripe error |
| `/api/webhooks/stripe` | POST | Stripe webhook payload + Signature | `{ received: true }` | Stripe Signature | 400 Invalid signature |

## Build Plan

- [ ] **Task 1 (AC-1)**: Implement `src/hooks/useCurrentUser.ts` and update `useQuota.ts`, `useApplications.ts`, and `DashboardPage.tsx` to use the resolved Supabase UUID.
- [ ] **Task 2 (AC-2)**: Audit `src/lib/workers/playwright.ts` to ensure clean separation between browser execution and frontend client code.
- [ ] **Task 3 (AC-3)**: Connect `JobsPage.tsx` to query `public.job_listings` via Supabase with search and filter state.
- [ ] **Task 4 (AC-3)**: Implement Stripe Checkout trigger in `BillingPage.tsx` connecting plan upgrade buttons to `/api/billing/create-checkout`.
- [ ] **Task 5 (AC-4)**: Add production environment check in `server/index.ts` to strictly enforce Stripe webhook signature verification.

## Consequences

- **Positive**: All database queries execute without type errors, client builds cleanly without Node.js dependency leaks, and payment flows operate end-to-end.
- **Trade-off**: Client makes one lightweight initial query on app load to resolve the Clerk user record.

## Follow-up

- Update `docs/scope/scope.md` to link this specification.
