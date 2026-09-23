# Job Discovery & Matches — Page Specification

> **PROJECT:** JobHunt AI  
> **Page Type:** AI Match Feed & Multi-Facet Job Discovery  
> **Source of Truth:** Overrides `context/design-system/jobhunt-ai/MASTER.md` for the `/dashboard/jobs` route.

---

## 1. Page Layout & Search Architecture

- **Layout:** Master-Detail Split Screen or Grid View:
  - Left Panel (1/3 or 380px): Filter drawer & listing feed cards.
  - Right Panel (2/3 or flex-1): Sticky job preview with AI Match breakdown, full description, and 1-Click "Apply with Agent" action.
- **Search & Filter Rules (UI/UX Pro Max):**
  - **Instant Search Bar:** Debounced input (250ms), searching titles, companies, and skills simultaneously.
  - **Salary Range Slider:** Minimum salary floor with dynamic currency badge (`$120k+`, `$150k+`).
  - **Remote / Location Toggle:** Pills for `Remote Only`, `Hybrid`, `On-site`.
  - **Match Score Threshold:** Quick filter buttons: `All Matches`, `High Match (≥80%)`, `Perfect Fit (≥90%)`.

---

## 2. Match Score Visual Breakdown (`MatchScoreBadge.tsx`)

Every job card displays a composite Match Score breakdown:
- **Badge:** Ring progress meter with color scaling:
  - `90% - 100%`: Emerald Green (`#22C55E`) + subtle glow
  - `75% - 89%`: Blue (`#3B82F6`)
  - `60% - 74%`: Amber (`#F59E0B`)
  - `<60%`: Slate Gray (`#64748B`)
- **Score Breakdown Popover:**
  - **Skill Overlap (40% weight):** Matching tags highlighted in green, missing tags highlighted in gray.
  - **Experience Alignment (30% weight):** Seniority level check (e.g. "Requires 5+ yrs, profile has 6 yrs").
  - **Semantic Context (30% weight):** LLM summary: *"High fit for React & Next.js performance roles, but requires GraphQL which is not in your primary skill list."*

---

## 3. 1-Click Autonomous Action Flow

- **"Apply with Agent" Button:**
  - Clicking triggers an instant inline state transition: `[1-Click Apply] -> [Agent Tailoring Resume...] -> [Applied ✓]`.
  - If the job has required custom questions (e.g. "Are you legally authorized to work in the US?"), a quick glass modal pops up pre-filled with saved user preferences, needing only a 1-tap confirmation.

---

## 4. Pre-Delivery Checklist for Jobs Page

- [ ] Sticky right preview panel maintains separate scroll from left feed.
- [ ] Active job card has distinct glowing border: `border-indigo-500/50 bg-indigo-500/5`.
- [ ] Skeleton feed shows 5 placeholder cards with animated shimmer while query executes.
- [ ] Empty search results provide clear reset suggestions: *"No jobs found with match ≥ 90%. Try lowering the threshold or adjusting keywords."*
