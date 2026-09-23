# Frontend Design Specification: AI Job Hunt Agents SaaS Platform

**Version:** 1.0 (Draft) | **Companion to:** PRD.md, TRD.md, ARCHITECTURE.md | **Status:** For Review

---

## 1. Design Philosophy & Brand Identity

### 1.1 Core Aesthetic Principles

The platform should feel like a **premium, intelligent command center** — not just a job board. The user should feel empowered and in control, as if they have a team of AI employees working on their behalf.

| Principle | Description |
| :--- | :--- |
| **Dark-First Design** | Dark mode as the primary theme (deep navy/charcoal backgrounds), with a high-contrast light mode fallback. |
| **Data-Dense but Scannable** | Power-user dashboard with cards, tables, and filters that surface the right information without overwhelming. |
| **Glassmorphism Accents** | Frosted glass cards with subtle blurred backgrounds for modals, sidebars, and stat cards. |
| **Motion with Purpose** | Micro-animations on state transitions (status changes, quota fills, match score reveals); no gratuitous animation. |
| **AI-Forward Personality** | Subtle AI gradient pulses, typing indicators, and streaming text for active agent feedback. |

### 1.2 Brand Identity

```
Brand Name:   JobHunt AI (or user-defined product name)
Brand Feel:   Premium, intelligent, trust-inspiring, calm efficiency
Tone:         Professional yet approachable — "a brilliant assistant, not a bot"
```

---

## 2. Design Tokens & CSS Variables

### 2.1 Color Palette

```css
:root {
  /* === BACKGROUNDS === */
  --bg-base:         #0A0C10;   /* Near-black primary background */
  --bg-surface:      #111318;   /* Card / panel surfaces */
  --bg-elevated:     #1A1D24;   /* Elevated modals, dropdowns */
  --bg-glass:        rgba(255, 255, 255, 0.04); /* Glassmorphism fill */
  --bg-glass-border: rgba(255, 255, 255, 0.08); /* Glassmorphism border */

  /* === BRAND / ACCENT COLORS === */
  --accent-primary:  #6C63FF;   /* Indigo-violet — primary CTA, active states */
  --accent-glow:     rgba(108, 99, 255, 0.25); /* Glow effect for primary accent */
  --accent-secondary:#00C4B4;   /* Teal — success indicators, "applied" status */
  --accent-warning:  #F59E0B;   /* Amber — review-needed, paused states */
  --accent-danger:   #EF4444;   /* Red — failures, rejections, errors */
  --accent-ai:       #A855F7;   /* Purple-violet — AI activity indicators */

  /* === TEXT === */
  --text-primary:    #F0F2F5;   /* High contrast body text */
  --text-secondary:  #9DA3AE;   /* Subdued labels, metadata */
  --text-muted:      #4B5563;   /* Disabled, placeholder text */
  --text-inverse:    #0A0C10;   /* Text on light backgrounds / buttons */

  /* === STATUS COLORS === */
  --status-discovered:   #6B7280; /* Gray */
  --status-matched:      #3B82F6; /* Blue */
  --status-queued:       #8B5CF6; /* Purple */
  --status-applied:      #10B981; /* Green */
  --status-needs-review: #F59E0B; /* Amber */
  --status-interview:    #06B6D4; /* Cyan */
  --status-offer:        #22C55E; /* Bright Green */
  --status-rejected:     #EF4444; /* Red */
  --status-failed:       #DC2626; /* Dark Red */

  /* === GRADIENTS === */
  --gradient-brand:  linear-gradient(135deg, #6C63FF 0%, #A855F7 100%);
  --gradient-teal:   linear-gradient(135deg, #00C4B4 0%, #0EA5E9 100%);
  --gradient-ai:     linear-gradient(135deg, #A855F7 0%, #6C63FF 50%, #00C4B4 100%);

  /* === BORDERS & DIVIDERS === */
  --border-subtle:   rgba(255, 255, 255, 0.06);
  --border-default:  rgba(255, 255, 255, 0.10);
  --border-strong:   rgba(255, 255, 255, 0.18);

  /* === SHADOWS === */
  --shadow-card:     0 4px 24px rgba(0, 0, 0, 0.40);
  --shadow-elevated: 0 8px 48px rgba(0, 0, 0, 0.60);
  --shadow-accent:   0 0 32px rgba(108, 99, 255, 0.20);
}
```

### 2.2 Typography

