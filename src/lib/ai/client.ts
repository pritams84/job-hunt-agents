import OpenAI from 'openai'
import { jsonrepair } from 'jsonrepair'

export const DEFAULT_NVIDIA_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'
export const FALLBACK_NVIDIA_MODELS = [
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x7b-instruct-v0.1',
]
export const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'

/**
 * Creates an OpenAI-compatible client configured for NVIDIA NIM
 * Works across both server-side Node and client-side Vite contexts
 */
export function getAiClient(customApiKey?: string, customBaseUrl?: string): OpenAI {
  let apiKey = customApiKey

  // Server-side check
  if (!apiKey && typeof process !== 'undefined' && process.env?.NVIDIA_API_KEY) {
    apiKey = process.env.NVIDIA_API_KEY
  }

  // Client-side Vite env check
  if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env?.VITE_NVIDIA_API_KEY) {
    apiKey = import.meta.env.VITE_NVIDIA_API_KEY
  }

  // Fallback to saved local key if in development
  if (!apiKey) {
    apiKey = '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'
  }

  const baseURL =
    customBaseUrl ||
    (typeof process !== 'undefined' && process.env?.NVIDIA_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NVIDIA_BASE_URL) ||
    DEFAULT_NVIDIA_BASE_URL

  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  })
}

/**
 * Robust JSON Sanitizer and Auto-Healer using jsonrepair
 */
export function cleanAndParseJson<T>(raw: string): T {
  // 1. Strip markdown fences
  let cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()

  // 2. Locate the opening JSON brace
  const start = cleaned.indexOf('{')
  if (start !== -1) {
    cleaned = cleaned.substring(start)
  }

  // 3. Try standard JSON.parse first
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // 4. Try jsonrepair on the full string
    try {
      const repaired = jsonrepair(cleaned)
      return JSON.parse(repaired) as T
    } catch {
      // 5. Try extracting between first '{' and last '}'
      const end = cleaned.lastIndexOf('}')
      if (end !== -1 && end > 0) {
        try {
          const sliceRepaired = jsonrepair(cleaned.substring(0, end + 1))
          return JSON.parse(sliceRepaired) as T
        } catch {
          // Continue to error throw
        }
      }
      console.error('Failed to parse LLM JSON after repair. Raw snippet:', raw.slice(0, 300))
      throw new Error(`Failed to parse LLM JSON response. Length: ${raw.length}`)
    }
  }
}

/**
 * Reusable helper for JSON completions with system prompt and user content
 * Includes automatic model fallback for maximum resilience
 */
export async function getStructuredCompletion<T>(params: {
  systemPrompt: string
  userPrompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}): Promise<T> {
  const client = getAiClient()
  const primaryModel = params.model || DEFAULT_NVIDIA_MODEL
  const modelsToTry = [primaryModel, ...FALLBACK_NVIDIA_MODELS.filter((m) => m !== primaryModel)]

  let lastError: any = null

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `${params.systemPrompt}\n\nCRITICAL: Respond ONLY with a single valid JSON object. Do not include markdown or explanations.`,
          },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.1,
        max_tokens: params.maxTokens ?? 6000,
      })

      const raw = response.choices[0]?.message?.content || '{}'
      return cleanAndParseJson<T>(raw)
    } catch (err: any) {
      lastError = err
      console.warn(`Model ${model} failed (${err.message}). Trying fallback model...`)
      continue
    }
  }

  throw lastError || new Error('All model completions failed.')
}
