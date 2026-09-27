import { CreditCard, Download, CheckCircle, ArrowUpRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQuota } from '@/hooks/useQuota'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/types'

export function BillingPage() {
  const { data: currentUser } = useCurrentUser()
  const {
    subscription,
    dailyUsed,
    dailyCap,
    dailyPercentage,
    monthlyUsed,
    monthlyQuota,
    monthlyPercentage,
  } = useQuota(currentUser?.id)

  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  const currentTier: SubscriptionTier = (subscription?.plan_tier as SubscriptionTier) || 'free_trial'
  const tierConfig = SUBSCRIPTION_TIERS[currentTier] || SUBSCRIPTION_TIERS.free_trial

  const tiers = [
    { id: 'starter', name: 'Starter', price: 9, quota: 50, daily: 5, features: ['2 platforms', 'Review + Auto modes', '6-hour scans', 'Email support'], popular: false },
    { id: 'pro', name: 'Pro', price: 29, quota: 250, daily: 15, features: ['All platforms', 'Full auto-submit', 'Hourly scans', 'Priority queue', 'Discord support'], popular: true },
    { id: 'power', name: 'Power', price: 79, quota: 'Unlimited', daily: 50, features: ['Dedicated worker pool', 'Email status parsing', 'Instant discovery', '1-on-1 onboarding'], popular: false },
  ]

  const handleCheckout = async (tierId: string) => {
    if (!currentUser?.id) return
    setLoadingTier(tierId)
    try {
      const res = await fetch('http://localhost:4000/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          userId: currentUser.id,
          successUrl: `${window.location.origin}/billing?upgraded=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Stripe checkout error:', err)
    } finally {
      setLoadingTier(null)
    }
  }

  const handleOpenPortal = async () => {
    if (!subscription?.stripe_customer_id) return
    setIsOpeningPortal(true)
    try {
      const res = await fetch('http://localhost:4000/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: subscription.stripe_customer_id,
        }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Customer portal error:', err)
    } finally {
      setIsOpeningPortal(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Billing & Subscription</h1>
        <p className="text-text-secondary text-sm">Manage your plan, view real-time quota usage, and access invoices</p>
      </div>

      {/* Current Plan */}
      <div className="card-glass p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className={cn('px-3 py-1 rounded-full text-sm font-bold', currentTier === 'pro' || currentTier === 'power' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/5 text-text-secondary')}>
                {currentTier.replace('_', ' ').toUpperCase()}
              </span>
              {currentTier === 'pro' && <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-accent-primary to-accent-ai text-xs font-bold text-text-inverse">Popular</span>}
            </div>
            <p className="text-text-secondary text-sm mt-1">
              Status: <span className="text-text-primary font-medium capitalize">{subscription?.status || 'Active'}</span> · 
              Monthly Quota: <span className="text-accent-secondary font-mono">{tierConfig.monthly_quota} applications</span>
            </p>
          </div>
          {subscription?.stripe_customer_id ? (
            <button
              onClick={handleOpenPortal}
              disabled={isOpeningPortal}
              className="btn-secondary px-4 py-2 flex items-center gap-2"
            >
              {isOpeningPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Manage Stripe Billing
            </button>
          ) : null}
        </div>

        {/* Usage Meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Monthly Usage</span>
              <span className="text-sm font-mono tabular-nums text-text-primary">{monthlyUsed} / {monthlyQuota}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-ai transition-all duration-500"
                style={{ width: `${monthlyPercentage}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{monthlyPercentage}% used this billing cycle</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Daily Cap Today</span>
              <span className="text-sm font-mono tabular-nums text-text-primary">{dailyUsed} / {dailyCap}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-warning to-accent-cta transition-all duration-500"
                style={{ width: `${dailyPercentage}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">Resets at midnight UTC</p>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {currentTier !== 'power' && (
        <div className="card-glass p-6 border border-accent-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpRight className="w-5 h-5 text-accent-primary" />
            <h3 className="font-semibold text-text-primary">Upgrade to Pro or Power</h3>
          </div>
          <p className="text-text-secondary mb-4 text-sm">Expand your application volume, unlock multi-platform submission, and run high-frequency autonomous scans.</p>
        </div>
      )}

      {/* Plans Comparison */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Select Plan</h2>
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
              <button
                onClick={() => handleCheckout(tier.id)}
                disabled={loadingTier === tier.id || tier.id === currentTier}
                className={cn('w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2', tier.popular ? 'btn-cta' : 'btn-secondary')}
              >
                {loadingTier === tier.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {tier.id === currentTier ? 'Current Active Plan' : `Upgrade to ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}