```css
/* === FONTS === */
/* Headings: Inter (geometric, premium SaaS feel) */
/* Body: Inter / system-ui */
/* Monospace: JetBrains Mono (for code snippets, JSON data) */

--font-display:   'Inter', system-ui, sans-serif;
--font-mono:      'JetBrains Mono', 'Fira Code', monospace;

/* Scale (Fluid) */
--text-xs:    0.75rem;    /* 12px — badges, micro labels */
--text-sm:    0.875rem;   /* 14px — table cells, captions */
--text-base:  1rem;       /* 16px — body copy */
--text-lg:    1.125rem;   /* 18px — card headings */
--text-xl:    1.25rem;    /* 20px — section headings */
--text-2xl:   1.5rem;     /* 24px — page titles */
--text-3xl:   1.875rem;   /* 30px — hero headings */
--text-4xl:   2.25rem;    /* 36px — marketing hero */

/* Weights */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
--font-black:    900;
```

### 2.3 Spacing & Radius

```css
/* Spacing Scale (4px base) */
--space-1:  0.25rem;  /* 4px  */
--space-2:  0.5rem;   /* 8px  */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Border Radius */
--radius-sm:  0.375rem;   /* 6px  — badges, small chips */
--radius-md:  0.625rem;   /* 10px — buttons, inputs */
--radius-lg:  0.875rem;   /* 14px — cards */
--radius-xl:  1.25rem;    /* 20px — modals, large panels */
--radius-2xl: 1.75rem;    /* 28px — sidebar, full panels */
--radius-full: 9999px;    /* Pills, avatars, toggles */
```

---

## 3. Page Layout & Navigation Structure

### 3.1 Application Shell Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          TOP NAV BAR (64px)                              │
│  [Logo]  [Breadcrumb]                [AI Status Pulse]  [Quota Meter]   │
│                                      [Notif Bell]       [User Avatar]   │
└───────────────┬──────────────────────────────────────────────────────────┘
                │
