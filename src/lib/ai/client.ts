import OpenAI from 'openai'

export const DEFAULT_NVIDIA_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'
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

  const baseURL = customBaseUrl ||
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
 * Reusable helper for JSON completions with system prompt and user content
 */
export async function getStructuredCompletion<T>(params: {
  systemPrompt: string
  userPrompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}): Promise<T> {
  const client = getAiClient()
  const model = params.model || DEFAULT_NVIDIA_MODEL

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ],
    temperature: params.temperature ?? 0.2,
    max_tokens: params.maxTokens ?? 2048,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content || '{}'
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    // If markdown wrapped ```json ... ```, strip it
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned) as T
  }
}
