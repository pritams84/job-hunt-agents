import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './useCurrentUser'
import { Profile, CandidateProfile, JobPreferences, StandardAnswers, UserRules } from '@/types'

export function useProfile() {
  const queryClient = useQueryClient()
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  const userId = currentUser?.id

  // 1. Fetch Profile from Supabase
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError,
    error,
    refetch,
  } = useQuery<Profile | null>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (err) {
        console.error('Error loading user profile:', err)
        throw new Error(err.message)
      }

      return data as Profile | null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // 2. Mutation: Upsert / Save Profile to Supabase
  const saveProfileMutation = useMutation({
    mutationFn: async (payload: {
      parsed_json?: Partial<CandidateProfile>
      preferences?: Partial<JobPreferences>
      standard_answers?: Partial<StandardAnswers>
      rules?: Partial<UserRules>
      resume_url?: string | null
    }) => {
      if (!userId) throw new Error('Cannot save profile: user is not authenticated.')

      const existingProfile = profile

      const updatedParsedJson: CandidateProfile = {
        personal: {
          full_name: `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || 'Candidate',
          email: currentUser?.email || '',
          phone: '',
          location: { city: '', state: '', country: '', timezone: '' },
          links: {},
          ...(existingProfile?.parsed_json?.personal || {}),
          ...(payload.parsed_json?.personal || {}),
        },
        summary: payload.parsed_json?.summary ?? existingProfile?.parsed_json?.summary ?? '',
        experience: payload.parsed_json?.experience ?? existingProfile?.parsed_json?.experience ?? [],
        education: payload.parsed_json?.education ?? existingProfile?.parsed_json?.education ?? [],
        skills: {
          primary: payload.parsed_json?.skills?.primary ?? existingProfile?.parsed_json?.skills?.primary ?? [],
          secondary: payload.parsed_json?.skills?.secondary ?? existingProfile?.parsed_json?.skills?.secondary ?? [],
          tools_and_platforms: payload.parsed_json?.skills?.tools_and_platforms ?? existingProfile?.parsed_json?.skills?.tools_and_platforms ?? [],
        },
        certifications: payload.parsed_json?.certifications ?? existingProfile?.parsed_json?.certifications ?? [],
        work_authorization: {
          us_authorized: payload.parsed_json?.work_authorization?.us_authorized ?? existingProfile?.parsed_json?.work_authorization?.us_authorized ?? true,
          requires_sponsorship: payload.parsed_json?.work_authorization?.requires_sponsorship ?? existingProfile?.parsed_json?.work_authorization?.requires_sponsorship ?? false,
          clearance_level: payload.parsed_json?.work_authorization?.clearance_level ?? existingProfile?.parsed_json?.work_authorization?.clearance_level,
        },
      }

      const updatedPreferences: JobPreferences = {
        target_roles: payload.preferences?.target_roles ?? existingProfile?.preferences?.target_roles ?? ['AI Engineer', 'Software Engineer'],
        target_seniority: payload.preferences?.target_seniority ?? existingProfile?.preferences?.target_seniority ?? ['Senior', 'Mid-Level'],
        locations: payload.preferences?.locations ?? existingProfile?.preferences?.locations ?? ['Remote'],
        remote_ok: payload.preferences?.remote_ok ?? existingProfile?.preferences?.remote_ok ?? true,
        salary_min: payload.preferences?.salary_min ?? existingProfile?.preferences?.salary_min ?? 120000,
        salary_currency: payload.preferences?.salary_currency ?? existingProfile?.preferences?.salary_currency ?? 'USD',
        visa_sponsorship_needed: payload.preferences?.visa_sponsorship_needed ?? existingProfile?.preferences?.visa_sponsorship_needed ?? false,
      }

      const updatedAnswers: StandardAnswers = {
        work_authorization: payload.standard_answers?.work_authorization ?? existingProfile?.standard_answers?.work_authorization ?? 'Authorized',
        notice_period_weeks: payload.standard_answers?.notice_period_weeks ?? existingProfile?.standard_answers?.notice_period_weeks ?? 2,
        linkedin_url: payload.standard_answers?.linkedin_url ?? existingProfile?.standard_answers?.linkedin_url ?? '',
        github_url: payload.standard_answers?.github_url ?? existingProfile?.standard_answers?.github_url ?? '',
        portfolio_url: payload.standard_answers?.portfolio_url ?? existingProfile?.standard_answers?.portfolio_url ?? '',
        salary_expectation: payload.standard_answers?.salary_expectation ?? existingProfile?.standard_answers?.salary_expectation ?? 140000,
        willing_to_relocate: payload.standard_answers?.willing_to_relocate ?? existingProfile?.standard_answers?.willing_to_relocate ?? false,
        custom_answers: payload.standard_answers?.custom_answers ?? existingProfile?.standard_answers?.custom_answers ?? {},
      }

      const updatedRules: UserRules = {
        blacklist_companies: payload.rules?.blacklist_companies ?? existingProfile?.rules?.blacklist_companies ?? [],
        autonomy_mode: payload.rules?.autonomy_mode ?? existingProfile?.rules?.autonomy_mode ?? 'review',
        min_match_score: payload.rules?.min_match_score ?? existingProfile?.rules?.min_match_score ?? 80,
        max_applications_per_day: payload.rules?.max_applications_per_day ?? existingProfile?.rules?.max_applications_per_day ?? 10,
      }

      const { data, error: upsertErr } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            resume_url: payload.resume_url ?? existingProfile?.resume_url ?? null,
            parsed_json: updatedParsedJson,
            preferences: updatedPreferences,
            standard_answers: updatedAnswers,
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select('*')
        .single()

      if (upsertErr) {
        console.error('Failed to save profile to Supabase:', upsertErr)
        throw new Error(upsertErr.message)
      }

      return data as Profile
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(['user-profile', userId], savedData)
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
    },
  })

  return {
    profile,
    isLoading: isUserLoading || isProfileLoading,
    isError,
    error,
    refetch,
    saveProfile: saveProfileMutation.mutateAsync,
    isSaving: saveProfileMutation.isPending,
  }
}