┌───────────────┴─────────────────────────────────────────────────────────┐
│  SIDEBAR      │                  MAIN CONTENT AREA                      │
│  (240px)      │                                                          │
│               │                                                          │
│  ● Dashboard  │   [Page Header with Actions]                            │
│  ● Jobs       │                                                          │
│  ● Applications│  [Content Grid / Table / Form]                         │
│  ● Profile    │                                                          │
│  ● Settings   │                                                          │
│               │                                                          │
│  ─────────    │                                                          │
│  ● Billing    │                                                          │
│  ● Docs       │                                                          │
└───────────────┴─────────────────────────────────────────────────────────┘
```

### 3.2 Sidebar Navigation

| Nav Item | Icon | Badge / Indicator | Route |
| :--- | :--- | :--- | :--- |
| Dashboard | `LayoutDashboard` | Agent status pulse | `/dashboard` |
| Jobs | `Briefcase` | New matches count | `/jobs` |
| Applications | `SendHorizonal` | Needs review count | `/applications` |
| Profile | `UserCircle` | Setup completion % | `/profile` |
| Activity Log | `Activity` | — | `/activity` |
| Settings | `Settings2` | — | `/settings` |
| ─── | — | — | — |
| Billing & Plans | `CreditCard` | Current tier badge | `/billing` |

---

## 4. Page Designs & Component Specifications

---

### 4.1 Marketing / Landing Page (`/`)

**Purpose:** Convert visitors to trial signups; communicate value and tier differentiation.

**Sections:**
1. **Hero:** Full-width dark hero with animated particle or gradient background. Headline: *"Your AI Job Search Team, Working 24/7"*. CTA: `Start Free Trial` (→ Clerk Sign Up). Below headline: social proof ("Applied to 10,000+ jobs this month").
2. **How It Works:** 3-step visual flow — Upload Resume → Agent Discovers Jobs → You Track Offers. Animated connection lines between steps.
3. **Live Demo / Preview:** Animated mock dashboard screenshot auto-scrolling through status cards.
4. **Feature Grid:** 6 feature highlight cards (Resume Parsing, Vector Matching, AI Cover Letters, Auto-Submit, Audit Trail, Multi-Platform).
5. **Pricing Table:** Starter / Pro / Power tier cards, with monthly/annual toggle (Stripe-connected). Pro card highlighted with gradient border + "Most Popular" badge.
6. **FAQ Accordion**
7. **Footer:** Links, social, legal.

---

### 4.2 Authentication Pages (Clerk Hosted / `<SignIn />`, `<SignUp />`)

**Design approach:** Embed Clerk's `<SignIn />` and `<SignUp />` components within a custom-branded layout rather than using Clerk's hosted pages.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SPLIT LAYOUT: Left (60%) Brand Panel | Right (40%) Auth Form      │
│                                                                     │
│  Left:                          Right:                              │
│  ╔══════════════════════╗        ┌─────────────────────────────┐   │
│  ║ Animated Gradient    ║        │  Logo                       │   │
│  ║ Background           ║        │  "Sign in to JobHunt AI"    │   │
│  ║                      ║        │                             │   │
│  ║ Social Proof Quote   ║        │  [Clerk <SignIn /> ]        │   │
│  ║ "From 200+ to 4      ║        │  - Google                   │   │
│  ║  interviews in 2     ║        │  - GitHub                   │   │
│  ║  weeks"              ║        │  - LinkedIn                 │   │
│  ╚══════════════════════╝        │  - Email                    │   │
│                                  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Clerk Theme Overrides (match brand):**
```json
{
  "baseTheme": "dark",
  "variables": {
    "colorPrimary": "#6C63FF",
    "colorBackground": "#111318",
    "colorInputBackground": "#1A1D24",
    "colorText": "#F0F2F5",
    "borderRadius": "0.625rem",
    "fontFamily": "'Inter', system-ui"
  }
}
```

---

### 4.3 Onboarding Wizard (`/onboarding`)

**Purpose:** First-time user setup — guided 4-step flow.

```
[Step 1: Resume Upload] → [Step 2: Review Parsed Profile] → [Step 3: Set Preferences] → [Step 4: Connect Platforms]
```

**Step 1 — Resume Upload:**
- Drag-and-drop upload zone (PDF / DOCX) with animated upload progress.
- Upload triggers Supabase Storage write + async parsing.
- Animated AI "parsing" state with streaming skeleton loader.

**Step 2 — Profile Review:**
- Skills displayed as removable chip badges (`<Badge variant="skill" />`).
- Experience timeline component showing parsed positions.
- Edit icon on each section to inline-edit extracted data.
- Inline confirmation: *"AI extracted 24 skills and 4 years of experience".*

**Step 3 — Job Preferences:**
- Multi-select tag inputs for target roles, industries, and locations.
- Salary range slider (min/max).
- Blacklist company input with autocomplete.
- Daily cap stepper (5 / 10 / 20 / Unlimited based on plan).
- "Autonomy Mode" toggle: Review First (default) ↔ Full Auto-Submit.

**Step 4 — Connect Platforms:**
- OAuth connect buttons per platform (LinkedIn, Greenhouse, etc.).
- Status indicator: Connected (green checkmark), Pending, or Failed (red badge).
- CTA: `Start Discovery Agent →` (triggers first scheduled scan).

---

### 4.4 Main Dashboard (`/dashboard`)

**Purpose:** Central command center — AI pipeline health, quota usage, and recent activity at a glance.

#### Layout & Components:

**Top Stats Row (4 cards):**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  APPLICATIONS    │  │  MATCHES TODAY   │  │  AGENT STATUS    │  │  QUOTA METER     │
│  This Month      │  │                  │  │                  │  │                  │
│  ━━━━━━━━━━━━━━  │  │  ━━━━━━━━━━━━━━  │  │   ● Running      │  │  34 / 250        │
│  34              │  │  12 New Jobs     │  │   Active Scan    │  │  ████████░░ 87%  │
│  ↑ +6 from yday  │  │  8 Matched       │  │   LinkedIn       │  │  Starter Plan    │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

- **Agent Status Card:** Real-time pulse animation when workers are active. Shows which platform is being scanned with a spinning icon.
- **Quota Meter Card:** Animated radial or linear progress bar with tier label. Links to `/billing` if quota > 85%.

**Activity Feed (Left, 60%):**
- Real-time scrollable list of agent events (via Supabase Realtime).
- Each row shows: icon (event type), description, company + role, timestamp.
- Filter pills: `All` | `Applied` | `Matched` | `Needs Review` | `Errors`.

**Needs Review Queue (Right, 40%):**
- Compact card list of applications awaiting user approval.
- Each card: Company logo, Job Title, Match Score badge, `Approve` / `Skip` action buttons.
- "Empty state": animated checkmark with "All caught up!" message.

---

### 4.5 Jobs Discovery Page (`/jobs`)

**Purpose:** Browse all discovered, matched, and queued job listings.

**Toolbar:**
- Search input (by title/company).
- Filter dropdowns: Status, Platform, Match Score range, Location.
- Sort: Match Score (desc) | Date Discovered | Company Name.

**Job Listing Table / Card Grid Toggle:**

**Card Grid View:**
```
┌─────────────────────────────────────┐
│ [Company Logo]  Acme Corp            │  ← Gradient border if score > 0.85
│ Senior Backend Engineer              │
│ Remote · San Francisco, CA           │
│ $120K – $180K                        │
│                                      │
│ Match: ████████░░ 86%  [LinkedIn]    │
│                                      │
│ [ View Details ]  [ Add to Review ] │
└─────────────────────────────────────┘
```

**Table View:** Compact rows with sortable columns: Title, Company, Location, Salary, Match Score, Status, Discovered At, Action.

**Job Detail Drawer / Modal:**
- Full job description with skill highlights (keywords matching profile highlighted in `--accent-primary`).
- Score Breakdown visualization: Horizontal stacked bar showing skills, salary, location, and LLM sub-scores.
- AI Reasoning text block (collapsible).
- Actions: `Queue Application`, `Skip`, `Mark as Not Interested`.

---

### 4.6 Applications Pipeline (`/applications`)

**Purpose:** Track every application across all lifecycle stages.

**Kanban View (default) / Table View Toggle:**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  QUEUED      │  │ NEEDS REVIEW │  │  APPLIED     │  │  INTERVIEW   │  │   OFFER      │
│  (8)         │  │  ⚠️ (3)      │  │  (34)        │  │  (2)         │  │  (1)         │
│──────────────│  │──────────────│  │──────────────│  │──────────────│  │──────────────│
│ [Job Card]   │  │ [Job Card]   │  │ [Job Card]   │  │ [Job Card]   │  │ [Job Card]   │
│ [Job Card]   │  │ [Job Card]   │  │ [Job Card]   │  │              │  │              │
│ ...          │  │ [Job Card]   │  │ ...          │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Application Detail Sheet (Slide-in panel):**
- Job info header (title, company, source platform badge).
- Status timeline: Vertical step indicators showing all status transitions with timestamps.
- **Submitted Content tab:** Generated cover letter text, tailored resume summary, Q&A answers — all with copy buttons.
- **Audit Log tab:** Full immutable activity event stream for this application.
- **Documents tab:** Links to Supabase Storage — original resume, submission screenshot.
- **Actions:** `View Original Job Posting`, `Manual Status Update`, `Download Audit PDF`.

---

### 4.7 Profile Management (`/profile`)

**Purpose:** View and edit the AI-parsed user profile and application preferences.

**Sections:**

1. **Profile Snapshot Header:** Avatar, name, headline. Edit button opens inline editing.
2. **Skills Section:** Tag cloud of extracted skills. Add, remove, or reorder skills manually. Each skill chip shows confidence level from initial extraction.
3. **Experience Timeline:** Vertical timeline of work history. Expandable accordion per position showing description and achievements.
4. **Education & Certifications.**
5. **Links & Profiles:** LinkedIn URL, GitHub, Portfolio — edit in-place with validation.
6. **Preferences Panel:** Inline form for target roles, salary floor, location, remote preference, work authorization.
7. **Blacklist Panel:** Company names to exclude from auto-apply. Input with autocomplete.
8. **Standard Answers:** Expandable list of stored screening answers (visa sponsorship, relocation, notice period). CRUD interface.
9. **Autonomy Settings:** Toggle between Review Mode / Full Auto-Submit with a clear risk/benefit tooltip.

---

### 4.8 Activity Log (`/activity`)

**Purpose:** Full audit trail of everything the AI agents did.

- **Table:** Timestamp | Event Type Icon | Description | Job/Company | Platform | Payload (expand to JSON).
- **Date Range Picker** + **Event Type Multi-Filter**.
- **Export Button:** Download as CSV or JSON.

---

### 4.9 Billing & Subscription (`/billing`)

**Purpose:** Plan overview, usage metrics, and Stripe self-service portal access.

```
┌──────────────────────────────────────────────────────────────────┐
│  CURRENT PLAN: PRO ($79 / month)                   [Manage Plan] │
│  Next billing: October 23, 2026 · Cancel anytime                 │
│                                                                  │
│  Monthly Usage:                                                  │
│  Applications Used    34 of 250   ██████░░░░░░░░ 14%            │
│  Daily Cap Today       6 of 15    ████░░░░░░░░░░ 40%            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Upgrade to Power ($149/mo) for unlimited applications           │
│  [ View Plans ]                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **`[Manage Plan]` Button:** Opens Stripe Customer Billing Portal in new tab.
- **`[View Plans]` Button:** Opens pricing comparison modal with Stripe Checkout links.
- **Invoice History Table:** Synced from Stripe — date, amount, status, download PDF.

