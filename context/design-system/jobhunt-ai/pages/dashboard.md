# Dashboard Command Center — Page Specification

> **PROJECT:** JobHunt AI  
> **Page Type:** Real-Time AI Autonomous Agent Command Center & Data-Dense Dashboard  
> **Source of Truth:** Overrides `context/design-system/jobhunt-ai/MASTER.md` for the `/dashboard` route.

---

## 1. Page Layout & Grid Architecture

- **Viewport:** Desktop-first 100vw bounded container, `max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6`.
- **Layout Model:** 12-Column Responsive Bento Grid.
  - **Row 1 (Top Hero):** Agent Control Bar (Spans 12 cols) — Live status pulse, quota meter, emergency pause button.
  - **Row 2 (KPIs):** 4 Stat Bento Cards (Spans 3 cols each on desktop, 6 on tablet, 12 on mobile).
  - **Row 3 (Core Analytics & Feed):** 
    - Left (8 cols): Applications Funnel & Daily Activity Chart.
    - Right (4 cols): Real-Time Agent Stream Console (with pause, filter, auto-scroll).
  - **Row 4 (Pending Approvals):** High-priority jobs queue awaiting human review (Spans 12 cols).

---

## 2. Component Specifications

### 2.1 Agent Control Bar (`AgentCommandBar.tsx`)
- **Status Badge:** High-visibility pulsing badge (`#22C55E` when running, `#F59E0B` when paused, `#EF4444` when error).
- **Quota Progress Pill:** Dual radial gauge or linear bar displaying `Applications Used: 34 / 50` today (resets at midnight UTC).
- **Controls:**
  - `Toggle Agent Active/Pause` (Instant action via Supabase mutation + optimistic state update).
  - `Autonomous Mode Selector` (Conservative: matches ≥85% auto-apply vs. Aggressive: matches ≥70% auto-apply).
  - `Emergency Stop Button`: Destructive red ghost button with tooltip warning.

### 2.2 Bento Stat Cards (`KpiCard.tsx`)
- **Typography:** Value rendered in `font-mono` (`Fira Code`) with `tabular-nums` at `text-3xl font-bold text-white`.
- **Motion:** On route mount, values animate from `0` to target using GSAP number ticker (`duration: 1.2s, ease: "power2.out"`).
- **Metrics Tracked:**
  1. **Jobs Discovered Today** (e.g. `142` | `+18% from yesterday` badge)
  2. **Auto-Applications Sent** (e.g. `28` | Daily cap indicator)
  3. **Interview Invites** (e.g. `4` | Conversion rate `14.2%`)
  4. **Active Agent Hours** (e.g. `6.4 hrs` | Pulse animation)

### 2.3 Real-Time Agent Terminal Stream (`AgentStreamConsole.tsx`)
- **Style:** OLED Dark terminal aesthetic (`#020617` background with 1px `border-white/10`).
- **Font:** `font-mono text-xs leading-5` (`Fira Code`).
- **Features:**
  - Auto-scroll to bottom on incoming event via Supabase Realtime channel `agent_logs:{userId}`.
  - Auto-scroll pauses automatically if user scrolls up or hovers over the console.
  - Category tags: `[DISCOVERY]` (Blue), `[MATCH_SCORING]` (Purple), `[RESUME_TAILOR]` (Indigo), `[APPLICATION_SUBMIT]` (Green), `[RATE_LIMIT]` (Yellow).
  - Streaming cursor blinking at 1Hz (`_`).

### 2.4 Application Pipeline Funnel (`PipelineFunnel.tsx`)
- **Library:** Code-split with `next/dynamic` (`ssr: false`) to keep initial bundle < 120KB.
- **Stages:** Discovered (`#64748B`) → Scored (`#3B82F6`) → Tailored (`#8B5CF6`) → Applied (`#10B981`) → Screening (`#F59E0B`) → Interview (`#EC4899`).
- **Interaction:** Hovering any stage highlights corresponding applications in the table below.

---

## 3. Performance & Layout Shift Prevention

```tsx
// Mandatory Skeleton Aspect Ratios for Zero-CLS
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full rounded-xl" /> {/* Agent Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-8 h-96 rounded-xl" />
        <Skeleton className="lg:col-span-4 h-96 rounded-xl" />
      </div>
    </div>
  );
}
```

---

## 4. Pre-Delivery Verification Checklist for Dashboard

- [ ] Stat card counters use `font-mono tabular-nums` to eliminate number jitter during GSAP tick.
- [ ] Terminal stream maintains max 200 items in React state to prevent memory leaks during multi-hour sessions.
- [ ] Emergency stop requires 1-click execution with immediate UI freeze and rollback safety.
- [ ] All interactive cards scale with `hover:scale-[1.01]` and have `cursor-pointer`.
- [ ] Zero layout shift verified during data hydration.
