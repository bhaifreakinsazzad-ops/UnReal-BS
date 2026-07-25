import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface OpenAIChatCompletionResponse {
  choices: { message: { content: string | null } }[]
  usage: { prompt_tokens: number; completion_tokens: number }
}

export const openaiProvider: AIProvider = {
  name: 'openai',

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new AIProviderError('openai', 503, 'OpenAI is not configured (missing OPENAI_API_KEY).')
    }

    const res = await fetch(OPENAI_API_URL, {
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
      throw new AIProviderError('openai', res.status, `OpenAI API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as OpenAIChatCompletionResponse
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