---

### 4.10 Settings (`/settings`)

Tabbed settings page:

| Tab | Contents |
| :--- | :--- |
| **Account** | Display name, email (read-only from Clerk), avatar upload. |
| **Notifications** | Email alerts toggles (Needs Review, Daily Summary, Interview Detected, Failure Alerts). |
| **Platforms** | Manage connected job platform credentials, re-auth expired sessions. |
| **Discovery** | Scan frequency per platform (Starter: 6h, Pro: 3h, Power: 1h). |
| **Danger Zone** | Pause all agent activity, Delete Account (GDPR erasure). |

---

## 5. Core Component Library

### 5.1 Global UI Components

| Component | Description | Key Props |
| :--- | :--- | :--- |
| `<StatusBadge />` | Colored pill for application status | `status`, `size` |
| `<MatchScoreBar />` | Horizontal stacked bar with score breakdown | `breakdown`, `total` |
| `<QuotaMeter />` | Linear or radial progress with label | `used`, `total`, `tier` |
| `<AgentPulse />` | Animated dot indicating active agent | `isActive`, `platform` |
| `<JobCard />` | Card with logo, title, match score, actions | `job`, `onApprove`, `onSkip` |
| `<StatusTimeline />` | Vertical step list of status transitions | `history[]` |
| `<GlassCard />` | Frosted glass surface container | `children`, `className` |
| `<SkillChip />` | Removable tag chip for skills | `label`, `onRemove`, `confidence` |
| `<DataTable />` | Sortable, filterable data table | `columns[]`, `data[]`, `onSort` |
| `<EmptyState />` | Illustrated empty/zero state with CTA | `title`, `description`, `action` |

