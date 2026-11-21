import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

// OpenRouter is a router in front of many upstream models, but its own API
// is OpenAI-chat-completions-compatible — same request/response shape as
// api.openai.com, confirmed against https://openrouter.ai/docs/api-reference.
// Requires its own separate account/key at https://openrouter.ai — an
// OPENAI_API_KEY will NOT authenticate here.
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface OpenRouterChatCompletionResponse {
  choices: { message: { content: string | null } }[]
  usage: { prompt_tokens: number; completion_tokens: number }
}

export const openrouterProvider: AIProvider = {
  name: 'openrouter',

  isConfigured() {
    return Boolean(process.env.OPENROUTER_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new AIProviderError('openrouter', 503, 'OpenRouter is not configured (missing OPENROUTER_API_KEY).')
    }

    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Attribution headers OpenRouter uses for its public leaderboards —
        // optional, but recommended by their docs. Not customer PII.
        'HTTP-Referer': 'https://unreal-bs.shop',
        'X-Title': 'UnReal Systems',
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        max_tokens: req.maxTokens ?? 1024,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.text()
      throw new AIProviderError('openrouter', res.status, `OpenRouter API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as OpenRouterChatCompletionResponse
    const content = data.choices?.[0]?.message?.content ?? ''

    return {
      content,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    }
  },
}
