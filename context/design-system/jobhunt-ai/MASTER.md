# Design System Master Specification: JobHunt AI

> **SOURCE OF TRUTH:** Governed by the **UI/UX Pro Max** framework.
> When building or styling any page, first check `context/design-system/jobhunt-ai/pages/[page-name].md`.
> If that file exists, its page-specific rules **override** this Master file. Otherwise, strictly enforce the standards below.

---

**Project:** JobHunt AI — Autonomous AI Job Hunt SaaS Command Center  
**Design Philosophy:** AI-Native UI + Dark Mode (OLED) + Glassmorphism + Data-Dense Command Center  
**Framework Stack:** React (Vite + TS), Tailwind CSS v4, Framer Motion, GSAP, Radix UI / Shadcn, Lucide React  
**Compliance Level:** WCAG 2.1 AA | Zero-Layout Shift (CLS = 0) | Full Reduced-Motion Support  

---

## 1. Global Visual Identity & Theme Tokens

### 1.1 Color Architecture (OLED Dark First)

| Token | Hex / Value | Role & Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#020617` | Deep slate-black base for root viewport |
| `--bg-surface` | `#0B0F19` | Surface level 1: Cards, table containers, sidebar |
| `--bg-elevated` | `#151B2B` | Surface level 2: Modals, dropdowns, floating sheets |
| `--bg-glass` | `rgba(255, 255, 255, 0.03)` | Frosted glass fill with `backdrop-blur-md` |
| `--border-glass` | `rgba(255, 255, 255, 0.08)` | 1px border for glass panels and cards |
| `--border-glow` | `rgba(99, 102, 241, 0.25)` | Focused card border glow |
| `--color-primary` | `#6366F1` | Primary AI Violet / Indigo — Active states, primary brand actions |
| `--color-primary-hover`| `#4F46E5` | Hover state for primary buttons |
| `--color-secondary` | `#3B82F6` | Electric Blue — Pipeline progress, info badges, links |
| `--color-cta` | `#22C55E` | Emerald Green — High match score (≥80%), apply actions, conversion CTAs |
| `--color-warning` | `#F59E0B` | Amber — Needs review, manual action required, quota alerts |
| `--color-danger` | `#EF4444` | Red — Rejected, submission failed, error alerts |
| `--color-ai` | `#A855F7` | Electric Purple — AI generation, resume tailoring, agent pulse |
| `--color-text-primary` | `#F8FAFC` | 95% White high-contrast body & heading text |
| `--color-text-secondary`| `#94A3B8` | Slate 400 muted text for sub-labels and metadata |
| `--color-text-muted` | `#64748B` | Slate 500 disabled text and placeholders |

### 1.2 Typography Hierarchy

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');
```

- **Primary UI & Headings:** `Inter`, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.
  - High legibility, neutral geometry, clean rendering at dense scales.
- **Monospace, Data, Metrics & AI Logs:** `Fira Code`, monospace.
  - Tabular figures (`font-variant-numeric: tabular-nums`), exact character widths for match scores, agent timestamps, salary ranges, and streaming tokens.

| Level | Font Family | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Display / Hero` | Inter | `2.5rem - 4.5rem` | 800 (Bold) | 1.1 | `-0.03em` |
| `H1 Page Title` | Inter | `1.875rem` (30px) | 700 | 1.25 | `-0.02em` |
| `H2 Section` | Inter | `1.5rem` (24px) | 600 | 1.3 | `-0.015em` |
| `H3 Card Header`| Inter | `1.125rem` (18px) | 600 | 1.4 | `-0.01em` |
| `Body Regular` | Inter | `0.875rem` (14px) | 400 | 1.5 | `normal` |
| `Body Dense / Table`| Inter | `0.8125rem` (13px)| 400 / 500 | 1.4 | `normal` |
| `Mono Metrics / KPI`| Fira Code | `1.5rem - 2rem` | 600 | 1.2 | `-0.02em` |
| `Mono Badge / Code` | Fira Code | `0.75rem` (12px) | 500 | 1.3 | `normal` |

---

## 2. Core UI Component Specifications

### 2.1 Buttons (Strict Semantic Primitives)