### 5.2 AI-Specific Components

| Component | Description |
| :--- | :--- |
| `<StreamingText />` | Typewriter-style animated text for AI-generated cover letters / reasoning. |
| `<FactCheckBadge />` | Green "Fact Verified" or amber "Flagged" indicator on generated content. |
| `<AIReasoningPanel />` | Collapsible panel showing LLM scoring rationale and tier breakdown. |
| `<AgentStatusBar />` | Top-of-page or sidebar banner showing running agent tasks with real-time labels. |

---

## 6. Responsive Design Strategy

| Breakpoint | Layout Behavior |
| :--- | :--- |
| **Mobile** (< 768px) | Single-column. Sidebar collapses to bottom nav bar. Kanban → scrollable tabs. Tables → card list. |
| **Tablet** (768–1024px) | Sidebar collapses to icon-only rail (48px). Content grid at 2 columns. |
| **Desktop** (1024–1440px) | Full sidebar (240px) + main content. Primary design target. |
| **Wide** (> 1440px) | Content max-width constrained to 1400px, centered. |

---

## 7. Animation System: Tailwind CSS + Framer Motion + GSAP

The platform uses **three layers of animation** with clearly defined responsibilities:

| Layer | Tool | Used For |
| :--- | :--- | :--- |
| **Utility Transitions** | **Tailwind CSS** | Hover states, color transitions, opacity, scale on interactive elements — zero-JS, instant. |
| **Component & Layout Animations** | **Framer Motion** | Mount/unmount transitions, Kanban drag-and-drop, page transitions, spring physics, layout animations. |
| **Scroll & Timeline Sequences** | **GSAP (GreenSock)** | Landing page scroll-triggered animations, staggered reveal sequences, complex multi-element timelines, SVG morphing. |

---

### 7.1 Tailwind CSS Animation Utilities

Tailwind handles all **micro-interaction states** — the fastest class of animation that should never require JavaScript:

```typescript
// Tailwind config additions (tailwind.config.ts)
module.exports = {
  theme: {
    extend: {
      animation: {
        'agent-pulse':    'agent-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up':       'slide-up 0.3s ease-out',
        'fill-bar':       'fill-bar 0.6s ease-out forwards',
        'blink-cursor':   'blink-cursor 1s step-end infinite',
        'shimmer':        'shimmer 1.8s linear infinite',
        'fade-in':        'fade-in 0.25s ease-out',
      },
      keyframes: {
        'agent-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)',    boxShadow: '0 0 0 0 rgba(108,99,255,0.4)' },
          '50%':       { opacity: '0.8', transform: 'scale(1.05)', boxShadow: '0 0 0 8px rgba(108,99,255,0)' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'fill-bar': {
          'from': { width: '0%' },
          'to':   { width: 'var(--tw-bar-width)' },
        },
        'blink-cursor': {
          '0%, 100%': { borderColor: 'transparent' },
          '50%':       { borderColor: '#6C63FF' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
};
```

**Tailwind animation class usage rules:**
- `hover:scale-[1.02]` — subtle lift on all clickable cards.
- `hover:-translate-y-0.5` — micro-elevation on stat cards.
- `transition-all duration-250 ease-in-out` — default transition on all interactive elements.
- `animate-agent-pulse` — applied to the AI agent status dot when workers are active.
- `animate-shimmer` — skeleton loading backgrounds.
- `animate-slide-up` — Realtime feed items when appended.

---

### 7.2 Framer Motion — Component Animations

Framer Motion handles all **component lifecycle, layout, and physics-based** animations:

