import { useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CurrentUserProfile {
  id: string // Supabase UUID (primary key in public.users)
  clerk_id: string
  email: string
  first_name: string | null
  last_name: string | null
  status: 'active' | 'suspended' | 'deleted'
}

/**
 * Resolves the authenticated Clerk user to their internal Supabase user UUID.
 * Cached via TanStack Query to minimize redundant database lookups.
 */
export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser()

  return useQuery<CurrentUserProfile | null>({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('users')
        .select('id, clerk_id, email, first_name, last_name, status')
        .eq('clerk_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching Supabase user profile by clerk_id:', error)
        throw new Error(error.message)
      }

      return data as CurrentUserProfile | null
    },
    enabled: isLoaded && isSignedIn && !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })
}
