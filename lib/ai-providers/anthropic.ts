import 'server-only'
import type { AIProvider, ChatMessage, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

interface AnthropicMessagesResponse {
  content: { type: string; text?: string }[]
  usage: { input_tokens: number; output_tokens: number }
}

export const anthropicProvider: AIProvider = {
  name: 'anthropic',

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new AIProviderError('anthropic', 503, 'Anthropic is not configured (missing ANTHROPIC_API_KEY).')
    }

    // Anthropic's API shape differs from OpenAI's: system prompt is a
    // top-level `system` string, not a message with role 'system'.
    const systemText = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')
    const messages: Pick<ChatMessage, 'role' | 'content'>[] = req.messages
      .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))

    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model,
        system: systemText || undefined,
        messages,
        max_tokens: req.maxTokens ?? 1024,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.text()
      throw new AIProviderError('anthropic', res.status, `Anthropic API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as AnthropicMessagesResponse
    const content = data.content?.[0]?.text ?? ''

    return {
      content,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
    }
  },
}