```css
/* Base Button Styling (Tailwind equivalents) */
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer; /* Mandatory: UI/UX Pro rule */
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.btn-base:focus-visible {
  box-shadow: 0 0 0 2px #020617, 0 0 0 4px #6366F1;
}

/* Primary AI Action */
.btn-primary {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 12px rgba(99, 102, 241, 0.35);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.45);
}

/* High Conversion / Apply CTA */
.btn-cta {
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  color: #FFFFFF;
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.3);
}
.btn-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.45);
}

/* Secondary Ghost Glass */
.btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  color: #F8FAFC;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
```

### 2.2 Glass Cards & Bento Grid Cells

```css
.card-glass {
  background: rgba(11, 15, 25, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 0.75rem;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4);
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}

.card-glass:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 8px 32px -2px rgba(0, 0, 0, 0.5), 0 0 16px rgba(99, 102, 241, 0.15);
}
```

### 2.3 Status Indicators & Agent Pulse

```css
/* Autonomous Agent Pulse Indicator */
.agent-pulse-active {
  position: relative;
  display: inline-flex;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 9999px;
  background-color: #22C55E;
}
.agent-pulse-active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background-color: #22C55E;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
```

---

## 3. UI/UX Pro Max Decision Matrix

| Constraint / Trigger | Mandatory Implementation | Rationale |
| :--- | :--- | :--- |
| **Data Update Frequency** | Supabase Realtime + TanStack Query cache invalidation | Autonomous agents trigger updates asynchronously. Polling freezes UI; realtime event streams provide immediate visual certainty. |
| **Large Datasets (>50 items)** | Virtualized tables / lists via `@tanstack/react-virtual` | Prevents DOM bloating; maintains 60 FPS scrolling on 500+ job applications. |
| **Search & Discovery** | Multi-faceted filter drawer + Instant debounce (250ms) | Job seekers demand immediate response; avoid hidden or modal-nested filters. |
| **Salary / Compensation** | Highlighted Pill with currency + `font-mono` | Critical decision factor; must stand out in card previews without clicking. |
| **AI Generation Feedback** | Shimmer skeleton + Streaming text cursor | LLM generation (>1.5s) without visible progress creates high drop-off and panic clicks. |
| **Destructive Actions** | Two-step confirmation dialog with explicit key typing | Guardrails for cancelling active agent runs or deleting resumes. |

---

## 4. Anti-Patterns & Severity (HIGH ENFORCEMENT)

| Anti-Pattern | Severity | Why It Fails | Strict Alternative |
| :--- | :--- | :--- | :--- |
| **Emojis as Icons** (e.g. 💼, 🤖, ⚡) | **HIGH** | Inconsistent rendering across OS, breaks enterprise trust, fails screen readers. | **Strictly use SVG icons** via `lucide-react`. |
| **Missing `cursor-pointer`** | **HIGH** | Users doubt whether elements are interactive. | All buttons, links, clickable rows, and toggles must have `cursor-pointer`. |
| **No Feedback on Submit** | **HIGH** | User repeatedly clicks, creating duplicate actions or Stripe checkout sessions. | Button must switch to disabled loading spinner state within 50ms of click. |
| **Layout Shift (CLS > 0.05)** | **HIGH** | Unstable page jumps as images/data load. | Always reserve dimensional aspect ratios with `<Skeleton className="h-48" />`. |
| **Static Heavy Imports** | **HIGH** | 300KB+ bloated client bundles from Chart.js or GSAP on non-active pages. | Use `next/dynamic` with `ssr: false` for all heavy charts and animation canvases. |
| **Div-based Buttons** | **HIGH** | Destroys keyboard navigation and accessibility. | Use native `<button>` or Radix primitive with ARIA properties. |

---

## 5. UI/UX Pre-Delivery Quality Checklist

Before committing any frontend screen, verify every checkbox:

- [ ] **Icons:** Zero emojis used as icons; 100% SVG from `lucide-react`.
- [ ] **Affordance:** `cursor-pointer` applied on all interactive cards, badges, and buttons.
- [ ] **Transitions:** Hover transitions between 150ms and 250ms (never jerky 0ms, never sluggish >400ms).
- [ ] **Contrast:** Minimum 4.5:1 text-to-background contrast on all slate/white text combinations.
- [ ] **Keyboard Nav:** Complete tab traversal with visible high-contrast `focus-visible` rings.
- [ ] **Layout Stability:** Skeletons match exact final dimensions of cards, tables, and metric cards.
- [ ] **Reduced Motion:** Verified with `prefers-reduced-motion: reduce` media query.
- [ ] **Responsive Breakpoints:** Tested and pixel-perfect at 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px (Desktop).
