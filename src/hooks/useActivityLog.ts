import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ActivityLog, AgentEventType } from '@/types'

export interface FormattedActivity {
  id: string
  time: string
  created_at: string
  type: AgentEventType
  message: string
  platform: string
  status: 'success' | 'warning' | 'error' | 'info'
  payload: Record<string, unknown>
}

export function formatActivityEntry(log: ActivityLog): FormattedActivity {
  const payload = log.payload_json || {}
  const date = new Date(log.created_at)
  const time = !isNaN(date.getTime())
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : 'Just now'

  let message = (payload.message as string) || (payload.summary as string) || ''
  const platform = (payload.platform as string) || (payload.source as string) || 'System'
  let status: 'success' | 'warning' | 'error' | 'info' = 'info'

  switch (log.event_type) {
    case 'submitted':
      status = 'success'
      if (!message) message = `Submitted application${payload.company ? ` to ${payload.company}` : ''}`
      break
    case 'matched':
      status = 'info'
      if (!message) message = `Match scored: ${payload.score ?? 0}%${payload.title ? ` for ${payload.title}` : ''}`
      break
    case 'searched':
      status = 'info'
      if (!message) message = `Discovered ${payload.count ?? 0} new job listings`
      break
    case 'generated_content':
      status = 'info'
      if (!message) message = `Tailored resume and cover letter${payload.company ? ` for ${payload.company}` : ''}`
      break
    case 'status_changed':
      status = payload.new_status === 'rejected' ? 'warning' : 'success'
      if (!message) message = `Status updated to ${payload.new_status || 'updated'}`
      break
    case 'captcha_detected':
      status = 'warning'
      if (!message) message = 'CAPTCHA challenge detected — Human review required'
      break
    case 'quota_reached':
      status = 'warning'
      if (!message) message = 'Daily application limit reached'
      break
    case 'error':
      status = 'error'
      if (!message) message = (payload.error as string) || 'Agent execution encountered an error'
      break
    case 'skipped':
      status = 'warning'
      if (!message) message = `Job skipped: ${payload.reason || 'Criteria mismatch'}`
      break
    case 'filled_field':
      status = 'info'
      if (!message) message = `Auto-filled form field: ${payload.field || 'input'}`
      break
    default:
      if (!message) message = `Event ${log.event_type} recorded`
  }

  return {
    id: log.id,
    time,
    created_at: log.created_at,
    type: log.event_type,
    message,
    platform,
    status,
    payload,
  }
}

export function useActivityLog(userId?: string, limit: number = 50) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error: fetchErr } = await query

      if (fetchErr) {
        throw fetchErr
      }

      setActivities(data || [])
    } catch (err: any) {
      console.error('Error loading activity logs:', err)
      setError(err?.message || 'Failed to load activity logs')
    } finally {
      setIsLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    fetchActivities()

    const channelName = `public:activity_log:${userId || 'all'}:${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          const newRow = payload.new as ActivityLog
          if (!userId || newRow.user_id === userId) {
            setActivities((prev) => [newRow, ...prev.filter((item) => item.id !== newRow.id)])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchActivities])

  const logActivity = async (params: {
    event_type: AgentEventType
    application_id?: string | null
    payload_json: Record<string, unknown>
  }) => {
    try {
      const { error: insertErr } = await supabase.from('activity_log').insert({
        user_id: userId || null,
        application_id: params.application_id || null,
        event_type: params.event_type,
        payload_json: params.payload_json,
      })

      if (insertErr) {
        throw insertErr
      }
    } catch (err) {
      console.error('Failed to insert activity log:', err)
    }
  }

  const formattedActivities = activities.map(formatActivityEntry)

  return {
    activities,
    formattedActivities,
    isLoading,
    error,
    refetch: fetchActivities,
    logActivity,
  }
}
