# UI Rules & Development Standards: AI Job Hunt Agents SaaS Platform

**Version:** 1.0 | **Applies to:** All frontend code in this project | **Status:** Enforced

> These rules are non-negotiable standards for maintaining visual consistency, performance, and accessibility across the entire platform. Every developer and AI agent contributing to the frontend must follow this document.

---

## 1. The Three Animation Layers — What Goes Where

This is the most critical rule. Mixing animation tools incorrectly creates janky, over-engineered, or conflicting animations.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  RULE: Always pick the LOWEST-cost tool that achieves the desired result │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Use Tailwind CSS for:
- ✅ Hover, focus, active state transitions (color, scale, opacity, shadow).
- ✅ Skeleton shimmer loading backgrounds.
- ✅ Simple utility keyframe animations that run on classes (agent pulse, slide-up, fade-in).
- ✅ Any animation that does not require React lifecycle (`mounted`, `unmounted`, `exit`).

```tsx
// ✅ CORRECT — Use Tailwind for hover lift on a card
<div className="transition-all duration-250 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-accent cursor-pointer">
  <JobCard />
</div>

// ❌ WRONG — Don't wrap a simple hover in Framer Motion
<motion.div whileHover={{ scale: 1.02, y: -2 }}>
  <JobCard />
</motion.div>
```

### 1.2 Use Framer Motion for:
- ✅ Component mount / unmount animations (`AnimatePresence`).
- ✅ Page-level route transitions.
- ✅ Drawer, modal, sheet slide-in/slide-out.
- ✅ Kanban card drag-and-drop with physics.
- ✅ Staggered list / grid item reveals.
- ✅ Layout animations (smoothly reordering items with `layout` prop).
- ✅ Scroll-linked `useScroll` + `useTransform` parallax within a component.
- ❌ Do NOT use Framer Motion for simple hover states — that's Tailwind's job.
- ❌ Do NOT use Framer Motion for page-scroll-triggered sequences — that's GSAP's job.

```tsx
// ✅ CORRECT — Framer Motion for AnimatePresence exit animation
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      key="drawer"
      variants={drawerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <ApplicationDetailSheet />
    </motion.div>
  )}
</AnimatePresence>
```

### 1.3 Use GSAP for:
- ✅ Landing page section reveal sequences (hero, features, pricing, how-it-works).
- ✅ Scroll-triggered staggered animations with `ScrollTrigger`.
- ✅ Pinned / scrubbed scroll sections (onboarding steps, pricing comparison).
- ✅ SVG path drawing animations (`DrawSVGPlugin`).
- ✅ Number count-up animations (stats, quota, success rates).
- ✅ Complex multi-element timelines with precise offset control.
- ❌ Do NOT use GSAP inside React component bodies without a `useEffect` cleanup.
- ❌ Do NOT use GSAP for reactive component state (use Framer Motion `variants`).

```typescript
// ✅ CORRECT — GSAP inside useEffect with cleanup
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.hero-headline', { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' });
  }, sectionRef);

  return () => ctx.revert(); // ✅ Always clean up GSAP context
}, []);
```

---

## 2. Tailwind CSS Rules

### 2.1 General Tailwind Usage
- **Always use Tailwind utility classes** for spacing, typography, colors, borders, shadows, and layout. No inline `style={{}}` for values that can be expressed as a Tailwind class.
- **Use CSS variables for brand tokens** (colors, gradients, shadows) that Tailwind's palette doesn't cover — reference them as `bg-[var(--bg-surface)]`.
- **No arbitrary values unless justified.** Prefer `p-4` over `p-[17px]`. If a design spec demands a pixel-perfect custom value, document why.
- **Use `@apply` sparingly.** Only in `globals.css` for globally repeated component patterns (buttons, cards). Never in component files.

### 2.2 Class Order Convention
Follow this order within a `className` string (enforced by Prettier + `prettier-plugin-tailwindcss`):

```
Layout → Flexbox/Grid → Sizing → Spacing → Typography → Colors → Borders → Shadow → Effects → Transitions → Animations → Breakpoints
```

```tsx
// ✅ CORRECT class order
<div className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-text-primary bg-bg-surface border border-border-subtle rounded-lg shadow-card transition-all duration-250 hover:border-border-default hover:bg-bg-elevated">

// ❌ WRONG — Chaotic ordering
<div className="hover:bg-bg-elevated text-sm flex border-border-subtle transition-all border rounded-lg ...">
```

