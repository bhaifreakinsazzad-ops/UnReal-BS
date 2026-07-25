import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

// Moonshot's Kimi API is OpenAI-chat-completion-compatible in request/
// response shape, but requires its own separate account and API key at
// https://platform.moonshot.cn — an OPENAI_API_KEY will NOT authenticate here.
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

interface MoonshotChatCompletionResponse {
  choices: { message: { content: string | null } }[]
  usage: { prompt_tokens: number; completion_tokens: number }
}

export const moonshotProvider: AIProvider = {
  name: 'moonshot',

  isConfigured() {
    return Boolean(process.env.MOONSHOT_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.MOONSHOT_API_KEY
    if (!apiKey) {
      throw new AIProviderError('moonshot', 503, 'Moonshot is not configured (missing MOONSHOT_API_KEY).')
    }

    const res = await fetch(MOONSHOT_API_URL, {
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
      throw new AIProviderError('moonshot', res.status, `Moonshot API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as MoonshotChatCompletionResponse
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
