# Landing Page Specification: JobHunt AI

> **PROJECT:** JobHunt AI  
> **Page Type:** High-Conversion AI SaaS Landing Page  
> **Source of Truth:** Overrides `context/design-system/jobhunt-ai/MASTER.md` for the public root (`/`) route.

---

## 1. Page Layout & Narrative Arc

- **Pattern:** Bento Grid Showcase + Interactive Product Demo + GSAP Scroll-Linked Timeline.
- **Conversion Strategy:** "Show, Don't Tell" — Live interactive simulation in the hero before sign-up.

### Section Blueprint
1. **Nav Header:** Sticky glass nav with Logo, Product, Features, Pricing, Testimonials, "Sign In" (Clerk) and "Start Autopilot Free" CTA.
2. **Hero Section:**
   - Badge: `✨ Introducing Autonomous Job Hunting 2.0` (Pulsing glass pill).
   - Headline: *"Your Autonomous AI Career Agent. While You Sleep, It Hunts, Matches, and Applies."*
   - Subhead: High-conversion copy with clear value proposition and Clerk instant sign-up button.
   - Interactive Live Demo Card: User types a job title; visual simulation runs ATS resume tailoring in 1.5 seconds.
3. **Social Proof & Live Stats Ticker:**
   - 14,000+ Applications Automated | 11 Days Avg. to First Interview | 94.2% ATS Pass Rate.
4. **Bento Grid Showcase (6 Feature Cards):**
   - Card 1 (Large 2x2): Autonomous Scraper & Board Aggregator (LinkedIn, Indeed, Greenhouse, Lever).
   - Card 2 (1x2): Precision Match Engine (Vector embedding match score).
   - Card 3 (1x2): Dynamic Resume Tailor (Tailored PDF generation per job).
   - Card 4 (1x1): Human-in-the-Loop Safeguards (Review before submit toggles).
   - Card 5 (1x1): Ghost Application Blocker (Flags outdated listings).
   - Card 6 (2x1): Real-time Status Tracker (Supabase Realtime notifications).
5. **How It Works (Pinned GSAP 3-Step Horizontal Scrub):**
   - Step 1: Upload Resume & Set Preferences (Salary, Remote, Roles).
   - Step 2: AI Agent Discovers & Customizes Applications 24/7.
   - Step 3: Interviews Land Directly on Your Calendar.
6. **Pricing Matrix (Stripe Integration):**
   - Toggle: Monthly vs Annual (Save 20% badge).
   - 3 Tiers: Starter ($0 Free), Pro ($29/mo), Autopilot ($79/mo).
7. **FAQ Accordion & Final Sticky Footer CTA.**

---

## 2. Animation & Motion Architecture (GSAP + Tailwind)

### 2.1 Hero Sequence (GSAP Timeline)
```typescript
// Registered in lib/gsap.ts, executed in HeroSection.tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('[data-gsap="hero-badge"]', { opacity: 0, y: -20, duration: 0.6 })
      .from('[data-gsap="hero-headline"]', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3')
      .from('[data-gsap="hero-subtext"]', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
      .from('[data-gsap="hero-cta"]', { opacity: 0, scale: 0.95, duration: 0.5 }, '-=0.3')
      .from('[data-gsap="hero-demo-card"]', { opacity: 0, y: 50, duration: 1.0 }, '-=0.4');
  }, heroRef);

  return () => ctx.revert();
}, []);
```

### 2.2 Bento Card Hover Physics
- Tailwind classes: `transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer`.
- Subtle radial cursor spotlight effect using mouse position state.

---

## 3. Pre-Delivery Checklist for Landing Page

- [ ] Above-the-fold hero renders LCP < 1.2s on mobile 4G.
- [ ] Next/Image used for all logos and graphics with explicit width/height and `priority` on hero.
- [ ] GSAP ScrollTrigger properly registers cleanup inside `ctx.revert()`.
- [ ] Clerk Auth redirect buttons preserve user UTM tags in metadata.
- [ ] Stripe checkout buttons trigger API route `/api/billing/create-checkout` with instant visual loading state.