### 2.3 Responsive Design Rules
- **Mobile-first:** Base classes are mobile, breakpoints add complexity upward.
- **Breakpoints:** `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px), `2xl:` (1536px).
- **Never hardcode pixel widths** for layout containers — use Tailwind's responsive width utilities or `max-w-*` with `mx-auto`.

```tsx
// ✅ CORRECT — Mobile-first responsive grid
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

// ❌ WRONG — Desktop-only, no mobile consideration
<div className="grid grid-cols-4 gap-4">
```

### 2.4 Dark Mode
- **The platform is dark-mode-first.** All base classes should target the dark theme.
- Use `dark:` modifier only for light mode overrides (if a light mode toggle is added in v2).
- Never use `bg-white` or `text-black` — always use semantic tokens like `bg-bg-surface`, `text-text-primary`.

### 2.5 Color Usage Rules
```
--bg-base         → Page backgrounds only (body, full-screen wrappers)
--bg-surface      → Cards, panels, sidebar background
--bg-elevated     → Modals, dropdowns, tooltips
--accent-primary  → Primary CTAs, active nav items, selected states, links
--accent-secondary → Success states, "applied" status, confirmation UI
--accent-warning  → "Needs review", caution alerts, paused agent state
--accent-danger   → Errors, rejections, destructive actions, failure states
--accent-ai       → AI activity indicators, streaming text cursor, LLM reasoning panel
```

---

## 3. Framer Motion Rules

### 3.1 Variant Centralization
- **All animation variants must live in `lib/animations.ts`** — never define inline variant objects inside components. This ensures reusability and a single source of truth.
- Name variants using the pattern: `<component><State>Variants` (e.g., `drawerVariants`, `listItemVariants`, `pageVariants`).

```typescript
// ✅ CORRECT — Import shared variants
import { listItemVariants, staggerContainerVariants } from '@/lib/animations';

// ❌ WRONG — Inline variant object
<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }}>
```

### 3.2 Always Use AnimatePresence for Exit Animations
- Any component that conditionally renders (`isOpen`, `isVisible`, `show`) **must** be wrapped in `<AnimatePresence>` to enable exit animations.
- Always provide a unique `key` to the direct `<motion.*>` child inside `AnimatePresence`.

```tsx
// ✅ CORRECT
<AnimatePresence mode="wait">
  {showModal && (
    <motion.div key="modal" variants={modalVariants} initial="hidden" animate="visible" exit="exit">
      ...
    </motion.div>
  )}
</AnimatePresence>
```

### 3.3 Layout Animations
- Use the `layout` prop on list items that can be reordered (Kanban cards, application list).
- Wrap reorderable lists in `<LayoutGroup>` for coordinated layout animations.
- Use `layoutId` for shared element transitions (e.g., a selected card expanding to a detail view).

### 3.4 Performance Rules
- **Never animate `width`, `height`, or `margin` directly** — they trigger layout. Animate `scaleX`, `scaleY`, or `transform` instead.
- **Use `will-change: transform` via Tailwind** (`will-change-transform`) on elements that animate continuously.
- **Avoid animating DOM nodes in long lists.** For lists > 50 items, use virtualization (`react-virtual`) and only animate visible items.

### 3.5 Spring Physics Defaults
Use consistent spring configs for a cohesive feel:

```typescript
// "Snappy" — for UI elements like badges, chips
{ type: 'spring', stiffness: 400, damping: 35 }

// "Smooth" — for drawers, panels, modals
{ type: 'spring', stiffness: 280, damping: 32 }

