import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'VITE_CLERK_PUBLISHABLE_KEY is required'),
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_STRIPE_PUBLISHABLE_KEY is required'),
})

const serverEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'CLERK_WEBHOOK_SECRET is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  NVIDIA_API_KEY: z.string().min(1, 'NVIDIA_API_KEY is required'),
  NVIDIA_BASE_URL: z.string().url().default('https://integrate.api.nvidia.com/v1'),
  NVIDIA_MODEL: z.string().default('nvidia/llama-3.1-nemotron-70b-instruct'),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

let clientEnv: ClientEnv | null = null
let serverEnv: ServerEnv | null = null

export function getClientEnv(): ClientEnv {
  if (clientEnv) return clientEnv
  
  const parsed = clientEnvSchema.safeParse(import.meta.env)
  
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const msg = Object.entries(errors)
      .map(([key, val]) => `${key}: ${val.join(', ')}`)
      .join('\n')
    throw new Error(`Client environment validation failed:\n${msg}`)
  }
  
  clientEnv = parsed.data
  return clientEnv
}

export function getServerEnv(): ServerEnv {
  if (serverEnv) return serverEnv
  
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() cannot be called in browser context')
  }
  
  const parsed = serverEnvSchema.safeParse(process.env)
  
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const msg = Object.entries(errors)
      .map(([key, val]) => `${key}: ${val.join(', ')}`)
      .join('\n')
    throw new Error(`Server environment validation failed:\n${msg}`)
  }
  
  serverEnv = parsed.data
  return serverEnv
}