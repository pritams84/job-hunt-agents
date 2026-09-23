import { CreditCard, Download, CheckCircle, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUBSCRIPTION_TIERS } from '@/types'

export function BillingPage() {
  const currentTier = 'pro' as const
  const tierConfig = SUBSCRIPTION_TIERS[currentTier]
  const used = 34
  const dailyUsed = 6

  const tiers = [
    { id: 'starter', name: 'Starter', price: 29, quota: 50, daily: 5, features: ['2 platforms', 'Review + Auto modes', '6-hour scans', 'Email support'], popular: false },
    { id: 'pro', name: 'Pro', price: 79, quota: 250, daily: 15, features: ['All platforms', 'Full auto-submit', 'Hourly scans', 'Priority queue', 'Discord support'], popular: true },
    { id: 'power', name: 'Power', price: 149, quota: 'Unlimited', daily: 50, features: ['Dedicated worker pool', 'Email status parsing', 'Instant discovery', '1-on-1 onboarding'], popular: false },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Billing & Subscription</h1>
        <p className="text-text-secondary text-sm">Manage your plan, view usage, and access invoices</p>
      </div>

      {/* Current Plan */}
      <div className="card-glass p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className={cn('px-3 py-1 rounded-full text-sm font-bold', currentTier === 'pro' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/5 text-text-secondary')}>
                {currentTier.toUpperCase()}
              </span>
              {currentTier === 'pro' && <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-accent-primary to-accent-ai text-xs font-bold text-text-inverse">Popular</span>}
            </div>
            <p className="text-text-secondary text-sm mt-1">
              ${tierConfig.monthly_quota === 250 ? 79 : tierConfig.monthly_quota === 50 ? 29 : 149} / month · 
              Next billing: October 23, 2026 · 
              <button className="text-accent-primary hover:underline">Cancel anytime</button>
            </p>
          </div>
          <button className="btn-secondary px-4 py-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Manage Plan
          </button>
        </div>

        {/* Usage Meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Monthly Usage</span>
              <span className="text-sm font-mono tabular-nums text-text-primary">{used} / {tierConfig.monthly_quota}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-ai transition-all duration-500"
                style={{ width: `${(used / tierConfig.monthly_quota) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{(used / tierConfig.monthly_quota * 100).toFixed(0)}% used this period</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Daily Cap Today</span>
              <span className="text-sm font-mono tabular-nums text-text-primary">{dailyUsed} / {tierConfig.daily_cap}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-warning to-accent-cta transition-all duration-500"
                style={{ width: `${(dailyUsed / tierConfig.daily_cap) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">Resets at midnight UTC</p>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="card-glass p-6 border border-accent-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <ArrowUpRight className="w-5 h-5 text-accent-primary" />
          <h3 className="font-semibold text-text-primary">Upgrade to Power for unlimited applications</h3>
        </div>
        <p className="text-text-secondary mb-4">Remove all limits, get dedicated infrastructure, and priority support.</p>
        <button className="btn-cta px-6 py-2">View Plans & Upgrade</button>
      </div>

      {/* Plans Comparison */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Compare Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'card-glass p-6 relative',
                tier.popular && 'border-2 border-accent-primary/50'
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-accent-primary to-accent-ai text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="font-semibold text-text-primary mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold font-mono text-text-primary">${tier.price}</span>
                <span className="text-text-secondary">/month</span>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                {typeof tier.quota === 'number' ? `${tier.quota} apps/month` : tier.quota}
              </p>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-accent-cta flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={cn('w-full py-2 rounded-lg font-medium', tier.popular ? 'btn-cta' : 'btn-secondary')}>
                {tier.id === currentTier ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div className="card-glass overflow-hidden">
        <h3 className="px-6 py-4 border-b border-white/5 font-semibold text-text-primary">Invoice History</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Date', 'Amount', 'Status', ''].map(col => (
                <th key={col} className="px-6 py-3 text-left text-sm font-medium text-text-secondary">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date: '2026-09-23', amount: '$79.00', status: 'paid' },
              { date: '2026-08-23', amount: '$79.00', status: 'paid' },
              { date: '2026-07-23', amount: '$79.00', status: 'paid' },
              { date: '2026-06-23', amount: '$29.00', status: 'paid' },
            ].map((inv, idx) => (
              <tr key={idx} className="border-b border-white/5">
                <td className="px-6 py-3 text-text-secondary">{inv.date}</td>
                <td className="px-6 py-3 font-mono tabular-nums text-text-primary">{inv.amount}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent-cta/20 text-accent-cta">Paid</span>
                </td>
                <td className="px-6 py-3">
                  <button className="btn-ghost p-1"><Download className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}