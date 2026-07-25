import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

// Cerebras Inference is OpenAI-chat-completions-compatible — same
// request/response shape as api.openai.com, confirmed against
// https://inference-docs.cerebras.ai/api-reference/chat-completions.
// Requires its own separate account/key at https://cloud.cerebras.ai — an
// OPENAI_API_KEY will NOT authenticate here.
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions'

interface CerebrasChatCompletionResponse {
  choices: { message: { content: string | null } }[]
  usage: { prompt_tokens: number; completion_tokens: number }
}

export const cerebrasProvider: AIProvider = {
  name: 'cerebras',

  isConfigured() {
    return Boolean(process.env.CEREBRAS_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.CEREBRAS_API_KEY
    if (!apiKey) {
      throw new AIProviderError('cerebras', 503, 'Cerebras is not configured (missing CEREBRAS_API_KEY).')
    }

    const res = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
      throw new AIProviderError('cerebras', res.status, `Cerebras API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as CerebrasChatCompletionResponse
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
