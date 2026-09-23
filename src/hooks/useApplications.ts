import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Application, ApplicationStatus } from '../types'

export interface ApplicationWithJob extends Application {
  job?: {
    id: string
    title: string
    company: string
    location: string | null
    is_remote: boolean
    salary_min: number | null
    salary_max: number | null
    url: string
    source_platform: string
  }
}

export function useApplications(userId?: string) {
  const queryClient = useQueryClient()

  // 1. Fetch applications
  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApplicationWithJob[]>({
    queryKey: ['applications', userId],
    queryFn: async () => {
      let query = supabase
        .from('applications')
        .select(`
          *,
          job:job_listings(
            id,
            title,
            company,
            location,
            is_remote,
            salary_min,
            salary_max,
            url,
            source_platform
          )
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error: err } = await query

      if (err) {
        throw new Error(err.message)
      }

      return (data as ApplicationWithJob[]) || []
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  // 2. Supabase Realtime Subscription for Live Updates
  useEffect(() => {
    const channel = supabase
      .channel('realtime:applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['applications'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // 3. Mutation: Update status (e.g. dragging across Kanban)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      newStatus,
    }: {
      applicationId: string
      newStatus: ApplicationStatus
    }) => {
      const { data, error: err } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)
        .select()
        .single()

      if (err) throw new Error(err.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  return {
    applications,
    isLoading,
    isError,
    error,
    refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  }
}
