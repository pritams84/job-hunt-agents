import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Subscription, SUBSCRIPTION_TIERS } from '../types'

export function useQuota(userId?: string) {
  const queryClient = useQueryClient()

  const {
    data: subscription,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Subscription | null>({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error: err } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (err) throw new Error(err.message)

      if (!data) {
        // Return default free trial fallback
        return {
          id: 'fallback-trial',
          user_id: userId,
          stripe_customer_id: '',
          stripe_subscription_id: null,
          plan_tier: 'free_trial',
          status: 'trialing',
          monthly_quota: SUBSCRIPTION_TIERS.free_trial.monthly_quota,
          monthly_applications_used: 0,
          daily_cap: SUBSCRIPTION_TIERS.free_trial.daily_cap,
          daily_applications_used: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 7 * 86400000).toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        } as Subscription
      }

      return data as Subscription
    },
    enabled: !!userId,
  })

  // Realtime subscription changes
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`realtime:subscription:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['subscription', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  const dailyUsed = subscription?.daily_applications_used ?? 0
  const dailyCap = subscription?.daily_cap ?? 3
  const dailyRemaining = Math.max(0, dailyCap - dailyUsed)
  const dailyPercentage = Math.min(100, Math.round((dailyUsed / dailyCap) * 100))

  const monthlyUsed = subscription?.monthly_applications_used ?? 0
  const monthlyQuota = subscription?.monthly_quota ?? 5
  const monthlyRemaining = Math.max(0, monthlyQuota - monthlyUsed)
  const monthlyPercentage = Math.min(100, Math.round((monthlyUsed / monthlyQuota) * 100))

  const isDailyCapReached = dailyUsed >= dailyCap
  const isMonthlyQuotaReached = monthlyUsed >= monthlyQuota

  return {
    subscription,
    isLoading,
    isError,
    error,
    refetch,
    dailyUsed,
    dailyCap,
    dailyRemaining,
    dailyPercentage,
    monthlyUsed,
    monthlyQuota,
    monthlyRemaining,
    monthlyPercentage,
    isDailyCapReached,
    isMonthlyQuotaReached,
  }
}