// "Gentle" — for page transitions, large containers
{ type: 'spring', stiffness: 180, damping: 25 }
```

---

## 4. GSAP Rules

### 4.1 Always Use GSAP Context
Every GSAP animation must be wrapped in a `gsap.context()` block and cleaned up on component unmount. Failing to clean up causes memory leaks and animation conflicts on Next.js route changes.

```typescript
// ✅ CORRECT — Context + cleanup
useEffect(() => {
  const ctx = gsap.context(() => {
    // All GSAP code here
    gsap.from('.hero-title', { opacity: 0, y: 40, duration: 0.8 });
    ScrollTrigger.create({ ... });
  }, containerRef); // Scope to the component's root ref

  return () => ctx.revert(); // Cleans up all animations in this context
}, []);
```

### 4.2 Use Data Attributes for GSAP Selectors
Never select elements by generic CSS class names in GSAP — they will match unintended elements in re-renders or other routes. Use `data-gsap` attributes for GSAP targeting.

```tsx
// ✅ CORRECT — Scoped data attribute selector
<h1 data-gsap="hero-headline" className="text-4xl font-bold ...">...</h1>

// In GSAP:
gsap.from('[data-gsap="hero-headline"]', { opacity: 0, y: 40, duration: 0.8 });

// ❌ WRONG — Generic class name, may match other elements
gsap.from('.hero-headline', { ... });
```

### 4.3 ScrollTrigger Registration & Refresh
- Always `ScrollTrigger.refresh()` after dynamic content loads (e.g., after Supabase data resolves).
- Use `ScrollTrigger.normalizeScroll(true)` for consistent cross-device scroll behavior.

### 4.4 Easing Reference
Use these approved GSAP eases consistently:

```
Entrance elements:    'power3.out'    (fast in, gentle settle)
Exit elements:        'power2.in'     (gentle start, fast end)
Background parallax:  'none'          (linear for scroll-scrub)
Buttons / CTAs:       'back.out(1.4)' (slight overshoot pop)
Counters / progress:  'power1.inOut'  (smooth, even feel)
Organic / natural:    'elastic.out(1, 0.3)' (bouncy, use sparingly)
```

### 4.5 GSAP Plugin Rules
- GSAP is **client-side only**. Always guard with `typeof window !== 'undefined'` or use `useEffect`.
- Register plugins exactly once, in `lib/gsap.ts`, never in individual components.
- `DrawSVGPlugin` requires a GSAP Club GreenSock license for commercial use — confirm license before using in production.

---

## 5. Component & Code Rules

### 5.1 Component File Structure
```
components/
├── ui/                 # Primitive, reusable components (Button, Badge, Input, Card)
├── features/           # Domain-specific components
│   ├── jobs/           # JobCard, JobFilter, JobDetailDrawer
│   ├── applications/   # KanbanColumn, ApplicationCard, ApplicationSheet
│   ├── profile/        # SkillChip, ExperienceTimeline, PreferencesForm
│   ├── dashboard/      # StatCard, ActivityFeed, QuotaMeter, AgentPulse
│   └── billing/        # PlanCard, UsageMeter, InvoiceTable
├── layouts/            # AppShell, AuthLayout, MarketingLayout, Sidebar, TopNav
└── animations/         # Reusable motion wrappers (PageTransition, StaggerList, FadeIn)
```

### 5.2 Naming Conventions
```
Components:     PascalCase              (JobCard, QuotaMeter, AgentPulse)
Hooks:          camelCase with "use"    (useApplications, useQuota, useAgentStatus)
Utilities:      camelCase              (formatSalary, computeMatchScore)
Constants:      UPPER_SNAKE_CASE       (DEFAULT_DAILY_CAP, STATUS_COLORS)
Types:          PascalCase with suffix  (JobListingType, ApplicationStatus, MatchDecision)
API routes:     kebab-case             (/api/webhooks/stripe, /api/billing/create-checkout)
```

### 5.3 Button Rules
All buttons must use the `<Button>` primitive from `components/ui/Button.tsx`. Direct `<button>` or `<a>` elements are only used inside the `<Button>` component itself.

```tsx
// Button variants (must match the Button component's variant prop)
<Button variant="primary">Start Free Trial</Button>   // Gradient accent, main CTA
<Button variant="secondary">View Details</Button>      // Subtle border, secondary action
<Button variant="ghost">Cancel</Button>                // No background, destructive action
<Button variant="danger">Delete Account</Button>       // Red accent, irreversible actions
<Button variant="ai">Generate Cover Letter</Button>    // Purple-AI gradient, AI-triggered
```

### 5.4 Status Badge Rules
Application status must always render through `<StatusBadge status={application.status} />`. Never hard-code status labels or colors in-line.

```tsx
// ✅ CORRECT
<StatusBadge status="needs_review" />