```typescript
// Shared animation variants (lib/animations.ts)
import { Variants } from 'framer-motion';

/** Fade + slide-up for list items (staggered with parent) */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Stagger container for lists and grids */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

/** Slide-in from right for drawers and modals */
export const drawerVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0,      opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 32 } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

/** Page-level fade transition */
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

/** Match score bar — animated width on mount */
export const scoreBarVariants: Variants = {
  hidden:  { scaleX: 0, originX: 0 },
  visible: (pct: number) => ({
    scaleX: pct,
    originX: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  }),
};

/** Kanban card drag physics */
export const kanbanCardDragConfig = {
  drag: 'x' as const,
  dragElastic: 0.08,
  dragConstraints: { left: -20, right: 20 },
  whileDrag: { scale: 1.03, rotate: 1, zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' },
};
```

```typescript
// Usage example — Job listing card
import { motion, AnimatePresence } from 'framer-motion';
import { listItemVariants, staggerContainerVariants } from '@/lib/animations';

// Staggered job card grid
<motion.ul variants={staggerContainerVariants} initial="hidden" animate="visible">
  {jobs.map((job) => (
    <motion.li key={job.id} variants={listItemVariants} layout>
      <JobCard job={job} />
    </motion.li>
  ))}
</motion.ul>

// Drawer with AnimatePresence
<AnimatePresence>
  {isOpen && (
    <motion.div variants={drawerVariants} initial="hidden" animate="visible" exit="exit">
      <ApplicationDetailSheet />
    </motion.div>
  )}
</AnimatePresence>

// Page transition wrapper
<motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
  {children}
</motion.div>
```

**Framer Motion component responsibilities:**
- `<AnimatePresence>` — Kanban column cards, modal/drawer mount/unmount, notification toasts.
- `layout` prop — smooth Kanban re-ordering when status changes.
- `whileHover` / `whileTap` — lift and press effects on cards and buttons.
- `useScroll` + `useTransform` — parallax on the Dashboard hero banner.
- `useSpring` — smooth quota meter number counting animation.
- `drag` — Kanban cards with spring snap-back.

---

### 7.3 GSAP — Scroll-Triggered & Timeline Animations

GSAP (with `ScrollTrigger`) handles **complex sequenced and scroll-driven** animations, primarily on the landing page and onboarding wizard:

```typescript
// GSAP + ScrollTrigger setup (app/layout.tsx or lib/gsap.ts)
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin, DrawSVGPlugin);

// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0); // Disable all GSAP timelines
}
```

```typescript
// Landing Page — Hero text typewriter reveal
const heroTimeline = gsap.timeline({ delay: 0.3 });
heroTimeline
  .from('.hero-headline', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
  })
  .from('.hero-subtext', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.4')
  .from('.hero-cta', { opacity: 0, scale: 0.9, duration: 0.4, ease: 'back.out(1.4)' }, '-=0.2')
  .from('.hero-stat-cards', {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.5,
    ease: 'power2.out',
  }, '-=0.1');
```

```typescript
// Landing Page — ScrollTrigger: Feature section staggered reveal
gsap.utils.toArray('.feature-card').forEach((card, i) => {
  gsap.from(card as Element, {
    scrollTrigger: {
      trigger: card as Element,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    opacity: 0,
    y: 50,
    duration: 0.6,
    delay: i * 0.08,
    ease: 'power2.out',
  });
});

// "How It Works" — animated connection line between steps
gsap.fromTo('.step-connector-line', {
  drawSVG: '0%',
}, {
  drawSVG: '100%',
  duration: 1.2,
  ease: 'power2.inOut',
  scrollTrigger: {
    trigger: '.how-it-works-section',
    start: 'top 60%',
    toggleActions: 'play none none reverse',
  },
});

// Pricing cards — scroll pin + horizontal scroll reveal (mobile)
ScrollTrigger.create({
  trigger: '.pricing-section',
  start: 'top top',
  end: '+=600',
  pin: true,
  anticipatePin: 1,
});
```

```typescript
// Dashboard — Quota number count-up animation on mount
gsap.fromTo(
  '.quota-number',
  { innerText: 0 },
  {
    innerText: 34,
    duration: 1.4,
    ease: 'power1.inOut',
    snap: { innerText: 1 },
    scrollTrigger: { trigger: '.quota-card', start: 'top 90%' },
  }
);

// Onboarding steps — pinned horizontal step progression
const stepTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: '.onboarding-steps',
    start: 'top top',
    end: '+=1200',
    scrub: 0.6,
    pin: true,
  },
});
stepTimeline
  .to('.step-indicator', { x: '-25%', ease: 'none' })
  .to('.step-content',   { x: '-100%', ease: 'none' }, '<');
```

