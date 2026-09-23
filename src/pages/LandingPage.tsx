import { cn } from '@/lib/utils'
import { SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react'
import { ArrowRight, CheckCircle, Zap, Shield, Brain, BarChart2, Users, Globe, Rocket } from 'lucide-react'

const features = [
  {
    title: 'Autonomous Job Discovery',
    description: 'Agents continuously scan LinkedIn, Greenhouse, Lever, Workday, and 10+ platforms for relevant roles.',
    icon: Globe,
    size: 'large',
  },
  {
    title: 'Precision Vector Matching',
    description: 'pgvector semantic similarity + LLM reasoning produces 0-100 match scores with transparent rationale.',
    icon: Brain,
    size: 'normal',
  },
  {
    title: 'Dynamic Resume Tailoring',
    description: 'Adversarial agent pair generates tailored resumes & cover letters, verified against your master profile.',
    icon: Zap,
    size: 'normal',
  },
  {
    title: 'Human-in-the-Loop Safeguards',
    description: 'Review mode by default. Auto-submit only for ≥85% matches. CAPTCHA detection pauses instantly.',
    icon: Shield,
    size: 'normal',
  },
  {
    title: 'Real-time Status Tracking',
    description: 'Supabase Realtime pushes interview invites, rejections, and offers directly to your Kanban board.',
    icon: BarChart2,
    size: 'normal',
  },
  {
    title: 'Audit Trail & Proof',
    description: 'Every submission captures confirmation screenshots, filled fields, and immutable activity logs.',
    icon: Users,
    size: 'normal',
  },
]

const tiers = [
  {
    name: 'Free Trial',
    price: 0,
    period: '7 days',
    quota: '5 applications total',
    features: ['1 platform', 'Review mode only', 'Daily scan', 'Community support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Starter',
    price: 29,
    period: '/month',
    quota: '50 applications/month',
    features: ['2 platforms', 'Review + Auto modes', '6-hour scans', 'Email support'],
    cta: 'Upgrade to Starter',
    popular: false,
  },
  {
    name: 'Pro',
    price: 79,
    period: '/month',
    quota: '250 applications/month',
    features: ['All platforms', 'Full auto-submit', 'Hourly scans', 'Priority queue', 'Discord support'],
    cta: 'Get Pro Access',
    popular: true,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-accent-primary mb-6 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
              Introducing Autonomous Job Hunting 2.0
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-primary leading-tight mb-6">
              Your Autonomous AI{' '}
              <span className="text-accent-primary">Career Agent</span>
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              While you sleep, it hunts, matches, tailors resumes, and applies to relevant software jobs 24/7.
              Built on Clerk, Supabase, Stripe & NVIDIA Nemotron 70B.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-cta text-lg px-8 py-3">
                    Start Autonomous Job Hunt
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </SignInButton>
              </SignedOut>
              <button className="btn-secondary text-lg px-8 py-3">Watch Demo</button>
            </div>
            
            {/* Live Demo Card */}
            <div className="card-glass p-6 max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
                <span className="w-2 h-2 rounded-full bg-accent-cta animate-pulse" />
                Live ATS Simulation
              </div>
              <input
                type="text"
                placeholder="Enter target role (e.g., Senior Frontend Engineer)"
                className="glass-input mb-4"
              />
              <button className="btn-primary w-full py-3">Run Simulation</button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-text-primary font-mono tabular-nums">14,000+</div>
              <div className="text-text-secondary mt-1">Applications Automated</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-text-primary font-mono tabular-nums">11</div>
              <div className="text-text-secondary mt-1">Days Avg. to First Interview</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-text-primary font-mono tabular-nums">94.2%</div>
              <div className="text-text-secondary mt-1">ATS Pass Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className={cn(
                  'card-glass p-6 group cursor-pointer',
                  feature.size === 'large' && 'lg:col-span-2 lg:row-span-2'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-ai/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 lg:py-28 bg-bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-text-secondary mt-2">Choose the plan that fits your search intensity</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  'card-glass p-6 flex flex-col relative',
                  tier.popular && 'border-2 border-accent-primary/50 shadow-[0_0_32px_rgba(108,99,255,0.15)]'
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-accent-primary to-accent-ai text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold font-mono text-text-primary">${tier.price}</span>
                    <span className="text-text-secondary">{tier.period}</span>
                  </div>
                  <p className="text-text-secondary text-sm mt-1">{tier.quota}</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-accent-cta flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className={cn('w-full py-3 rounded-lg font-medium transition-all', tier.popular ? 'btn-cta' : 'btn-secondary')}>
                      {tier.cta}
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-muted text-sm">
          <p>JobHunt AI — Autonomous Career Automation Platform</p>
          <p className="mt-2">Built with React, Tailwind, Framer Motion, GSAP, Clerk, Supabase, Stripe & NVIDIA NIM</p>
        </div>
      </footer>
    </div>
  )
}