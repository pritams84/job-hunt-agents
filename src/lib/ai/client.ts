import OpenAI from 'openai'
import { jsonrepair } from 'jsonrepair'

export const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.2-11b-vision-instruct'
export const FALLBACK_NVIDIA_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.2-90b-vision-instruct',
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

  // 2. Extract first '{' to last '}'
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1)
  }

  // 3. Try standard JSON.parse first
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // 4. Auto-repair malformed JSON (unescaped quotes, control characters, trailing commas)
    try {
      const repaired = jsonrepair(cleaned)
      return JSON.parse(repaired) as T
    } catch (err: any) {
      console.error('Failed to parse LLM JSON after repair. Raw snippet:', raw.slice(0, 300))
      throw err
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
        max_tokens: params.maxTokens ?? 3000,
      })

      const raw = response.choices[0]?.message?.content || '{}'
      return cleanAndParseJson<T>(raw)
    } catch (err: any) {
      lastError = err
      // If error is 404/410, try the next fallback model in the list
      if (err.status === 404 || err.status === 410) {
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('All model completions failed.')
}