**GSAP + ScrollTrigger responsibilities:**
- Landing page hero entrance timeline (staggered headline, CTA, stats).
- Feature card scroll-triggered staggered reveals.
- "How It Works" SVG path DrawSVG animation (animated connector lines).
- Pricing section scroll-pin and card reveal sequence.
- Onboarding step pinned scroll-scrub progression.
- Dashboard stat number count-up on initial viewport entry.
- Parallax depth layers on hero background gradient.

---

### 7.4 Animation Responsibility Matrix

| Animation Type | Tool | Example |
| :--- | :--- | :--- |
| Hover scale / color / opacity | **Tailwind** | `hover:scale-[1.02] transition-all duration-250` |
| Focus ring, active press | **Tailwind** | `focus-visible:ring-2 active:scale-95` |
| Skeleton shimmer | **Tailwind** | `animate-shimmer bg-gradient-to-r from-...` |
| Mount / unmount fade | **Framer Motion** | `<AnimatePresence>` + `variants` |
| Drawer / modal slide-in | **Framer Motion** | `drawerVariants` with spring physics |
| Page route transition | **Framer Motion** | `<LayoutGroup>` + `pageVariants` |
| Kanban drag reorder | **Framer Motion** | `layout` + `drag` + `whileDrag` |
| List stagger on load | **Framer Motion** | `staggerContainerVariants` |
| Landing page reveal | **GSAP** | `gsap.timeline()` + ScrollTrigger |
| SVG path drawing | **GSAP** | `DrawSVGPlugin` |
| Count-up numbers | **GSAP** | `innerText` tween with `snap` |
| Scroll-scrub sequences | **GSAP** | `scrub: true` ScrollTrigger |
| Pinned sections | **GSAP** | `pin: true` ScrollTrigger |

---

## 8. Empty States & Loading Skeletons

**Skeleton Loading Pattern:**
- All data-bound components render shimmer skeletons during Supabase fetch.
- Skeletons match exact layout dimensions of loaded components to prevent layout shift.

**Empty State Illustrations (SVG inline):**

| Page / Section | Empty State Message | CTA |
| :--- | :--- | :--- |
| Jobs (no discoveries yet) | "Your agents are warming up — first discoveries arrive shortly." | `View Profile Setup` |
| Applications (none yet) | "No applications yet. Start your agents to begin." | `Start Discovery` |
| Needs Review Queue (empty) | "All clear! Your agents are running autonomously." | `View All Applications` |
| Activity Log (new user) | "Activity will appear here as your agents work." | `Complete Profile Setup` |

---

## 9. Third-Party Integration UI Patterns

### 9.1 Clerk — Auth UI Integration
- Use `@clerk/nextjs` `<SignIn />` and `<SignUp />` with custom `appearance` prop to match brand tokens.
- `<UserButton />` in TopNav with custom menu items linking to `/settings` and `/billing`.
- Session-aware conditional rendering: hide nav items and redirect unauthenticated requests to sign-in.

### 9.2 Stripe — Checkout & Portal
- Stripe Checkout session created server-side via `/api/billing/create-checkout-session`; client receives URL and redirects.
- Stripe Customer Portal opened via `/api/billing/create-portal-session` redirect.
- Quota and billing state sourced from Supabase `subscriptions` table (webhook-synchronized).

### 9.3 Supabase — Realtime Dashboard
```typescript
// Subscribe to application status changes for the current user
const channel = supabase
  .channel('applications-realtime')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
    (payload) => updateApplicationCard(payload.new)
  )
  .subscribe();
```

---

## 10. Frontend Tech Stack & Tooling