// ❌ WRONG
<span className="text-yellow-500">Needs Review</span>
```

### 5.5 Loading & Error States
Every data-fetching component must handle **three states**: loading (skeleton), error (error boundary), and empty state. No exceptions.

```tsx
// Required pattern for all data-fetching components
if (isLoading)  return <ComponentSkeleton />;
if (isError)    return <ErrorState error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState title="..." description="..." action={...} />;
return <ComponentContent data={data} />;
```

---

## 6. Accessibility Rules (WCAG 2.1 AA)

### 6.1 Color Contrast
- **Normal text:** Minimum contrast ratio of **4.5:1** against its background.
- **Large text (18px+ or 14px+ bold):** Minimum **3:1**.
- Use the browser's DevTools or `axe` extension to verify before shipping any new color combination.

### 6.2 Keyboard & Focus
- **Every interactive element** must be reachable and operable via keyboard.
- **Focus ring:** All focusable elements must show a visible `focus-visible` ring using `focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]`.
- **Tab order:** Must follow the visual reading order. Never use `tabindex > 0`.

```tsx
// ✅ CORRECT — Always include focus-visible ring
<button className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]">
```

### 6.3 Semantic HTML
- Use semantic elements: `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>`, `<header>`, `<footer>`.
- One `<h1>` per page. Heading hierarchy must not skip levels (h1 → h2 → h3, never h1 → h3).
- Form inputs must always have an associated `<label>` (or `aria-label`).

### 6.4 ARIA
- Dynamic status changes broadcast via `aria-live="polite"` (non-urgent) or `aria-live="assertive"` (urgent failures/alerts only).
- Kanban columns: `role="list"`, cards: `role="listitem"`.
- Icon-only buttons: always include `aria-label`.
- Loading spinners: `role="status"` + `aria-label="Loading..."`.

### 6.5 Reduced Motion
All animations must respect `prefers-reduced-motion`. GSAP and Framer Motion both support this:

```typescript
// GSAP — global disable
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);
}

// Framer Motion — use the hook
import { useReducedMotion } from 'framer-motion';
const prefersReduced = useReducedMotion();
const animationVariants = prefersReduced ? {} : listItemVariants;

// Tailwind — in globals.css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Performance Rules

### 7.1 Image Optimization
- Always use `next/image` for all images. Never use raw `<img>` tags.
- Provide `width`, `height`, and meaningful `alt` text on every image.
- Use `priority` prop on above-the-fold hero images.
- Company logos: lazy-load with `loading="lazy"` (default in `next/image`).

### 7.2 Bundle Size
- **Icons:** Import only the icons you use from `lucide-react`. Never import the whole library.
- **GSAP:** Import only the plugins you register. Use the GSAP modular build.
- **Framer Motion:** Use `LazyMotion` + `domAnimation` features to reduce bundle size in production.

```tsx
// ✅ CORRECT — Tree-shaken Framer Motion
import { LazyMotion, domAnimation, m } from 'framer-motion';

<LazyMotion features={domAnimation}>
  <m.div variants={listItemVariants}>...</m.div>
</LazyMotion>
```

### 7.3 Data Fetching
- Use **TanStack Query** for all Supabase data fetching. Never use `useState` + `useEffect` + `fetch` directly.
- Set `staleTime: 60_000` (1 minute) on queries that don't need realtime updates.
- For Realtime-subscribed data (applications, activity log), use Supabase Realtime channels to update the TanStack Query cache directly rather than polling.

### 7.4 Suspense & Code-Splitting (React + Vite)
- Wrap all heavy route components and charts in `<Suspense fallback={<SectionSkeleton />}>` with `React.lazy(() => import('./HeavyComponent'))`.
- Use Vite dynamic imports (`import()`) for automatic vendor chunking and fast initial load.

---

## 8. Security Rules (Frontend-Specific)

| Rule | Detail |
| :--- | :--- |
| **No secrets in client code** | `VITE_*` vars are bundled into client JS — only publishable keys go here. Secret keys (Stripe SK, Supabase service role key, Clerk secret key, NVIDIA key) live exclusively on the backend server / Supabase edge. |
| **No `.env` commits** | `.env.local`, `.env.production` must be in `.gitignore`. Use hosting provider environment variables for production. |
| **Validate webhook signatures server-side** | Stripe and Clerk webhooks must be verified with their respective signature secrets inside backend server endpoints, never on the client. |
| **Supabase RLS is not optional** | Never disable RLS on any user-facing table, even temporarily in development. Use the Supabase service role key (server-only) for admin operations. |
| **Sanitize all user-generated text** | Profile data, job listing descriptions, and AI-generated content rendered as HTML must be sanitized with `DOMPurify` to prevent XSS. |