| Category | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Framework** | **React + Vite** | React 18/19, Vite 5/6 | Ultra-fast HMR, lightweight SPA bundle, clean client architecture. |
| **Language** | TypeScript | 5.x | Full type safety across Supabase, Clerk, and Stripe SDK integrations. |
| **Client Routing** | `react-router-dom` | v6/v7 | Declarative SPA route layout, protected routes, nested outlets. |
| **Styling** | **Tailwind CSS** | v3.4+ / v4 | Utility-first; all hover, focus, and transition micro-interactions. Custom design tokens as CSS variables layered on top. |
| **Animation Layer 1** | **Tailwind CSS** | v3.4+ / v4 | Hover states, scale, opacity transitions, shimmer skeletons, utility keyframes. |
| **Animation Layer 2** | **Framer Motion** | 11.x | Component mount/unmount, route transitions, Kanban drag, spring physics, layout animations. |
| **Animation Layer 3** | **GSAP + ScrollTrigger** | 3.x | Landing page scroll sequences, SVG path drawing, count-up numbers, pinned sections. |
| **Component Primitives** | Radix UI (headless) | latest | Accessible, unstyled Dialog, Select, Tabs, Accordion — styled with Tailwind. |
| **Icons** | Lucide React | latest | Consistent, tree-shakeable SVG icon set (100% SVG, Zero emojis). |
| **State: Server** | TanStack Query (React Query) | v5 | Supabase data fetching, caching, and optimistic updates. |
| **State: Client UI** | Zustand | v4 | Lightweight global UI state (sidebar open, active kanban column, agent status). |
| **Forms** | React Hook Form + Zod | latest | Type-safe form validation for Profile, Preferences, and Settings pages. |
| **Auth** | `@clerk/clerk-react` | latest | Direct React SDK; `<ClerkProvider>`, `<SignedIn>`, `<SignedOut>`, `<UserButton />`. |
| **Database Client** | `@supabase/supabase-js` | 2.x | Direct Supabase browser client with Clerk JWT session integration & Realtime channels. |
| **Payments** | `@stripe/stripe-js` (Client) + `stripe` (Server) | latest | Embedded checkout redirects, customer portal links, webhook verification. |
| **Charts** | Recharts | 2.x | Quota trends, application success rates, response rate analytics. |
| **Package Manager** | pnpm | 9.x | Fast installs, strict dependency resolution. |

---

## 11. Route Map (React Router)

```
/                           → LandingPage (public marketing, hero simulator)
/sign-in/*                  → Clerk SignInPage
/sign-up/*                  → Clerk SignUpPage
/onboarding                 → OnboardingWizardPage (protected)
/dashboard                  → DashboardPage (Command Center, protected)
/jobs                       → JobListingsPage (protected)
/jobs/:id                   → JobDetailDrawer (nested route/sheet)
/applications               → ApplicationsKanbanPage (protected)
/applications/:id           → ApplicationDetailSheet (nested drawer)
/profile                    → ProfilePage (protected)
/activity                   → ActivityAuditLogPage (protected)
/billing                    → BillingPage (Stripe usage, protected)
/settings                   → SettingsPage (protected)
```

---

## 12. Accessibility (A11y) Standards

- **WCAG 2.1 AA Compliance:** Minimum contrast ratios met for all text/background combinations.
- **Keyboard Navigation:** All interactive elements fully focusable with visible focus rings (`--accent-primary` outline).
- **ARIA Attributes:** All custom components (Kanban, Drawer, Status Badge) carry appropriate `role`, `aria-label`, and `aria-live` attributes.
- **Reduced Motion:** `prefers-reduced-motion` media query disables all non-essential animations.
- **Screen Reader Support:** All status changes broadcast via `aria-live="polite"` regions.

---

## 13. UI/UX Pro Max Framework Integration

The entire frontend design is codified under the **UI/UX Pro Max** framework.

### 13.1 Design System Hierarchy
- **Master Design System (Global):** [`context/design-system/jobhunt-ai/MASTER.md`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/MASTER.md) defines global color variables, typography imports (`Fira Code` + `Inter`), spacing scale, glass card styling, and component primitives.
- **Page-Specific Overrides:**
  - **Command Center Dashboard:** [`context/design-system/jobhunt-ai/pages/dashboard.md`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/pages/dashboard.md) — Real-time agent status pulse, KPI count-up metrics, terminal event stream, pipeline funnel.
  - **Landing Page:** [`context/design-system/jobhunt-ai/pages/landing.md`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/pages/landing.md) — Bento Grid Showcase, GSAP ScrollTrigger pinned timeline, interactive ATS live simulation, Stripe pricing matrix.
  - **Applications Pipeline:** [`context/design-system/jobhunt-ai/pages/applications.md`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/pages/applications.md) — Framer Motion drag-and-drop Kanban, optimistic Supabase cache updates, slide-over detail drawer.
  - **Job Discovery & Matches:** [`context/design-system/jobhunt-ai/pages/jobs.md`](file:///c:/Users/Acer/Desktop/job_hunt_agents/context/design-system/jobhunt-ai/pages/jobs.md) — Debounced search, multi-faceted filtering, composite match score breakdown popover.

### 13.2 High-Severity Anti-Patterns Enforced
- **Zero Emojis as Icons:** Strictly SVG from `lucide-react`.
- **Mandatory `cursor-pointer`:** On all clickable cards, buttons, badges, and table rows.
- **Immediate Submit Feedback:** Buttons transition to loading spinner within 50ms (no frozen clicks).
- **Zero Layout Shift (CLS = 0):** Exact dimensional aspect ratio skeletons (`<Skeleton className="h-48" />`).
- **Dynamic Imports:** Recharts and complex GSAP canvases split with `next/dynamic` (`ssr: false`).
- **Semantic Components:** Radix UI primitives and native buttons only; no `<div onClick>`.