---

## 9. `.gitignore` & Environment Hygiene

The following must **always** be in `.gitignore`:

```gitignore
# Environment secrets
.env
.env.local
.env.*.local
.env.production

# Secret / credential files (user-defined)
context/secret-key.md
*.secret.*

# Build artifacts
dist/
build/

# Dependencies
node_modules/
.pnpm-store/
```

**Use `.env.local` for all local development secrets:**

```bash
# .env.local — NEVER COMMIT THIS FILE

# Client-Exposed Variables (React + Vite)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server-Only Variables (Node/Express backend)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

---

## 10. UI/UX Pro Max Standards & Quality Checklist

All frontend code must comply with the **UI/UX Pro Max** framework. The global source of truth is located in [`context/design-system/jobhunt-ai/MASTER.md`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/MASTER.md), with route-specific overrides in [`context/design-system/jobhunt-ai/pages/`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/pages/).

### 10.1 UI/UX Pro Max Anti-Patterns (HIGH Severity Violations)

The following anti-patterns will cause code review rejection:

| Anti-Pattern | Severity | Why It Fails | Strict Remedy |
| :--- | :--- | :--- | :--- |
| **Emojis as Icons** (e.g. 💼, 🤖, ⚡) | **HIGH** | Inconsistent across OS, destroys enterprise trust, unreadable by screen readers. | **Strictly use SVG icons** from `lucide-react`. |
| **Missing `cursor-pointer`** | **HIGH** | Breaks interaction affordance — user doubts if card/row is clickable. | Ensure every clickable element, card, and row has `cursor-pointer`. |
| **Unresponsive Submits (>300ms)** | **HIGH** | User repeatedly clicks, creating duplicate actions or double Stripe charges. | Switch buttons to loading spinner/disabled state within 50ms of submit. |
| **Layout Shift (CLS > 0.05)** | **HIGH** | Content jumps as async data loads, causing misclicks. | Always reserve dimensions using `<Skeleton className="h-48" />`. |
| **Heavy Bundles Without Code-Splitting**| **HIGH** | Ships 300KB+ unused Chart/GSAP bundle to client on initial paint. | Use `next/dynamic` with `ssr: false` for heavy interactive widgets. |
| **Div-based Buttons (`<div onClick>`)** | **HIGH** | Destroys keyboard navigation and accessibility. | Use native `<button>` or Radix/Shadcn primitives with ARIA attributes. |

### 10.2 Technical Decision Rules
- `{"must_have": "real-time-updates"}`: Use Supabase Realtime channels to update TanStack Query cache directly. Never poll via `setInterval`.
- `{"if_large_dataset": "prioritize-performance"}`: For lists/tables exceeding 50 items, enforce window virtualization with `@tanstack/react-virtual`.
- `{"must_have": "advanced-search"}`: Search bars must be debounced (250ms), multi-faceted, and non-blocking.
- `{"if_salary_focused": "highlight-compensation"}`: Highlight salary ranges in dedicated badges with `font-mono tabular-nums`.

### 10.3 Pre-Delivery Quality Checklist

Before submitting or deploying any frontend component, verify all items:

- [ ] **Icons:** 100% SVG from `lucide-react` (Zero emojis).
- [ ] **Affordance:** `cursor-pointer` applied on all interactive items.
- [ ] **Transitions:** Hover animations are 150ms–250ms (no sluggish >400ms lag).
- [ ] **Contrast:** Minimum 4.5:1 text-to-background contrast on dark theme.
- [ ] **Focus Visible:** Visible high-contrast focus rings for keyboard navigation.
- [ ] **Layout Stability:** Skeletons match exact final component dimensions (CLS = 0).
- [ ] **Reduced Motion:** Verified with `prefers-reduced-motion: reduce`.
- [ ] **Responsive Breakpoints:** Verified at 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px (Desktop).

